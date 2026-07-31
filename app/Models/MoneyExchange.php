<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MoneyExchange extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uid', 'reference_no', 'pay_type', 'customer_id', 'from_currency', 'to_currency', 'market_rate', 'rate', 'action',
        'amount', 'market_amount', 'rate_amount', 'benefit', 'description',
        'user_id', 'user_name', 'status', 'cancel_date', 'cancel_by',
        'date_confirm', 'update_user_name', 'update_user_id', 'source'
    ];

    protected function casts(): array
    {
        return [
            'cancel_date' => 'datetime',
            'date_confirm' => 'date',
        ];
    }
}
