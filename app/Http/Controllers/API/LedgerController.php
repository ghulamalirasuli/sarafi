<?php

namespace App\Http\Controllers\API;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AgencyLedger;
use App\Models\CustomerLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    public function customer(Request $request, int $customerId): JsonResponse
    {
        $user = $request->user();
        if ($user->role === UserRole::Customer && (int) $user->customer_id !== $customerId) {
            abort(403);
        }

        $customer = \App\Models\Customer::findOrFail($customerId);

        $q = CustomerLedger::query()
            ->with('currency')
            ->where('customer_id', $customerId)
            ->orderBy('created_at')
            ->orderBy('id');

        if ($request->filled('currency_id')) {
            $q->where('currency_id', $request->query('currency_id'));
        }
        if ($request->filled('date_from')) {
            $q->whereDate('date_confirm', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('date_confirm', '<=', $request->query('date_to'));
        }

        $rows = $q->get();
        $balances = [];
        $out = [];
        foreach ($rows as $r) {
            $cid = $r->currency_id;
            if (!isset($balances[$cid])) {
                $balances[$cid] = 0;
            }
            $balances[$cid] += (float) $r->credit - (float) $r->debit;
            $out[] = [
                'reference_no' => $r->reference_no,
                'bill_no' => $r->bill_no,
                'description' => $r->description,
                'credit' => $r->credit,
                'debit' => $r->debit,
                'balance' => $balances[$cid],
                'currency_id' => $cid,
                'currency_name' => $r->currency?->currency_name,
                'source' => $r->source,
                'date' => $r->date_confirm?->format('Y-m-d'),
            ];
        }

        return response()->json(['data' => $out, 'customer' => $customer]);
    }

    public function balances(Request $request, string $kind, int $id): JsonResponse
    {
        if ($kind === 'customer') {
            $q = CustomerLedger::query()->where('customer_id', $id);
        } else {
            $q = AgencyLedger::query()->where('agency_id', $id);
        }

        $balances = $q->join('currencies', 'currency_id', '=', 'currencies.id')
            ->select([
                'currencies.id',
                'currencies.currency_name',
                \Illuminate\Support\Facades\DB::raw('SUM(credit) as total_credit'),
                \Illuminate\Support\Facades\DB::raw('SUM(debit) as total_debit'),
                \Illuminate\Support\Facades\DB::raw('SUM(credit) - SUM(debit) as balance'),
            ])
            ->groupBy('currencies.id', 'currencies.currency_name')
            ->get();

        return response()->json(['balances' => $balances]);
    }

    public function summary(Request $request, string $kind): JsonResponse
    {
        if ($kind === 'customer') {
            $entities = \App\Models\Customer::query()->orderBy('fullname')->get(['id', 'fullname as name']);
            $ledgerTable = 'customer_ledgers';
            $entityIdCol = 'customer_id';
        } else {
            $entities = \App\Models\Agency::query()->orderBy('agency_name')
                ->get(['id', 'agency_name', 'agency_responsible']);
            
            // Map agency to name: Responsible (Agency Name)
            $entities = $entities->map(function($a) {
                return (object)[
                    'id' => $a->id,
                    'name' => "{$a->agency_responsible} ({$a->agency_name})"
                ];
            });

            $ledgerTable = 'agency_ledgers';
            $entityIdCol = 'agency_id';
        }

        $balances = \Illuminate\Support\Facades\DB::table($ledgerTable)
            ->join('currencies', "{$ledgerTable}.currency_id", '=', 'currencies.id')
            ->select([
                "{$ledgerTable}.{$entityIdCol} as entity_id",
                'currencies.id as currency_id',
                'currencies.currency_name',
                \Illuminate\Support\Facades\DB::raw('SUM(credit) - SUM(debit) as balance'),
            ])
            ->groupBy("{$ledgerTable}.{$entityIdCol}", 'currencies.id', 'currencies.currency_name')
            ->get();

        $out = [];
        foreach ($entities as $e) {
            $eb = $balances->where('entity_id', $e->id);
            $bals = [];
            foreach ($eb as $b) {
                $bals[] = [
                    'currency_id' => $b->currency_id,
                    'currency_name' => $b->currency_name,
                    'balance' => $b->balance,
                ];
            }
            $out[] = [
                'id' => $e->id,
                'name' => $e->name,
                'balances' => $bals,
            ];
        }

        return response()->json(['data' => $out]);
    }

    public function agency(Request $request, int $agencyId): JsonResponse
    {
        $agency = \App\Models\Agency::findOrFail($agencyId);
        $displayName = "{$agency->agency_responsible} ({$agency->agency_name})";

        $q = AgencyLedger::query()
            ->with('currency')
            ->where('agency_id', $agencyId)
            ->orderBy('created_at')
            ->orderBy('id');

        if ($request->filled('currency_id')) {
            $q->where('currency_id', $request->query('currency_id'));
        }
        if ($request->filled('date_from')) {
            $q->whereDate('date_confirm', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('date_confirm', '<=', $request->query('date_to'));
        }

        $rows = $q->get();
        $balances = [];
        $out = [];
        foreach ($rows as $r) {
            $cid = $r->currency_id;
            if (!isset($balances[$cid])) {
                $balances[$cid] = 0;
            }
            $balances[$cid] += (float) $r->credit - (float) $r->debit;
            $out[] = [
                'reference_no' => $r->reference_no,
                'bill_no' => $r->bill_no,
                'description' => $r->description,
                'credit' => $r->credit,
                'debit' => $r->debit,
                'balance' => $balances[$cid],
                'currency_id' => $cid,
                'currency_name' => $r->currency?->currency_name,
                'source' => 'agency',
                'date' => $r->date_confirm?->format('Y-m-d'),
            ];
        }

        return response()->json(['data' => $out, 'agency_name' => $displayName]);
    }
}
