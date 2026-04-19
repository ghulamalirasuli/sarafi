<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Currency;
use App\Models\Customer;
use App\Models\User;
use App\Services\UidGenerator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Currency::query()->firstOrCreate(
            ['currency_name' => 'USD'],
            [
                'uid' => UidGenerator::make('CR'),
                'rate' => 1,
                'status' => '1',
                'is_default' => true,
            ],
        );

        // Admin User
        User::query()->updateOrCreate(
            ['username' => 'admin'],
            [
                'uid' => User::query()->where('username', 'admin')->value('uid') ?? UidGenerator::make('US'),
                'fullname' => 'Administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => UserRole::Admin,
                'is_active' => true,
                'is_deletable' => false,
            ],
        );

        // Simple User
        User::query()->updateOrCreate(
            ['username' => 'staff'],
            [
                'uid' => User::query()->where('username', 'staff')->value('uid') ?? UidGenerator::make('US'),
                'fullname' => 'Simple User',
                'email' => 'staff@example.com',
                'password' => Hash::make('password'),
                'role' => UserRole::User,
                'is_active' => true,
                'is_deletable' => true,
            ],
        );

        // Demo Customer
        Customer::query()->firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'uid' => UidGenerator::make('CU'),
                'fullname' => 'Demo Customer',
                'mobile' => '0700000001',
                'address' => 'Kabul',
                'is_active' => true,
            ],
        );
    }
}
