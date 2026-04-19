<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function delete(User $actor, User $target): bool
    {
        if (! $target->is_deletable) {
            return false;
        }
        if ($target->role === UserRole::Admin) {
            return false;
        }

        return true;
    }

    public function update(User $actor, User $target): bool
    {
        return true;
    }
}
