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
        // Rename income_ledgers to income_ledger
        Schema::rename('income_ledgers', 'income_ledger');

        Schema::table('income_ledger', function (Blueprint $table) {
            $table->renameColumn('currency_id', 'currency');
            $table->timestamp('date_update')->nullable();
            $table->string('user_name')->nullable();
            $table->string('update_user_name')->nullable();
            $table->string('update_user_id')->nullable();
            $table->string('deleted_by')->nullable();
            $table->timestamp('restored_date')->nullable();
        });

        Schema::table('money_exchanges', function (Blueprint $table) {
            $table->renameColumn('from_currency_id', 'from_currency');
            $table->renameColumn('to_currency_id', 'to_currency');
            $table->date('date_confirm')->nullable();
            $table->string('user_name')->nullable();
            $table->string('update_user_name')->nullable();
            $table->string('update_user_id')->nullable();
            $table->string('branch_name')->nullable();
            $table->string('source')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('money_exchanges', function (Blueprint $table) {
            $table->renameColumn('from_currency', 'from_currency_id');
            $table->renameColumn('to_currency', 'to_currency_id');
            $table->dropColumn(['date_confirm', 'user_name', 'update_user_name', 'update_user_id', 'branch_name', 'source']);
        });

        Schema::table('income_ledger', function (Blueprint $table) {
            $table->renameColumn('currency', 'currency_id');
            $table->dropColumn(['date_update', 'user_name', 'update_user_name', 'update_user_id', 'deleted_by', 'restored_date']);
        });

        Schema::rename('income_ledger', 'income_ledgers');
    }
};
