<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\ReceivedHawala;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceivedHawalaController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = ReceivedHawala::query()->orderByDesc('id');

        if ($request->filled('reciever_currency')) {
            $q->where('reciever_currency', $request->query('reciever_currency'));
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
                        ->orWhere('new_hawala_no', 'like', "%{$search}%")
                        ->orWhere('sender', 'like', "%{$search}%")
                        ->orWhere('reciever', 'like', "%{$search}%")
                        ->orWhere('sender_agency', 'like', "%{$search}%")
                        ->orWhere('reciever_currency', 'like', "%{$search}%")
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
        $data['uid'] = UidGenerator::make('RH');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('RH');
        $data['user_id'] = $user->id;

        $row = DB::transaction(function () use ($data) {
            $h = ReceivedHawala::query()->create($data);
            if ($h->status === 'confirmed') {
                $this->ledgerPosting->postReceivedHawala($h);
            }

            return $h;
        });

        return response()->json($row, 201);
    }

    public function show(ReceivedHawala $receive_hawala): JsonResponse
    {
        return response()->json($receive_hawala);
    }

    public function update(Request $request, ReceivedHawala $receive_hawala): JsonResponse
    {
        $data = $this->validated($request, false);

        $row = DB::transaction(function () use ($receive_hawala, $data) {
            $receive_hawala->update($data);
            $fresh = $receive_hawala->fresh();
            if ($fresh->status === 'confirmed' && ! $this->alreadyPosted($fresh)) {
                $this->ledgerPosting->postReceivedHawala($fresh);
            }

            return $fresh;
        });

        return response()->json($row);
    }

    public function destroy(ReceivedHawala $receive_hawala): JsonResponse
    {
        $receive_hawala->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function cancel(Request $request, ReceivedHawala $receive_hawala): JsonResponse
    {
        $receive_hawala->update([
            'status' => 'cancelled',
            'cancel_date' => now(),
            'cancel_by' => $request->user()->id,
        ]);

        return response()->json($receive_hawala->fresh());
    }

    protected function alreadyPosted(ReceivedHawala $h): bool
    {
        return CustomerLedger::query()
            ->where('reference_no', $h->reference_no)
            ->where('source', 'recieved_hawala')
            ->exists();
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string'],
            'sender_agency' => ['nullable', 'string'],
            'agency_id' => ['nullable', 'exists:agencies,id'],
            'hawala_no' => ['nullable', 'string'],
            'sender' => ['nullable', 'string'],
            'reciever' => ['nullable', 'string'],
            'sender_customer_id' => ['nullable', 'exists:customers,id'],
            'receiver_customer_id' => ['nullable', 'exists:customers,id'],
            'reciever_currency' => ['nullable', 'string'],
            'reciever_amount' => ['nullable', 'numeric'],
            'hawala_type' => ['nullable', 'string'],
            'percent' => ['nullable', 'numeric'],
            'comission' => ['nullable', 'numeric'],
            'formulas' => ['nullable', 'string'],
            'new_hawala_no' => ['nullable', 'string'],
            'rate' => ['nullable', 'numeric'],
            'exchange_currency' => ['nullable', 'string'],
            'exchange_amount' => ['nullable', 'numeric'],
            'due_type' => ['nullable', 'string'],
            'source_name' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'comment' => ['nullable', 'string'],
            'docs' => ['nullable', 'array'],
            'date_confirm' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled'],
        ]);
    }
}
