<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CashBox extends Model
{
    use SoftDeletes;

    protected $table = 'cash_boxes';

    protected $fillable = [
        'uid', 'reference_no', 'type', 'description', 'credit', 'debit',
        'currency_id', 'bank_id', 'date_confirm', 'user_id', 'status',
    ];

    protected function casts(): array
    {
        return [
            'credit' => 'decimal:4',
            'debit' => 'decimal:4',
            'date_confirm' => 'date',
        ];
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }
}
