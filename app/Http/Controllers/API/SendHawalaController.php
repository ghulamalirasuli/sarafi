<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\SendHawala;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SendHawalaController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = SendHawala::query()->orderByDesc('id');

        if ($request->filled('sender_currency')) {
            $q->where('sender_currency', $request->query('sender_currency'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $customerIds = Customer::query()
                    ->where(function ($w) use ($search) {
                        $w->where('fullname', 'like', "%{$search}%")
                            ->orWhere('uid', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->limit(500)
                    ->pluck('id');

                $agencyIds = Agency::query()
                    ->where(function ($w) use ($search) {
                        $w->where('agency_name', 'like', "%{$search}%")
                            ->orWhere('agency_responsible', 'like', "%{$search}%")
                            ->orWhere('uid', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->limit(500)
                    ->pluck('id');

                $q->where(function ($w) use ($search, $customerIds, $agencyIds) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('hawala_no', 'like', "%{$search}%")
                        ->orWhere('sender', 'like', "%{$search}%")
                        ->orWhere('receiver', 'like', "%{$search}%")
                        ->orWhere('reciever_agency', 'like', "%{$search}%")
                        ->orWhere('sender_currency', 'like', "%{$search}%")
                        ->orWhere('exchange_currency', 'like', "%{$search}%")
                        ->orWhere('source_name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('comment', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");

                    if ($customerIds->isNotEmpty()) {
                        $w->orWhereIn('sender_customer_id', $customerIds)
                            ->orWhereIn('receiver_customer_id', $customerIds);
                    }
                    if ($agencyIds->isNotEmpty()) {
                        $w->orWhereIn('agency_id', $agencyIds);
                    }
                });
            }
        }

        return $this->paginateIndex($request, $q, 20);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('SH');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('SH');
        $data['user_id'] = $user->id;

        // Set required fields with defaults
        $data['date_confirm'] = $request->input('date') ?? now()->toDateString();
        
        // Map receiver to reciever (database column is misspelled)
        if (isset($data['receiver'])) {
            $data['reciever'] = $data['receiver'];
            unset($data['receiver']);
        }
        
        // Map agency field to reciever_agency if provided
        // Frontend sends agency UID, we need to convert to agency ID
        if ($request->has('agency')) {
            $agencyIdentifier = $request->input('agency');
            
            // Try to find agency by UID or ID
            $agency = Agency::where('uid', $agencyIdentifier)
                ->orWhere('id', $agencyIdentifier)
                ->first();
            
            if (!$agency) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => ['agency' => ['The selected agency is invalid.']]
                ], 422);
            }
            
            $data['reciever_agency'] = $agency->id;
        }
        
        // Ensure reciever_agency is set
        if (empty($data['reciever_agency'])) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['agency' => ['The agency field is required.']]
            ], 422);
        }
        
        // Set hawala_no if not provided
        if (empty($data['hawala_no'])) {
            $data['hawala_no'] = '1'; // Default value
        }

        // Commission Calculation
        $percent = null;
        $com = 0; // Initialize commission amount
        $commissionType = $request->input('comission');
        if ($commissionType == "Percentage") {
            $percent = $request->input('percent_amount');
            $senderAmount = (float) $request->input('sender_amount');
            $percentageValue = (float) $percent;
            $com = ($senderAmount * $percentageValue) / 100;
        } else { // Manual
            $com = (float) $request->input('com_amount');
        }
        $data['percent'] = $percent;
        $data['com_amount'] = $com; // Store the calculated commission amount
        $data['comission'] = $commissionType; // Store the commission type

        // Convert currency UIDs to IDs if needed
        $data['sender_currency'] = $this->getCurrencyId($request->input('sender_currency'));
        $data['com_currency'] = $this->getCurrencyId($request->input('com_currency'));
        
        if (!$data['sender_currency']) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['sender_currency' => ['The selected sender currency is invalid.']]
            ], 422);
        }
        
        if (!$data['com_currency']) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => ['com_currency' => ['The selected commission currency is invalid.']]
            ], 422);
        }

        // Exchange Amount Calculation
        $hawalaType = $request->input('hawala_type');
        $senderAmount = (float) $request->input('sender_amount');
        $rate = (float) $request->input('rate', 1); // Default to 1 if not provided
        $formula = $request->input('formula');
        $exchangeAmount = $senderAmount; // Default value

        if ($hawalaType === "Exchange") {
            $exchangeCurrencyInput = $request->input('exchange_currency');
            $data['exchange_currency'] = $this->getCurrencyId($exchangeCurrencyInput);
            
            if (!$data['exchange_currency']) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => ['exchange_currency' => ['The selected exchange currency is invalid.']]
                ], 422);
            }
            
            if ($formula === "Division") {
                $exchangeAmount = $senderAmount / $rate;
            } elseif ($formula === "Multiply") {
                $exchangeAmount = $senderAmount * $rate;
            }
        } else {
            $data['exchange_currency'] = $data['sender_currency'];
        }

        $data['exchange_amount'] = $exchangeAmount;
        $data['formulas'] = ($formula === '0' || empty($formula)) ? '' : $formula; // Use 'formulas' (plural) to match DB column
        
        // Normalize status to match database enum (capitalize first letter)
        if (isset($data['status'])) {
            $data['status'] = ucfirst(strtolower($data['status']));
        } else {
            $data['status'] = 'Pending'; // Default status
        }

        $row = DB::transaction(function () use ($data) {
            $h = SendHawala::query()->create($data);
            if (strtolower($h->status) === 'confirmed') {
                $this->ledgerPosting->postSendHawala($h);
            }

            return $h;
        });

        return response()->json($row, 201);
    }

    public function show(SendHawala $sendHawala): JsonResponse
    {
        return response()->json($sendHawala);
    }

    public function update(Request $request, SendHawala $sendHawala): JsonResponse
    {
        $data = $this->validated($request, false);

        $row = DB::transaction(function () use ($sendHawala, $data) {
            $sendHawala->update($data);
            $fresh = $sendHawala->fresh();
            if ($fresh->status === 'confirmed' && ! $this->alreadyPosted($fresh)) {
                $this->ledgerPosting->postSendHawala($fresh);
            }

            return $fresh;
        });

        return response()->json($row);
    }

    public function destroy(SendHawala $sendHawala): JsonResponse
    {
        $sendHawala->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function cancel(Request $request, SendHawala $sendHawala): JsonResponse
    {
        $sendHawala->update([
            'status' => 'cancelled',
            'cancel_date' => now(),
            'cancel_by' => $request->user()->id,
        ]);

        return response()->json($sendHawala->fresh());
    }

    public function getNextHawalaNo(Request $request, string $agencyId): JsonResponse
    {
        $lastRecord = SendHawala::where('reciever_agency', $agencyId)
            ->latest('hawala_no')
            ->first();
        
        $nextNo = $lastRecord ? ($lastRecord->hawala_no + 1) : 1;
        
        return response()->json(['hawala_no' => $nextNo]);
    }

    public function getPayOptions(): JsonResponse
    {
        return response()->json([
            'customers' => Customer::select('id', 'fullname as label')->get(),
            'banks' => \App\Models\Bank::select('id', 'bankname as label', 'accountnumber')->get(),
        ]);
    }

    public function confirm(Request $request, SendHawala $sendHawala): JsonResponse
    {
        if ($sendHawala->status !== 'pending') {
            return response()->json(['error' => 'Can only confirm pending hawala'], 400);
        }

        $validated = $request->validate([
            'pay_type' => 'required|in:cash,customer,bank',
            'source_id' => 'nullable|required_if:pay_type,customer,bank',
            'source_name' => 'nullable|string',
            'new_hawala_no' => 'nullable|string',
            'docs' => 'nullable|array',
            'date_update' => 'nullable|date',
        ]);

        DB::transaction(function () use ($sendHawala, $validated) {
            $sendHawala->update(array_merge([
                'status' => 'confirmed',
                'due_type' => $validated['pay_type'],
                'source_name' => $validated['source_name'] ?? $this->getSourceDisplay($validated['pay_type'], $validated['source_id']),
                'new_hawala_no' => $validated['new_hawala_no'] ?? '',
                'date_update' => $validated['date_update'] ?? now(),
                'docs' => $validated['docs'] ?? $sendHawala->docs,
            ], $request->only(['exchange_amount', 'com_amount', 'rate'])));

            $this->ledgerPosting->postSendHawala($sendHawala->fresh());
        });

        return response()->json($sendHawala->fresh());
    }

    public function printPreview(SendHawala $sendHawala): JsonResponse
    {
        $hawala = SendHawala::select([
            'send_hawala.*',
            \DB::raw('(SELECT agency_name FROM agencies WHERE id = send_hawala.reciever_agency) as Agency'),
            \DB::raw('(SELECT currency_name FROM currencies WHERE id = send_hawala.sender_currency) as RCurrency'),
            \DB::raw('(SELECT currency_name FROM currencies WHERE id = send_hawala.exchange_currency) as ECurrency'),
            \DB::raw('(SELECT currency_name FROM currencies WHERE id = send_hawala.com_currency) as CCurrency'),
        ])->find($sendHawala->id);

        $html = view('send_hawala.print_preview', compact('hawala'))->render();
        
        return response()->json(['html' => $html]);
    }

    private function getSourceDisplay(string $payType, ?string $sourceId): string
    {
        return match($payType) {
            'cash' => 'Cash',
            'customer' => Customer::find($sourceId)?->fullname ?? '',
            'bank' => \App\Models\Bank::find($sourceId)?->bankname ?? '',
            default => '',
        };
    }

    private function getCurrencyId($currencyIdentifier): ?int
    {
        if (empty($currencyIdentifier)) {
            return null;
        }
        
        // If it's already a numeric ID, validate it exists
        if (is_numeric($currencyIdentifier)) {
            $currency = \App\Models\Currency::find($currencyIdentifier);
            return $currency ? $currency->id : null;
        }
        
        // Otherwise, try to find by uid or currency_name
        $currency = \App\Models\Currency::where('uid', $currencyIdentifier)
            ->orWhere('currency_name', $currencyIdentifier)
            ->first();
        
        return $currency ? $currency->id : null;
    }

    protected function alreadyPosted(SendHawala $h): bool
    {
        return CustomerLedger::query()
            ->where('reference_no', $h->reference_no)
            ->where('source', 'send_hawala')
            ->exists();
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string', 'max:100'],
            'reciever_agency' => ['nullable', 'integer', 'exists:agencies,id'],
            'agency' => ['nullable', 'string'], // Accept agency UID or ID from frontend
            'agency_id' => ['nullable', 'exists:agencies,id'],
            'hawala_no' => ['nullable', 'string'],
            'sender' => ['required', 'string'],
            'receiver' => ['required', 'string'], // Frontend sends 'receiver', we map to 'reciever' in store()
            'reciever' => ['sometimes', 'string'], // Also accept 'reciever' for backward compatibility
            'sender_customer_id' => ['nullable', 'exists:customers,id'],
            'receiver_customer_id' => ['nullable', 'exists:customers,id'],
            'sender_currency' => ['required'], // Accept both string (UID/name) and integer (ID)
            'sender_amount' => ['required', 'numeric'],
            'hawala_type' => ['required', 'string', 'in:Simple,Exchange'],
            'percent_amount' => ['nullable', 'numeric', 'required_if:comission,Percentage'],
            'comission' => ['required', 'string', 'in:Manual,Percentage'],
            'com_amount' => ['required', 'numeric'],
            'com_currency' => ['required'], // Accept both string (UID/name) and integer (ID)
            'rate' => ['nullable', 'numeric', 'required_if:hawala_type,Exchange'],
            'formula' => ['nullable', 'string', 'in:Multiply,Division,0', 'required_if:hawala_type,Exchange'],
            'exchange_currency' => ['nullable', 'required_if:hawala_type,Exchange'], // Accept both string and integer
            'exchange_amount' => ['nullable', 'numeric'],
            'due_type' => ['nullable', 'string'],
            'source_name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'comment' => ['nullable', 'string'],
            'docs' => ['nullable', 'array'],
            'date' => ['nullable', 'date'], // Accept date field from frontend
            'date_confirm' => ['nullable', 'date'],
            'branch' => ['nullable', 'string'], // Accept branch field from frontend (but won't be used)
            'status' => ['sometimes', 'in:pending,confirmed,cancelled,Pending,Confirmed,Cancelled'],
        ]);
    }
}
