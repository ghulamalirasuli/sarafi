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
        Schema::table('send_hawala', function (Blueprint $table) {
            // Drop the foreign key constraint first
            $table->dropForeign(['branch_id']);
            // Drop the branch_id column
            $table->dropColumn('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('send_hawala', function (Blueprint $table) {
            // Re-add the branch_id column
            $table->unsignedBigInteger('branch_id')->after('user_id');
            // Note: Cannot restore foreign key as branches table no longer exists
        });
    }
};
