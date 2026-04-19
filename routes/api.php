<?php

use App\Http\Controllers\API\AgencyController;
use App\Http\Controllers\API\AgencyLedgerController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\BankController;
use App\Http\Controllers\API\CashBoxController;
use App\Http\Controllers\API\CurrencyController;
use App\Http\Controllers\API\CustomerController;
use App\Http\Controllers\API\CustomerLedgerController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\DepositController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\IncomeLedgerController;
use App\Http\Controllers\API\LedgerController;
use App\Http\Controllers\API\MoneyExchangeController;
use App\Http\Controllers\API\MoneyTransferController;
use App\Http\Controllers\API\ReceivedHawalaController;
use App\Http\Controllers\API\ReferenceController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SendHawalaController;
use App\Http\Controllers\API\SystemSettingController;
use App\Http\Controllers\API\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/references/{type}', [ReferenceController::class, 'next']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard/admin', [DashboardController::class, 'superAdmin']);
        
        Route::get('system-settings', [SystemSettingController::class, 'index']);
        Route::post('system-settings', [SystemSettingController::class, 'update']);

        Route::apiResource('users', UserManagementController::class);
        
        // Income ledger and reports might be admin-only or shared? Keeping them for now.
        Route::get('income-ledger', [IncomeLedgerController::class, 'index']);
        Route::get('income-ledger/{income_ledger}', [IncomeLedgerController::class, 'show']);
        Route::get('reports/income', [ReportController::class, 'income']);
    });

    // Routes available to both Admin and Data Entry
    Route::middleware('role:admin,user')->group(function () {
        Route::apiResource('currencies', CurrencyController::class);
        Route::apiResource('agencies', AgencyController::class);
        Route::apiResource('banks', BankController::class);
        Route::apiResource('customers', CustomerController::class);

        Route::apiResource('customer-ledgers', CustomerLedgerController::class);
        Route::apiResource('agency-ledgers', AgencyLedgerController::class);

        Route::apiResource('send-hawala', SendHawalaController::class);
        Route::post('send-hawala/{send_hawala}/cancel', [SendHawalaController::class, 'cancel']);
        Route::get('send-hawala/agency/{agencyId}/next-no', [SendHawalaController::class, 'getNextHawalaNo']);
        Route::get('send-hawala/pay-options', [SendHawalaController::class, 'getPayOptions']);
        Route::post('send-hawala/{send_hawala}/confirm', [SendHawalaController::class, 'confirm']);
        Route::get('send-hawala/{send_hawala}/print', [SendHawalaController::class, 'printPreview']);

        Route::apiResource('receive-hawala', ReceivedHawalaController::class);
        Route::post('receive-hawala/{receive_hawala}/cancel', [ReceivedHawalaController::class, 'cancel']);

        Route::apiResource('money-exchanges', MoneyExchangeController::class);
        Route::post('money-exchanges/{money_exchange}/cancel', [MoneyExchangeController::class, 'cancel']);

        Route::apiResource('money-transfers', MoneyTransferController::class);
        Route::post('money-transfers/{money_transfer}/cancel', [MoneyTransferController::class, 'cancel']);

        Route::apiResource('deposits', DepositController::class);
        Route::apiResource('expenses', ExpenseController::class);

        Route::apiResource('cash-box', CashBoxController::class);
        Route::get('cashbox/balance', [CashBoxController::class, 'balance']);

        Route::get('ledger/customer/{customer}', [LedgerController::class, 'customer']);
        Route::get('ledger/agency/{agency}', [LedgerController::class, 'agency']);
        Route::get('ledger/balances/{kind}/{id}', [LedgerController::class, 'balances']);
        Route::get('ledger/summary/{kind}', [LedgerController::class, 'summary']);

        Route::get('reports/cashbox', [ReportController::class, 'cashbox']);
        Route::get('reports/cashbox-diff', [ReportController::class, 'cashboxDiff']);
        
        Route::get('/dashboard/user', [DashboardController::class, 'agent']); // Simple user dashboard
    });
});
