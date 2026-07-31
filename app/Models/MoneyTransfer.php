<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MoneyTransfer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'uid', 'reference_no', 'from_customer', 'bill_no1', 'to_customer', 'bill_no2',
        'amount', 'currency_id', 'description', 'user_id', 'user_name', 'status',
        'cancel_date', 'cancel_by', 'date_confirm', 'update_user_name', 'update_user_id',
    ];

    protected function casts(): array
    {
        return [
            'cancel_date' => 'datetime',
            'date_confirm' => 'date',
        ];
    }
}
