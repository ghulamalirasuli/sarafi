<?php

use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

it('logs in with username and returns a sanctum token', function () {
    $response = $this->postJson('/api/login', [
        'username' => 'superadmin',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('role', 'super_admin')
        ->assertJsonStructure(['user', 'role', 'branch_id', 'customer_id', 'token']);
});

it('rejects invalid credentials', function () {
    $response = $this->postJson('/api/login', [
        'username' => 'superadmin',
        'password' => 'wrong',
    ]);

    $response->assertStatus(422);
});
