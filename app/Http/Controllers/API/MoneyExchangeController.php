<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashBox;
use App\Models\Currency;
use App\Models\MoneyExchange;
use App\Models\IncomeLedger;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MoneyExchangeController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = MoneyExchange::query()->orderByDesc('id');

        if ($request->filled('from_currency')) {
            $q->where('from_currency', $request->query('from_currency'));
        }

        if ($request->filled('to_currency')) {
            $q->where('to_currency', $request->query('to_currency'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $currencyIds = Currency::query()
                    ->where('currency_name', 'like', "%{$search}%")
                    ->limit(200)
                    ->pluck('id');

                $q->where(function ($w) use ($search, $currencyIds) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('amount', 'like', "%{$search}%")
                        ->orWhere('market_amount', 'like', "%{$search}%")
                        ->orWhere('rate_amount', 'like', "%{$search}%")
                        ->orWhere('rate', 'like', "%{$search}%")
                        ->orWhere('market_rate', 'like', "%{$search}%")
                        ->orWhere('benefit', 'like', "%{$search}%");

                    if ($currencyIds->isNotEmpty()) {
                        $w->orWhereIn('from_currency', $currencyIds)
                            ->orWhereIn('to_currency', $currencyIds);
                    }
                });
            }
        }

        return $this->paginateIndex($request, $q, 20);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buy_amount' => 'required',
            'market_rate' => 'required',
            'rate' => 'required',
            'paytype' => 'required',
            'customer' => 'required_if:paytype,Customer',
        ]);

        $reference_no = "ME" . date('ymdhis');

        $benefit = $request->market_sell_amount - $request->sell_amount;
        $type = ' ';
        if ($request->paytype == "Customer") {
            $customer = Customer::where('id', $request->customer)->first();
            $type = ' =' . ($customer->fullname ?? '');
        }

        DB::transaction(function () use ($request, $reference_no, $benefit, $type) {
            MoneyExchange::create([
                'uid'           => UidGenerator::make('FX'),
                'reference_no'  => $reference_no,
                'pay_type'      => $request->paytype,
                'from_currency' => $request->from_currency,
                'to_currency'   => $request->to_currency,
                'market_rate'   => $request->market_rate,
                'rate'          => $request->rate,
                'amount'        => $request->buy_amount,
                'market_amount' => $request->market_sell_amount,
                'rate_amount'   => $request->sell_amount,
                'benefit'       => $benefit,
                'description'   => $request->description,
                'date_confirm'  => $request->date ?? now()->toDateString(),
                'user_name'     => Auth::user()->username,
                'user_id'       => Auth::user()->id,
                'update_user_name' => '',
                'update_user_id' => '',
                'source'        => $request->paytype . ' ' . $type,
                'status'        => 'pending',
            ]);

            IncomeLedger::create([
                'uid'           => UidGenerator::make('IL'),
                'reference_no'  => $reference_no,
                'credit'        => $benefit,
                'debit'         => 0,
                'currency'      => $request->to_currency,
                'description'   => $request->description,
                'due_type'      => 'Exchange',
                'date_confirm'  => $request->date ?? now()->toDateString(),
                'user_name'     => Auth::user()->username,
                'user_id'       => Auth::user()->id,
                'update_user_name' => '',
                'update_user_id' => '',
                'status'        => 'pending',
            ]);

            if ($request->paytype == "Cash") {
                CashBox::create([
                    'uid'          => UidGenerator::make('CB'),
                    'reference_no' => $reference_no,
                    'type'         => 'Cash Exchange',
                    'description'  => $request->get('description'),
                    'credit'       => '0',
                    'debit'        => $request->get('sell_amount'),
                    'currency_id'  => $request->get('to_currency'),
                    'date_confirm' => $request->get('date') ?? now()->toDateString(),
                    'user_id'      => Auth::user()->id,
                    'status'       => 'pending',
                ]);

                CashBox::create([
                    'uid'           => UidGenerator::make('CB'),
                    'reference_no'  => $reference_no,
                    'type'          => 'Cash Exchange',
                    'description'   => $request->get('description'),
                    'credit'        => $request->get('buy_amount'),
                    'debit'         => '0',
                    'currency_id'   => $request->get('from_currency'),
                    'date_confirm'  => $request->get('date') ?? now()->toDateString(),
                    'user_id'       => Auth::user()->id,
                    'status'        => 'pending',
                ]);
            } elseif ($request->paytype == "Customer") {
                CustomerLedger::create([
                    'uid'           => UidGenerator::make('CL'),
                    'reference_no'  => $reference_no,
                    'customer_id'   => $request->get('customer'),
                    'description'   => $request->get('description'),
                    'credit'        => '0',
                    'debit'         => $request->get('sell_amount'),
                    'currency_id'   => $request->get('to_currency'),
                    'date_confirm'  => $request->get('date') ?? now()->toDateString(),
                    'user_id'       => Auth::user()->id,
                    'status'        => 'pending',
                    'source'        => 'Exchange',
                ]);

                CustomerLedger::create([
                    'uid'           => UidGenerator::make('CL'),
                    'reference_no'  => $reference_no,
                    'customer_id'   => $request->get('customer'),
                    'description'   => $request->get('description'),
                    'credit'        => $request->get('buy_amount'),
                    'debit'         => '0',
                    'currency_id'   => $request->get('from_currency'),
                    'date_confirm'  => $request->get('date') ?? now()->toDateString(),
                    'user_id'       => Auth::user()->id,
                    'status'        => 'pending',
                    'source'        => 'Exchange',
                ]);
            }
        });

        return response()->json(['message' => 'Money Exchange has been created successfully.'], 201);
    }

    public function show(Request $request, MoneyExchange $moneyExchange): JsonResponse
    {
        return response()->json($moneyExchange);
    }

    public function update(Request $request, MoneyExchange $moneyExchange): JsonResponse
    {
        $data = $this->validated($request, false);

        $row = DB::transaction(function () use ($moneyExchange, $data) {
            $moneyExchange->update($data);

            if (isset($data['status'])) {
                $status = strtolower($data['status']);
                IncomeLedger::where('reference_no', $moneyExchange->reference_no)->update(['status' => $status]);
                CashBox::where('reference_no', $moneyExchange->reference_no)->update(['status' => $status]);
                CustomerLedger::where('reference_no', $moneyExchange->reference_no)->update(['status' => $status]);
            }

            return $moneyExchange->fresh();
        });

        return response()->json($row);
    }

    public function destroy(Request $request, MoneyExchange $moneyExchange): JsonResponse
    {
        DB::transaction(function () use ($moneyExchange) {
            IncomeLedger::where('reference_no', $moneyExchange->reference_no)->delete();
            CashBox::where('reference_no', $moneyExchange->reference_no)->delete();
            CustomerLedger::where('reference_no', $moneyExchange->reference_no)->delete();
            $moneyExchange->delete();
        });
        return response()->json(['message' => 'Deleted']);
    }

    public function cancel(Request $request, MoneyExchange $moneyExchange): JsonResponse
    {
        DB::transaction(function () use ($request, $moneyExchange) {
            $moneyExchange->update([
                'status' => 'cancelled',
                'cancel_date' => now(),
                'cancel_by' => $request->user()->id,
            ]);
            IncomeLedger::where('reference_no', $moneyExchange->reference_no)->update(['status' => 'cancelled']);
            CashBox::where('reference_no', $moneyExchange->reference_no)->update(['status' => 'cancelled']);
            CustomerLedger::where('reference_no', $moneyExchange->reference_no)->update(['status' => 'cancelled']);
        });

        return response()->json($moneyExchange->fresh());
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string'],
            'pay_type' => ['nullable', 'string'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'from_currency' => ['nullable', 'exists:currencies,id'],
            'to_currency' => ['nullable', 'exists:currencies,id'],
            'market_rate' => ['nullable', 'numeric'],
            'rate' => ['nullable', 'numeric'],
            'action' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
            'market_amount' => ['nullable', 'numeric'],
            'rate_amount' => ['nullable', 'numeric'],
            'benefit' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled,Pending,Confirmed,Cancelled'],
        ]);
    }
}
