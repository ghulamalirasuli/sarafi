<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_boxes', function (Blueprint $table) {
            if (! Schema::hasColumn('cash_boxes', 'bank_id')) {
                $table->foreignId('bank_id')->nullable()->after('currency_id')->constrained('banks')->nullOnDelete();
            }
        });

        Schema::table('deposits', function (Blueprint $table) {
            if (! Schema::hasColumn('deposits', 'bank_id')) {
                $table->foreignId('bank_id')->nullable()->after('deposit_type')->constrained('banks')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
    }
};
