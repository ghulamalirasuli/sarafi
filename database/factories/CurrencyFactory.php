<?php

namespace Database\Factories;

use App\Models\Currency;
use App\Services\UidGenerator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Currency>
 */
class CurrencyFactory extends Factory
{
    protected $model = Currency::class;

    public function definition(): array
    {
        return [
            'uid' => UidGenerator::make('CR'),
            'currency_name' => fake()->currencyCode(),
            'rate' => 1,
            'status' => '1',
            'is_default' => false,
        ];
    }
}
