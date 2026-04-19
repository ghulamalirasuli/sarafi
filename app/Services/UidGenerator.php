<?php

namespace App\Services;

use Illuminate\Support\Str;

class UidGenerator
{
    public static function make(string $prefix = 'UID'): string
    {
        return sprintf('%s-%s', $prefix, strtoupper(Str::random(4)));
    }
}
