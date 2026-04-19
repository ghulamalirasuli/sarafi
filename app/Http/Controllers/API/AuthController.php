<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('username', $data['username'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => [__('auth.failed')],
            ]);
        }

        if (! $user->is_active) {
            abort(403, 'Account inactive.');
        }

        $user->tokens()->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->userPayload($user),
            'role' => $user->role->value,
            'customer_id' => $user->customer_id,
            'token' => $token,
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json($this->userPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    protected function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'uid' => $user->uid,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'role' => $user->role->value,
            'customer_id' => $user->customer_id,
            'is_active' => $user->is_active,
        ];
    }
}
