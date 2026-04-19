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
        Schema::table('money_transfers', function (Blueprint $table) {
            if (!Schema::hasColumn('money_transfers', 'date_confirm')) {
                $table->date('date_confirm')->nullable()->after('description');
            }
            if (!Schema::hasColumn('money_transfers', 'user_name')) {
                $table->string('user_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('money_transfers', 'update_user_name')) {
                $table->string('update_user_name')->nullable()->after('user_name');
            }
            if (!Schema::hasColumn('money_transfers', 'update_user_id')) {
                $table->string('update_user_id')->nullable()->after('update_user_name');
            }
            if (!Schema::hasColumn('money_transfers', 'branch_name')) {
                $table->string('branch_name')->nullable()->after('update_user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('money_transfers', function (Blueprint $table) {
            $table->dropColumn(['date_confirm', 'user_name', 'update_user_name', 'update_user_id', 'branch_name']);
        });
    }
};
