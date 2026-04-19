<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DifCashBox extends Model
{
    protected $table = 'dif_cash_boxes';

    protected $fillable = [
        'uid', 'currency_id', 'snapshot_date',
        'expected_balance', 'actual_balance', 'difference',
    ];

    protected function casts(): array
    {
        return [
            'snapshot_date' => 'date',
            'expected_balance' => 'decimal:4',
            'actual_balance' => 'decimal:4',
            'difference' => 'decimal:4',
        ];
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }
}
