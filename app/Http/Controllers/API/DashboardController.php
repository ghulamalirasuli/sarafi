<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CashBox;
use App\Models\IncomeLedger;
use App\Models\MoneyExchange;
use App\Models\ReceivedHawala;
use App\Models\SendHawala;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function superAdmin(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $txToday = SendHawala::query()->whereDate('created_at', $today)->count()
            + ReceivedHawala::query()->whereDate('created_at', $today)->count()
            + MoneyExchange::query()->whereDate('created_at', $today)->count();

        $pendingCount = SendHawala::query()->where('status', 'pending')->count()
            + ReceivedHawala::query()->where('status', 'pending')->count()
            + MoneyExchange::query()->where('status', 'pending')->count();

        $incomeToday = IncomeLedger::query()
            ->whereDate('date_confirm', $today)
            ->selectRaw('SUM(credit - debit) as net')
            ->value('net');

        $sendHawalaPending = SendHawala::query()->where('status', 'pending')->count();
        $sendHawalaConfirmed = SendHawala::query()->where('status', 'confirmed')->count();
        $receiveHawalaPending = ReceivedHawala::query()->where('status', 'pending')->count();
        $receiveHawalaConfirmed = ReceivedHawala::query()->where('status', 'confirmed')->count();

        $cashSummary = CashBox::query()
            ->join('currencies', 'cash_boxes.currency_id', '=', 'currencies.id')
            ->select([
                'currencies.currency_name',
                DB::raw('SUM(CASE WHEN bank_id IS NULL THEN credit - debit ELSE 0 END) as cash_balance'),
                DB::raw('SUM(CASE WHEN bank_id IS NOT NULL THEN credit - debit ELSE 0 END) as bank_balance'),
            ])
            ->groupBy('currencies.currency_name')
            ->get();

        return response()->json([
            'summary' => [
                'transactions_today' => $txToday,
                'income_today' => $incomeToday ?? 0,
                'pending_transactions' => $pendingCount,
                'send_hawala_pending' => $sendHawalaPending,
                'send_hawala_confirmed' => $sendHawalaConfirmed,
                'receive_hawala_pending' => $receiveHawalaPending,
                'receive_hawala_confirmed' => $receiveHawalaConfirmed,
            ],
            'cash_summary' => $cashSummary,
        ]);
    }

    public function agent(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        $sendCount = SendHawala::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();

        $recvCount = ReceivedHawala::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();

        $fxCount = MoneyExchange::query()
            ->where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->count();

        return response()->json([
            'summary' => [
                'send_hawala' => $sendCount,
                'receive_hawala' => $recvCount,
                'exchanges' => $fxCount,
            ]
        ]);
    }
}
