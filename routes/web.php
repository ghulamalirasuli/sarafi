<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SendHawalaController;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware(['auth'])->group(function () {
    Route::resource('send_hawala', SendHawalaController::class);
    Route::get('send_hawala/gethawalano/{agencyid}', [SendHawalaController::class, 'gethawalano']);
    Route::get('send_hawala/gethawalano2/{agencyid}', [SendHawalaController::class, 'gethawalano2']);
    Route::get('send_hawala/getdue_type/{due_type}', [SendHawalaController::class, 'getdue_type']);
    Route::put('send_hawala/pay/{id}', [SendHawalaController::class, 'pay'])->name('send_hawala.pay');
    Route::get('send_hawala/printPreview/{id}', [SendHawalaController::class, 'printPreview'])->name('send_hawala.printPreview');
    Route::get('send_hawala/cancel/{id}', [SendHawalaController::class, 'cancel'])->name('send_hawala.cancel');
    Route::get('send_hawala/uncancel/{id}', [SendHawalaController::class, 'uncancel'])->name('send_hawala.uncancel');
});
