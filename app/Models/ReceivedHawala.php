<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReceivedHawala extends Model
{
    use SoftDeletes;

    protected $table = 'recieved_hawalas';

    protected $fillable = [
        'uid', 'reference_no', 'sender_agency', 'agency_id', 'hawala_no', 'sender', 'reciever',
        'sender_customer_id', 'receiver_customer_id', 'reciever_currency', 'reciever_amount',
        'hawala_type', 'percent', 'comission', 'formulas', 'new_hawala_no', 'rate',
        'exchange_currency', 'exchange_amount', 'due_type', 'source_name', 'description',
        'comment', 'docs', 'date_confirm', 'user_id', 'status', 'cancel_date', 'cancel_by',
    ];

    protected function casts(): array
    {
        return [
            'docs' => 'array',
            'date_confirm' => 'date',
            'cancel_date' => 'datetime',
        ];
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }
}
