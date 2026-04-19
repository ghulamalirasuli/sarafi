<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CurrencyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Currency::query()->orderBy('currency_name');
        if ($search = $request->query('search')) {
            $q->where(function ($w) use ($search) {
                $w->where('currency_name', 'like', "%{$search}%")
                    ->orWhere('rate', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        return $this->paginateIndex($request, $q, 50);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('CR');

        $currency = DB::transaction(function () use ($data) {
            if (! empty($data['is_default'])) {
                Currency::query()->update(['is_default' => false]);
            }

            return Currency::query()->create($data);
        });

        return response()->json($currency, 201);
    }

    public function show(Currency $currency): JsonResponse
    {
        return response()->json($currency);
    }

    public function update(Request $request, Currency $currency): JsonResponse
    {
        $data = $this->validated($request, false);

        $currency = DB::transaction(function () use ($currency, $data) {
            if (array_key_exists('is_default', $data) && $data['is_default']) {
                Currency::query()->update(['is_default' => false]);
            }
            $currency->update($data);

            return $currency->fresh();
        });

        return response()->json($currency);
    }

    public function destroy(Currency $currency): JsonResponse
    {
        $currency->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'currency_name' => [$required ? 'required' : 'sometimes', 'string', 'max:50'],
            'rate' => [$required ? 'required' : 'sometimes', 'numeric'],
            'status' => ['nullable', 'string', 'max:50'],
            'is_default' => ['sometimes', 'boolean'],
        ]);
    }
}
