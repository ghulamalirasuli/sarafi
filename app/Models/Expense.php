<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uid', 'reference_no', 'currency', 'description', 'amount', 'market_amount',
        'rate_amount', 'benefit', 'date_confirm', 'user_id', 'status',
        'cancel_date', 'cancel_by',
    ];

    protected function casts(): array
    {
        return [
            'date_confirm' => 'date',
            'cancel_date' => 'datetime',
        ];
    }
}
