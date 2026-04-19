<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashBox;
use App\Models\DifCashBox;
use App\Models\IncomeLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function cashbox(Request $request): JsonResponse
    {
        $rows = CashBox::query()
            ->whereNull('bank_id')
            ->select([
                'currency_id',
                DB::raw('SUM(credit) as credit_total'),
                DB::raw('SUM(debit) as debit_total'),
            ])
            ->groupBy('currency_id')
            ->get()
            ->map(fn ($r) => [
                'currency_id' => $r->currency_id,
                'credit_total' => $r->credit_total,
                'debit_total' => $r->debit_total,
                'balance' => $r->credit_total - $r->debit_total,
            ]);

        return response()->json(['data' => $rows]);
    }

    public function income(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $q = IncomeLedger::query()
            ->select([
                'due_type',
                'currency_id',
                DB::raw('SUM(credit - debit) as net'),
            ])
            ->groupBy('due_type', 'currency_id');

        if ($request->filled('date_from')) {
            $q->whereDate('date_confirm', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('date_confirm', '<=', $request->query('date_to'));
        }

        return response()->json(['data' => $q->get()]);
    }

    public function cashboxDiff(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $rows = DifCashBox::query()
            ->whereDate('snapshot_date', $request->query('date'))
            ->get();

        return response()->json(['data' => $rows]);
    }
}
