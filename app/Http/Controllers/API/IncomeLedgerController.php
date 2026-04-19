<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\IncomeLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeLedgerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = IncomeLedger::query()->orderByDesc('id');
        return $this->paginateIndex($request, $q, 40);
    }

    public function show(Request $request, IncomeLedger $incomeLedger): JsonResponse
    {
        return response()->json($incomeLedger);
    }
}
