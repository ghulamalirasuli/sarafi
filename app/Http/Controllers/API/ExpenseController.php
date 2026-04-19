<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = Expense::query()->orderByDesc('id');

        if ($request->filled('currency')) {
            $q->where('currency', $request->query('currency'));
        }

        if ($request->filled('date_from')) {
            $q->whereDate('created_at', '>=', $request->query('date_from'));
        }

        if ($request->filled('date_to')) {
            $q->whereDate('created_at', '<=', $request->query('date_to'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $q->where(function ($w) use ($search) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('currency', 'like', "%{$search}%")
                        ->orWhere('amount', 'like', "%{$search}%")
                        ->orWhere('market_amount', 'like', "%{$search}%")
                        ->orWhere('rate_amount', 'like', "%{$search}%")
                        ->orWhere('benefit', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                });
            }
        }

        return $this->paginateIndex($request, $q, 20);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('EX');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('EX');
        $data['user_id'] = $user->id;

        $row = DB::transaction(function () use ($data) {
            $e = Expense::query()->create($data);
            if ($e->status === 'confirmed') {
                $this->ledgerPosting->syncExpense($e);
            }

            return $e;
        });

        return response()->json($row, 201);
    }

    public function show(Request $request, Expense $expense): JsonResponse
    {
        return response()->json($expense);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $this->validated($request, false);

        $row = DB::transaction(function () use ($expense, $data) {
            $expense->update($data);
            $fresh = $expense->fresh();
            if ($fresh->status === 'confirmed') {
                $this->ledgerPosting->syncExpense($fresh);
            }

            return $fresh;
        });

        return response()->json($row);
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $expense->delete();
        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'reference_no' => ['nullable', 'string'],
            'currency' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'amount' => ['nullable', 'numeric'],
            'market_amount' => ['nullable', 'numeric'],
            'rate_amount' => ['nullable', 'numeric'],
            'benefit' => ['nullable', 'numeric'],
            'date_confirm' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled'],
        ]);
    }
}
