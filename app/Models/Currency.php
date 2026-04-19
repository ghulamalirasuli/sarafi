<?php

namespace App\Models;

use Database\Factories\CurrencyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    /** @use HasFactory<CurrencyFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uid', 'currency_name', 'rate', 'status', 'is_default',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:8',
            'is_default' => 'boolean',
        ];
    }
}
