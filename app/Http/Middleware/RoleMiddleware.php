<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $allowed = in_array($user->role->value, $roles, true);
        if (! $allowed) {
            abort(Response::HTTP_FORBIDDEN, "Insufficient role. Got: {$user->role->value}, Expected: " . implode(',', $roles));
        }

        return $next($request);
    }
}
