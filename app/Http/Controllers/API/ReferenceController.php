<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ReferenceNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    public function __construct(
        protected ReferenceNumberService $references
    ) {}

    public function next(Request $request, string $type): JsonResponse
    {
        $map = [
            'send-hawala' => 'SH',
            'receive-hawala' => 'RH',
            'money-exchange' => 'FX',
            'money-transfer' => 'MT',
            'customer-deposit' => 'CD',
            'agency-deposit' => 'AD',
            'deposit' => 'DP',
            'expense' => 'EX',
            'cash-box' => 'CB',
        ];

        $prefix = $map[$type] ?? strtoupper(str_replace('-', '', $type));

        return response()->json([
            'reference_no' => $this->references->next($prefix),
        ]);
    }
}
