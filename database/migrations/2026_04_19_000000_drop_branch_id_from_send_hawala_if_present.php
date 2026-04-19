<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safety-net migration for databases that were migrated against an older
 * version of `2026_04_16_062651_create_send_hawala_table` where `send_hawala`
 * was created with a `branch_id` column and a foreign key referencing the
 * (already dropped) `branches` table.
 *
 * On SQLite that FK is not validated at CREATE TABLE time, but every INSERT
 * into `send_hawala` then fails with `SQLSTATE[HY000]: General error: 1 no
 * such table: main.branches`. This migration removes the column (and thereby
 * the stale FK) on any DB that still carries it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('send_hawala')) {
            return;
        }

        if (! Schema::hasColumn('send_hawala', 'branch_id')) {
            return;
        }

        // Drop the foreign key first on drivers that support it. Laravel's
        // SQLite grammar rewrites the whole table when dropping a column,
        // which also drops the FK, so a missing dropForeign is fine there.
        try {
            Schema::table('send_hawala', function (Blueprint $table) {
                $table->dropForeign(['branch_id']);
            });
        } catch (\Throwable $e) {
            // FK may not exist (e.g. already implicitly dropped, or the DB
            // never had it). Safe to ignore on any driver.
        }

        Schema::table('send_hawala', function (Blueprint $table) {
            $table->dropColumn('branch_id');
        });
    }

    public function down(): void
    {
        // Intentionally a no-op: this system no longer uses branches.
    }
};
