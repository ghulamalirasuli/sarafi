<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Models\CustomerLedger;
use App\Models\AgencyLedger;
use App\Models\CashBox;
use App\Services\LedgerPostingService;
use App\Services\ReferenceNumberService;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepositController extends Controller
{
    public function __construct(
        protected LedgerPostingService $ledgerPosting,
        protected ReferenceNumberService $references
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = Deposit::query()
            ->with(['customer', 'agency', 'user', 'bank'])
            ->orderByDesc('id');

        if ($request->filled('target_type')) {
            $q->where('target_type', $request->query('target_type'));
        }

        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }

        if ($request->filled('currency')) {
            $q->where('currency', $request->query('currency'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $q->where(function ($w) use ($search) {
                    $w->where('reference_no', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('bill_no', 'like', "%{$search}%")
                        ->orWhere('currency', 'like', "%{$search}%")
                        ->orWhere('exchange_currency', 'like', "%{$search}%")
                        ->orWhere('source', 'like', "%{$search}%")
                        ->orWhere('source_name', 'like', "%{$search}%")
                        ->orWhere('target_type', 'like', "%{$search}%")
                        ->orWhere('deposit_type', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($cq) use ($search) {
                            $cq->where('fullname', 'like', "%{$search}%")
                                ->orWhere('uid', 'like', "%{$search}%")
                                ->orWhere('mobile', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('agency', function ($aq) use ($search) {
                            $aq->where('agency_name', 'like', "%{$search}%")
                                ->orWhere('agency_responsible', 'like', "%{$search}%")
                                ->orWhere('uid', 'like', "%{$search}%")
                                ->orWhere('mobile', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
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

        return $this->paginateIndex($request, $q, 20);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->validated($request);
        if (($data['deposit_type'] ?? null) !== 'bank_transfer') {
            $data['bank_id'] = null;
        }
        $data['uid'] = UidGenerator::make('DP');
        $data['reference_no'] = $data['reference_no'] ?? $this->references->next('DP');
        $data['user_id'] = $user->id;

        // Ensure amount is sync'd with credit/debit for backwards compatibility or reports
        $data['amount'] = max($data['credit'] ?? 0, $data['debit'] ?? 0);

        $row = DB::transaction(function () use ($data) {
            $d = Deposit::query()->create($data);
            if ($d->status === 'confirmed') {
                $this->ledgerPosting->postDeposit($d);
            }
            return $d;
        });

        return response()->json($row, 201);
    }

    public function show(Deposit $deposit): JsonResponse
    {
        return response()->json($deposit->load(['customer', 'agency', 'user', 'bank']));
    }

    public function update(Request $request, Deposit $deposit): JsonResponse
    {
        $data = $this->validated($request, false);
        if (($data['deposit_type'] ?? $deposit->deposit_type) !== 'bank_transfer') {
            $data['bank_id'] = null;
        }
        if (isset($data['credit']) || isset($data['debit'])) {
            $data['amount'] = max($data['credit'] ?? $deposit->credit, $data['debit'] ?? $deposit->debit);
        }

        $row = DB::transaction(function () use ($deposit, $data) {
            $oldStatus = $deposit->status;
            
            // If it was already confirmed, we must reverse BEFORE update
            if ($oldStatus === 'confirmed') {
                CustomerLedger::where('reference_no', $deposit->reference_no)->delete();
                AgencyLedger::where('reference_no', $deposit->reference_no)->delete();
                CashBox::where('reference_no', $deposit->reference_no)->delete();
            }

            $deposit->update($data);
            $fresh = $deposit->fresh();

            // If it is now confirmed (or remained confirmed), we must post AFTER update
            if ($fresh->status === 'confirmed') {
                $this->ledgerPosting->postDeposit($fresh);
            }

            return $fresh;
        });

        return response()->json($row);
    }

    public function destroy(Deposit $deposit): JsonResponse
    {
        DB::transaction(function () use ($deposit) {
            // If it was confirmed, we should ideally reverse the ledger entries
            // For now, just delete the record as requested
            
            // Delete related ledger entries
            CustomerLedger::where('reference_no', $deposit->reference_no)->delete();
            AgencyLedger::where('reference_no', $deposit->reference_no)->delete();
            CashBox::where('reference_no', $deposit->reference_no)->delete();

            $deposit->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'target_type' => [$required ? 'required' : 'sometimes', 'in:customer,agency'],
            'customer_id' => ['nullable', 'required_if:target_type,customer', 'exists:customers,id'],
            'agency_id' => ['nullable', 'required_if:target_type,agency', 'exists:agencies,id'],
            'reference_no' => ['nullable', 'string'],
            'bill_no' => ['nullable', 'string'],
            'deposit_type' => ['nullable', 'in:cash,bank_transfer,hawala_settlement'],
            'bank_id' => ['nullable', 'required_if:deposit_type,bank_transfer', 'exists:banks,id'],
            'currency' => ['nullable', 'string'],
            'debit' => ['nullable', 'numeric'],
            'credit' => ['nullable', 'numeric'],
            'amount' => ['nullable', 'numeric'],
            'formula' => ['nullable', 'string'],
            'rate' => ['nullable', 'numeric'],
            'exchange_currency' => ['nullable', 'string'],
            'exchange_amount' => ['nullable', 'numeric'],
            'description' => ['nullable', 'string'],
            'source' => ['nullable', 'string'],
            'source_name' => ['nullable', 'string'],
            'date_confirm' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:pending,confirmed,cancelled'],
            'remark' => ['nullable', 'string'],
        ]);
    }
}
