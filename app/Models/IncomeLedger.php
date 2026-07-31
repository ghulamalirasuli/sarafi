<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IncomeLedger extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'income_ledger';

    protected $fillable = [
        'uid', 'reference_no', 'description', 'credit', 'debit', 'due_type',
        'currency', 'date_confirm', 'date_update', 'user_name', 'user_id',
        'update_user_name', 'update_user_id', 'status',
        'deleted_by', 'restored_date'
    ];

    public function currency()
    {
        return $this->belongsTo(Currency::class, 'currency');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
