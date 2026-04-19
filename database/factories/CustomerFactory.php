<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Services\UidGenerator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'uid' => UidGenerator::make('CU'),
            'fullname' => fake()->name(),
            'mobile' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'address' => fake()->address(),
            'is_active' => true,
        ];
    }
}
