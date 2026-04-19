<?php

namespace App\Http\Controllers\API;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\UidGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 30), 500));
        $search = $request->query('search');
        $role = $request->query('role');

        $applyFilters = function ($query) use ($search, $request): void {
            if ($search) {
                $query->where(function ($w) use ($search) {
                    $w->where('fullname', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('uid', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%");
                });
            }
            if ($request->filled('is_active')) {
                $active = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($active !== null) {
                    $query->where('is_active', $active);
                }
            }
        };

        $countsBase = User::query();
        $applyFilters($countsBase);
        $roleCounts = (clone $countsBase)
            ->selectRaw('role, COUNT(*) as aggregate')
            ->groupBy('role')
            ->pluck('aggregate', 'role');

        $q = User::query()->orderBy('fullname');
        $applyFilters($q);
        if ($role && UserRole::tryFrom((string) $role)) {
            $q->where('role', $role);
        }

        $paginator = $q->paginate($perPage);
        $payload = $paginator->toArray();
        $payload['role_counts'] = $roleCounts;

        return response()->json($payload);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['uid'] = UidGenerator::make('US');
        $data['password'] = Hash::make($data['password']);
        if (($data['role'] ?? '') === UserRole::Admin->value) {
            $data['is_deletable'] = false;
        }

        $user = User::query()->create($data);

        return response()->json($user->makeHidden(['password']), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->makeHidden(['password']));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $this->validated($request, false, $user);

        // Prevent deactivating or changing role of admin
        if ($user->role === UserRole::Admin) {
            unset($data['role']);
            if (isset($data['is_active'])) {
                $data['is_active'] = true;
            }
        }

        if (array_key_exists('password', $data) && $data['password'] !== null && $data['password'] !== '') {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        $user->update($data);

        return response()->json($user->fresh()->makeHidden(['password']));
    }

    public function destroy(User $user): JsonResponse
    {
        Gate::authorize('delete', $user);
        $user->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function validated(Request $request, bool $required = true, ?User $forUser = null): array
    {
        $usernameRule = $required
            ? ['required', 'string', 'max:255', 'unique:users,username']
            : ['sometimes', 'string', 'max:255', Rule::unique('users', 'username')->ignore($forUser?->id)];

        return $request->validate([
            'fullname' => [$required ? 'required' : 'sometimes', 'string', 'max:255'],
            'username' => $usernameRule,
            'email' => ['nullable', 'email', 'max:255'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'password' => [$required ? 'required' : 'sometimes', 'nullable', 'string', 'min:6'],
            'role' => [$required ? 'required' : 'sometimes', 'in:admin,user'],
            'address' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_deletable' => ['sometimes', 'boolean'],
        ]);
    }
}
