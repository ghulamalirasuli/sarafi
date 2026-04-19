<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_deposits', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('bill_no')->nullable();
            $table->string('deposit_type')->nullable();
            $table->string('currency')->nullable();
            $table->decimal('amount', 20, 4)->default(0);
            $table->text('formula')->nullable();
            $table->decimal('rate', 20, 8)->nullable();
            $table->string('exchange_currency')->nullable();
            $table->decimal('exchange_amount', 20, 4)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('source')->nullable();
            $table->string('source_name')->nullable();
            $table->date('date_confirm')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->text('remark')->nullable();
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('agency_deposits', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->foreignId('agency_id')->constrained('agencies')->cascadeOnDelete();
            $table->string('hawala_no')->nullable();
            $table->string('deposit_type')->nullable();
            $table->string('currency')->nullable();
            $table->decimal('amount', 20, 4)->default(0);
            $table->text('formula')->nullable();
            $table->decimal('rate', 20, 8)->nullable();
            $table->string('exchange_currency')->nullable();
            $table->decimal('exchange_amount', 20, 4)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('source')->nullable();
            $table->string('source_name')->nullable();
            $table->date('date_confirm')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->text('remark')->nullable();
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('currency')->nullable();
            $table->text('description')->nullable();
            $table->decimal('amount', 20, 4)->default(0);
            $table->decimal('market_amount', 20, 4)->nullable();
            $table->decimal('rate_amount', 20, 4)->nullable();
            $table->decimal('benefit', 20, 4)->default(0);
            $table->date('date_confirm')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('agency_deposits');
        Schema::dropIfExists('customer_deposits');
    }
};
