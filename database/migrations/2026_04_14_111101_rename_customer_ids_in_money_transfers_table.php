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
            $table->renameColumn('from_customer_id', 'from_customer');
            $table->renameColumn('to_customer_id', 'to_customer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('money_transfers', function (Blueprint $table) {
            $table->renameColumn('from_customer', 'from_customer_id');
            $table->renameColumn('to_customer', 'to_customer_id');
        });
    }
};
