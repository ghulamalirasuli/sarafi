<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Bank;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Bank::query()->orderBy('bankname');

        if ($search = $request->query('search')) {
            $q->where(function ($w) use ($search) {
                $w->where('bankname', 'like', "%{$search}%")
                    ->orWhere('bankaccount', 'like', "%{$search}%")
                    ->orWhere('accountnumber', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        return $this->paginateIndex($request, $q, 25);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('BK');

        $bank = Bank::query()->create($data);

        return response()->json($bank, 201);
    }

    public function show(Bank $bank): JsonResponse
    {
        return response()->json($bank);
    }

    public function update(Request $request, Bank $bank): JsonResponse
    {
        $bank->update($this->validated($request, false));

        return response()->json($bank->fresh());
    }

    public function destroy(Bank $bank): JsonResponse
    {
        $bank->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'bankname' => [$required ? 'required' : 'sometimes', 'string', 'max:255'],
            'bankaccount' => ['nullable', 'string', 'max:255'],
            'accountnumber' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
