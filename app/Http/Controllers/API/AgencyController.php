<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Agency::query()->orderBy('agency_name');
        if ($search = $request->query('search')) {
            $q->where(function ($w) use ($search) {
                $w->where('agency_name', 'like', "%{$search}%")
                    ->orWhere('agency_responsible', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('uid', 'like', "%{$search}%");
            });
        }

        return $this->paginateIndex($request, $q, 25);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('AG');

        $agency = Agency::query()->create($data);

        return response()->json($agency, 201);
    }

    public function show(Agency $agency): JsonResponse
    {
        return response()->json($agency);
    }

    public function update(Request $request, Agency $agency): JsonResponse
    {
        $agency->update($this->validated($request, false));

        return response()->json($agency->fresh());
    }

    public function destroy(Agency $agency): JsonResponse
    {
        $agency->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true): array
    {
        return $request->validate([
            'agency_name' => [$required ? 'required' : 'sometimes', 'string', 'max:255'],
            'agency_responsible' => ['nullable', 'string', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }
}
