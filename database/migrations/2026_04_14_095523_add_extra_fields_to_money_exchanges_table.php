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
        Schema::table('money_exchanges', function (Blueprint $table) {
            $table->string('pay_type')->default('cash')->after('reference_no');
            $table->foreignId('customer_id')->nullable()->after('pay_type')->constrained('customers')->nullOnDelete();
            $table->string('action')->nullable()->after('rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('money_exchanges', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropColumn(['pay_type', 'action']);
        });
    }
};
