<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CustomerLedger;
use App\Services\UidGenerator;
use App\Services\ReferenceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerLedgerController extends Controller
{
    public function __construct(
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = CustomerLedger::query()->with(['customer', 'currency'])->orderByDesc('id');

        if ($request->filled('customer_id')) {
            $q->where('customer_id', $request->query('customer_id'));
        }
        if ($request->filled('currency_id')) {
            $q->where('currency_id', $request->query('currency_id'));
        }
        if ($request->filled('search')) {
            $search = $request->query('search');
            $q->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                  ->orWhere('bill_no', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $this->paginateIndex($request, $q, 30);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('CL');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('CL');
        $data['user_id'] = Auth::id();
        $data['source'] = 'manual';
        $data['status'] = 'confirmed';

        $row = CustomerLedger::create($data);

        return response()->json($row->load(['customer', 'currency']), 201);
    }

    public function show(CustomerLedger $customerLedger): JsonResponse
    {
        return response()->json($customerLedger->load(['customer', 'currency']));
    }

    public function update(Request $request, CustomerLedger $customerLedger): JsonResponse
    {
        $customerLedger->update($this->validated($request, false));

        return response()->json($customerLedger->fresh()->load(['customer', 'currency']));
    }

    public function destroy(CustomerLedger $customerLedger): JsonResponse
    {
        $customerLedger->delete();
        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'customer_id' => [$required ? 'required' : 'sometimes', 'exists:customers,id'],
            'currency_id' => [$required ? 'required' : 'sometimes', 'exists:currencies,id'],
            'reference_no' => ['nullable', 'string'],
            'bill_no' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'credit' => ['nullable', 'numeric'],
            'debit' => ['nullable', 'numeric'],
            'date_confirm' => ['nullable', 'date'],
        ]);
    }
}
