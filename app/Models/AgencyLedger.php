<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AgencyLedger extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uid', 'reference_no', 'bill_no', 'description', 'credit', 'debit',
        'agency_id', 'user_id', 'currency_id', 'date_confirm', 'status',
    ];

    protected function casts(): array
    {
        return [
            'credit' => 'decimal:4',
            'debit' => 'decimal:4',
            'date_confirm' => 'date',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }
}
