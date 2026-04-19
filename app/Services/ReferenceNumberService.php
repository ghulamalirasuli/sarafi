<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReferenceNumberService
{
    public function next(string $prefix): string
    {
        $key = $prefix;
        $seq = (int) DB::table('reference_sequences')->where('key', $key)->value('last_value');

        $next = $seq + 1;

        DB::table('reference_sequences')->updateOrInsert(
            ['key' => $key],
            ['last_value' => $next, 'updated_at' => now()]
        );

        return sprintf('%s-%06d', strtoupper($prefix), $next);
    }
}
