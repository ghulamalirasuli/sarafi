<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\MoneyTransfer;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MoneyTransferController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = MoneyTransfer::query()->orderByDesc('id');

        if ($request->filled('currency_id')) {
            $q->where('currency_id', $request->query('currency_id'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $currencyIds = Currency::query()
                    ->where('currency_name', 'like', "%{$search}%")
                    ->limit(200)
                    ->pluck('id');

                $customerIds = Customer::query()
                    ->where(function ($w) use ($search) {
                        $w->where('fullname', 'like', "%{$search}%")
                            ->orWhere('uid', 'like', "%{$search}%")
                            ->orWhere('mobile', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->limit(500)
                    ->pluck('id');

                $q->where(function ($w) use ($search, $currencyIds, $customerIds) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('bill_no1', 'like', "%{$search}%")
                        ->orWhere('bill_no2', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('amount', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");

                    if ($currencyIds->isNotEmpty()) {
                        $w->orWhereIn('currency_id', $currencyIds);
                    }
                    if ($customerIds->isNotEmpty()) {
                        $w->orWhereIn('from_customer', $customerIds)
                            ->orWhereIn('to_customer', $customerIds);
                    }
                });
            }
        }

        return $this->paginateIndex($request, $q, 20);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'from_customer' => 'required|not_in:0',
            'to_customer' => 'required|not_in:0',
            'amount' => 'required|numeric',
            'currency' => 'required',
        ]);

        $reference_no = "MT" . date('ymdhis');

        $cur = Currency::where('id', $request->currency)->first();
        $from_customer = Customer::where('id', $request->from_customer)->first();
        $to_customer = Customer::where('id', $request->to_customer)->first();

        $from_desc = 'Amount ' . $request->amount . ' ' . ($cur->currency_name ?? '')
            . ' from customer ' . ($to_customer->fullname ?? '')
            . ' with Check No. ' . $request->billno2 . ' transferred.';

        if (!empty(trim($request->description))) {
            $from_desc .= ' ' . trim($request->description);
        }

        $to_desc = 'Amount ' . $request->amount . ' ' . ($cur->currency_name ?? '')
            . ' from customer ' . ($from_customer->fullname ?? '')
            . ' with Check No. ' . $request->billno1 . ' transferred.';

        if (!empty(trim($request->description))) {
            $to_desc .= ' ' . trim($request->description);
        }

        DB::transaction(function () use ($request, $reference_no, $from_desc, $to_desc) {
            MoneyTransfer::create([
                'uid' => UidGenerator::make('MT'),
                'reference_no' => $reference_no,
                'from_customer'  => $request->from_customer,
                'bill_no1'      => $request->billno1,
                'to_customer'  => $request->to_customer,
                'bill_no2'      => $request->billno2,
                'currency_id'  => $request->currency,
                'amount'       => $request->amount,
                'description'  => $request->description,
                'date_confirm' => $request->date ?? now()->toDateString(),
                'user_name'    => Auth::user()->username,
                'user_id'      => Auth::user()->id,
                'update_user_name' => '',
                'update_user_id'  => '',
                'status'          => 'pending',
            ]);

            CustomerLedger::create([
                'uid' => UidGenerator::make('CL'),
                'reference_no' => $reference_no,
                'customer_id'  => $request->from_customer,
                'bill_no'      => $request->billno1,
                'description'  => $from_desc,
                'credit'       => 0,
                'debit'        => $request->amount,
                'currency_id'  => $request->currency,
                'date_confirm' => $request->date ?? now()->toDateString(),
                'user_id'      => Auth::user()->id,
                'status'       => 'pending',
                'source'       => 'Transfer',
            ]);

            CustomerLedger::create([
                'uid' => UidGenerator::make('CL'),
                'reference_no' => $reference_no,
                'customer_id'  => $request->to_customer,
                'bill_no'      => $request->billno2,
                'description'  => $to_desc,
                'credit'       => $request->amount,
                'debit'        => 0,
                'currency_id'  => $request->currency,
                'date_confirm' => $request->date ?? now()->toDateString(),
                'user_id'      => Auth::user()->id,
                'status'       => 'pending',
                'source'       => 'Transfer',
            ]);
        });

        return response()->json(['message' => 'Customer Ledger has been created successfully.'], 201);
    }

    public function show(Request $request, MoneyTransfer $moneyTransfer): JsonResponse
    {
        return response()->json($moneyTransfer);
    }

    public function update(Request $request, MoneyTransfer $moneyTransfer): JsonResponse
    {
        $data = $this->validated($request, false);

        $row = DB::transaction(function () use ($moneyTransfer, $data) {
            $moneyTransfer->update($data);
            
            if (isset($data['status'])) {
                $status = strtolower($data['status']);
                CustomerLedger::where('reference_no', $moneyTransfer->reference_no)->update(['status' => $status]);
            }
            
            return $moneyTransfer->fresh();
        });

        return response()->json($row);
    }

    public function destroy(Request $request, MoneyTransfer $moneyTransfer): JsonResponse
    {
        DB::transaction(function () use ($moneyTransfer) {
            CustomerLedger::where('reference_no', $moneyTransfer->reference_no)->delete();
            $moneyTransfer->delete();
        });
        return response()->json(['message' => 'Deleted']);
    }

    public function cancel(Request $request, MoneyTransfer $moneyTransfer): JsonResponse
    {
        DB::transaction(function () use ($request, $moneyTransfer) {
            $moneyTransfer->update([
                'status' => 'cancelled',
                'cancel_date' => now(),
                'cancel_by' => $request->user()->id,
            ]);
            CustomerLedger::where('reference_no', $moneyTransfer->reference_no)->update(['status' => 'cancelled']);
        });

        return response()->json($moneyTransfer->fresh());
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string'],
            'from_customer' => [$required ? 'required' : 'nullable', 'exists:customers,id'],
            'to_customer' => [$required ? 'required' : 'nullable', 'exists:customers,id'],
            'bill_no1' => ['nullable', 'string'],
            'bill_no2' => ['nullable', 'string'],
            'amount' => [$required ? 'required' : 'nullable', 'numeric'],
            'currency_id' => [$required ? 'required' : 'nullable', 'exists:currencies,id'],
            'date_confirm' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled,Pending,Confirmed,Cancelled'],
        ]);
    }
}
