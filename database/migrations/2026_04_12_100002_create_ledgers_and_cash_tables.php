<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('bill_no')->nullable();
            $table->text('description')->nullable();
            $table->decimal('credit', 20, 4)->default(0);
            $table->decimal('debit', 20, 4)->default(0);
            $table->string('source')->nullable();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->date('date_confirm')->nullable();
            $table->string('status')->default('confirmed');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('agency_ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('bill_no')->nullable();
            $table->text('description')->nullable();
            $table->decimal('credit', 20, 4)->default(0);
            $table->decimal('debit', 20, 4)->default(0);
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->date('date_confirm')->nullable();
            $table->string('status')->default('confirmed');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('income_ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->text('description')->nullable();
            $table->decimal('credit', 20, 4)->default(0);
            $table->decimal('debit', 20, 4)->default(0);
            $table->string('due_type')->nullable();
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->date('date_confirm')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('confirmed');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('cash_boxes', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('type')->nullable();
            $table->text('description')->nullable();
            $table->decimal('credit', 20, 4)->default(0);
            $table->decimal('debit', 20, 4)->default(0);
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->date('date_confirm')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('confirmed');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('dif_cash_boxes', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('currency_id')->constrained('currencies')->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->decimal('expected_balance', 20, 4)->default(0);
            $table->decimal('actual_balance', 20, 4)->default(0);
            $table->decimal('difference', 20, 4)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dif_cash_boxes');
        Schema::dropIfExists('cash_boxes');
        Schema::dropIfExists('income_ledgers');
        Schema::dropIfExists('agency_ledgers');
        Schema::dropIfExists('customer_ledgers');
    }
};
