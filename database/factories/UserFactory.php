<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\UidGenerator;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'uid' => UidGenerator::make('US'),
            'fullname' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'mobile' => fake()->phoneNumber(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::User,
            'customer_id' => null,
            'address' => null,
            'is_active' => true,
            'is_deletable' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'role' => UserRole::Admin,
            'is_deletable' => false,
        ]);
    }
}
