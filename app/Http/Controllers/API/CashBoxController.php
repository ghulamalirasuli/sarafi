<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashBox;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashBoxController extends Controller
{
    public function __construct(
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = CashBox::query()->with(['currency', 'bank'])->orderByDesc('id');

        if ($request->filled('bank_id')) {
            $q->where('bank_id', $request->query('bank_id'));
        } else {
            $q->whereNull('bank_id');
        }

        if ($request->filled('currency_id')) {
            $q->where('currency_id', $request->query('currency_id'));
        }

        if ($request->filled('type')) {
            $q->where('type', $request->query('type'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $q->where(function ($w) use ($search) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('credit', 'like', "%{$search}%")
                        ->orWhere('debit', 'like', "%{$search}%")
                        ->orWhereHas('currency', function ($cq) use ($search) {
                            $cq->where('currency_name', 'like', "%{$search}%")
                                ->orWhere('uid', 'like', "%{$search}%");
                        })
                        ->orWhereHas('bank', function ($bq) use ($search) {
                            $bq->where('bankname', 'like', "%{$search}%")
                                ->orWhere('bankaccount', 'like', "%{$search}%")
                                ->orWhere('accountnumber', 'like', "%{$search}%")
                                ->orWhere('uid', 'like', "%{$search}%");
                        });
                });
            }
        }

        return $this->paginateIndex($request, $q, 30);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('CB');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('CB');
        $data['user_id'] = $user->id;

        $row = CashBox::query()->create($data);

        return response()->json($row->load(['currency', 'bank']), 201);
    }

    public function show(Request $request, CashBox $cashBox): JsonResponse
    {
        return response()->json($cashBox->load(['currency', 'bank']));
    }

    public function update(Request $request, CashBox $cashBox): JsonResponse
    {
        $cashBox->update($this->validated($request, false));

        return response()->json($cashBox->fresh()->load(['currency', 'bank']));
    }

    public function destroy(Request $request, CashBox $cashBox): JsonResponse
    {
        $cashBox->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function balance(Request $request): JsonResponse
    {
        $request->validate([
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'type' => ['nullable', 'string'],
        ]);

        $query = CashBox::query()
            ->join('currencies', 'cash_boxes.currency_id', '=', 'currencies.id')
            ->select([
                'currencies.id as currency_id',
                'currencies.currency_name',
                DB::raw('SUM(cash_boxes.credit) as credit_total'),
                DB::raw('SUM(cash_boxes.debit) as debit_total'),
                DB::raw('SUM(cash_boxes.credit) - SUM(cash_boxes.debit) as balance'),
            ])
            ->groupBy('currencies.id', 'currencies.currency_name');

        if ($request->filled('currency_id')) {
            $query->where('cash_boxes.currency_id', $request->query('currency_id'));
        }
        if ($request->filled('bank_id')) {
            $query->where('cash_boxes.bank_id', $request->query('bank_id'));
        } else {
            $query->whereNull('cash_boxes.bank_id');
        }
        if ($request->filled('type')) {
            $query->where('cash_boxes.type', $request->query('type'));
        }

        $balances = $query->get();

        return response()->json([
            'balances' => $balances,
        ]);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'credit' => ['nullable', 'numeric'],
            'debit' => ['nullable', 'numeric'],
            'currency_id' => [$required ? 'required' : 'sometimes', 'exists:currencies,id'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'date_confirm' => ['nullable', 'date'],
            'status' => ['sometimes', 'string'],
        ]);
    }
}
