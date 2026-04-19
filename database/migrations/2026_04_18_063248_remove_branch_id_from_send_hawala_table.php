<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('send_hawala', 'branch_id')) {
            return;
        }

        Schema::table('send_hawala', function (Blueprint $table) {
            // Drop the foreign key constraint first (if present).
            // On SQLite dropForeign is a no-op when the constraint is missing,
            // but on other drivers it may throw, so we guard with a try/catch.
            try {
                $table->dropForeign(['branch_id']);
            } catch (\Throwable $e) {
                // Foreign key may not exist (e.g. branches table was already
                // dropped by an earlier migration). Safe to ignore.
            }
            $table->dropColumn('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('send_hawala', 'branch_id')) {
            return;
        }

        Schema::table('send_hawala', function (Blueprint $table) {
            // Re-add the branch_id column. Nullable because the branches
            // table no longer exists and we cannot restore the foreign key.
            $table->unsignedBigInteger('branch_id')->nullable()->after('user_id');
        });
    }
};
