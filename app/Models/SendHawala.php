<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SendHawala extends Model
{
    use SoftDeletes;

    protected $table = 'send_hawala';

    protected $fillable = [
        'uid', 'reference_no', 'reciever_agency', 'agency_id', 'hawala_no', 'sender', 'reciever',
        'sender_customer_id', 'receiver_customer_id', 'sender_currency', 'sender_amount',
        'hawala_type', 'formulas', 'percent', 'comission', 'com_currency', 'com_amount', 'rate', 'exchange_currency',
        'exchange_amount', 'due_type', 'source_name', 'description', 'comment', 'docs',
        'date_confirm', 'date_update', 'user_id', 'status', 'cancel_date', 'cancel_by',
    ];

    protected function casts(): array
    {
        return [
            'docs' => 'array',
            'date_confirm' => 'date',
            'date_update' => 'datetime',
            'cancel_date' => 'datetime',
        ];
    }



    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }
}
