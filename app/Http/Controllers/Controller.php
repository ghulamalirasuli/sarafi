<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Paginate an Eloquent query using optional `per_page` (capped) and `page` query params.
     */
    protected function paginateIndex(Request $request, Builder $query, int $defaultPerPage = 25, int $maxPerPage = 200): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', $defaultPerPage), $maxPerPage));

        return response()->json($query->paginate($perPage));
    }
}
