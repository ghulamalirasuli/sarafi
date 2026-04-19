<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AgencyLedger;
use App\Services\UidGenerator;
use App\Services\ReferenceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AgencyLedgerController extends Controller
{
    public function __construct(
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = AgencyLedger::query()->with(['agency', 'currency'])->orderByDesc('id');

        if ($request->filled('agency_id')) {
            $q->where('agency_id', $request->query('agency_id'));
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
        $data['uid'] = UidGenerator::make('AL');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('AL');
        $data['user_id'] = Auth::id();
        $data['source'] = 'manual';
        $data['status'] = 'confirmed';

        $row = AgencyLedger::create($data);

        return response()->json($row->load(['agency', 'currency']), 201);
    }

    public function show(AgencyLedger $agencyLedger): JsonResponse
    {
        return response()->json($agencyLedger->load(['agency', 'currency']));
    }

    public function update(Request $request, AgencyLedger $agencyLedger): JsonResponse
    {
        $agencyLedger->update($this->validated($request, false));

        return response()->json($agencyLedger->fresh()->load(['agency', 'currency']));
    }

    public function destroy(AgencyLedger $agencyLedger): JsonResponse
    {
        $agencyLedger->delete();
        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'agency_id' => [$required ? 'required' : 'sometimes', 'exists:agencies,id'],
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
