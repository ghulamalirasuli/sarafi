<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deposit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uid', 'reference_no', 'target_type', 'customer_id', 'agency_id', 'bill_no', 'deposit_type', 'currency', 
        'bank_id', 'amount', 'debit', 'credit',
        'formula', 'rate', 'exchange_currency', 'exchange_amount', 'description',
        'source', 'source_name', 'date_confirm', 'user_id', 'status', 'remark',
        'cancel_date', 'cancel_by',
    ];

    protected function casts(): array
    {
        return [
            'date_confirm' => 'date',
            'cancel_date' => 'datetime',
            'debit' => 'decimal:4',
            'credit' => 'decimal:4',
            'amount' => 'decimal:4',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }
}
