<?php

use App\Models\Currency;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

it('only allows one default currency', function () {
    $admin = User::query()->where('username', 'superadmin')->firstOrFail();
    Sanctum::actingAs($admin);

    $this->postJson('/api/currencies', [
        'currency_name' => 'EUR',
        'rate' => 1.1,
        'status' => 'active',
        'is_default' => true,
    ])->assertCreated();

    $defaults = Currency::query()->where('is_default', true)->count();
    expect($defaults)->toBe(1);
});
