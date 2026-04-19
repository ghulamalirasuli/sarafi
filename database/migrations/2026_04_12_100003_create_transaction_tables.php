<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('send_hawalas', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('reciever_agency')->nullable();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->string('hawala_no')->nullable();
            $table->string('sender')->nullable();
            $table->string('reciever')->nullable();
            $table->foreignId('sender_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('receiver_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('sender_currency')->nullable();
            $table->decimal('sender_amount', 20, 4)->default(0);
            $table->string('hawala_type')->nullable();
            $table->decimal('percent', 10, 4)->nullable();
            $table->decimal('comission', 20, 4)->default(0);
            $table->string('com_currency')->nullable();
            $table->decimal('rate', 20, 8)->nullable();
            $table->string('exchange_currency')->nullable();
            $table->decimal('exchange_amount', 20, 4)->nullable();
            $table->string('due_type')->nullable();
            $table->string('source_name')->nullable();
            $table->text('description')->nullable();
            $table->text('comment')->nullable();
            $table->json('docs')->nullable();
            $table->date('date_confirm')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('recieved_hawalas', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->string('sender_agency')->nullable();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->string('hawala_no')->nullable();
            $table->string('sender')->nullable();
            $table->string('reciever')->nullable();
            $table->foreignId('sender_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('receiver_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('reciever_currency')->nullable();
            $table->decimal('reciever_amount', 20, 4)->default(0);
            $table->string('hawala_type')->nullable();
            $table->decimal('percent', 10, 4)->nullable();
            $table->decimal('comission', 20, 4)->default(0);
            $table->text('formulas')->nullable();
            $table->string('new_hawala_no')->nullable();
            $table->decimal('rate', 20, 8)->nullable();
            $table->string('exchange_currency')->nullable();
            $table->decimal('exchange_amount', 20, 4)->nullable();
            $table->string('due_type')->nullable();
            $table->string('source_name')->nullable();
            $table->text('description')->nullable();
            $table->text('comment')->nullable();
            $table->json('docs')->nullable();
            $table->date('date_confirm')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('money_exchanges', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->foreignId('from_currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->foreignId('to_currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->decimal('market_rate', 20, 8)->nullable();
            $table->decimal('rate', 20, 8)->nullable();
            $table->decimal('amount', 20, 4)->default(0);
            $table->decimal('market_amount', 20, 4)->nullable();
            $table->decimal('rate_amount', 20, 4)->nullable();
            $table->decimal('benefit', 20, 4)->default(0);
            $table->text('description')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('cancel_date')->nullable();
            $table->foreignId('cancel_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('money_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->foreignId('from_customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('bill_no1')->nullable();
            $table->foreignId('to_customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('bill_no2')->nullable();
            $table->decimal('amount', 20, 4)->default(0);
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->text('description')->nullable();
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
        Schema::dropIfExists('money_transfers');
        Schema::dropIfExists('money_exchanges');
        Schema::dropIfExists('recieved_hawalas');
        Schema::dropIfExists('send_hawalas');
    }
};
