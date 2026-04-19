<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Customer::query()->orderBy('fullname');

        if ($search = $request->query('search')) {
            $q->where(function ($w) use ($search) {
                $w->where('fullname', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        return $this->paginateIndex($request, $q, 25);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('CU');

        $customer = Customer::query()->create($data);

        return response()->json($customer, 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $customer->update($this->validated($request, false));

        return response()->json($customer->fresh());
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'fullname' => [$required ? 'required' : 'sometimes', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
