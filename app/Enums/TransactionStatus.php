<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
}
