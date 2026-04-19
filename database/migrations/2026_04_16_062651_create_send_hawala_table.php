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
        Schema::create('send_hawala', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('reference_no')->nullable();
            $table->unsignedBigInteger('reciever_agency');
            $table->unsignedBigInteger('agency_id')->nullable();
            $table->string('hawala_no');
            $table->string('sender');
            $table->string('reciever');
            $table->unsignedBigInteger('sender_customer_id')->nullable();
            $table->unsignedBigInteger('receiver_customer_id')->nullable();
            $table->unsignedBigInteger('sender_currency');
            $table->decimal('sender_amount', 15, 2);
            $table->enum('hawala_type', ['Simple', 'Exchange']);
            $table->string('formulas')->nullable();
            $table->decimal('percent', 5, 2)->nullable();
            $table->string('comission')->nullable();
            $table->unsignedBigInteger('com_currency');
            $table->decimal('com_amount', 15, 2);
            $table->decimal('rate', 10, 4)->default(1);
            $table->unsignedBigInteger('exchange_currency')->nullable();
            $table->decimal('exchange_amount', 15, 2)->nullable();
            $table->string('due_type')->nullable();
            $table->string('source_name')->nullable();
            $table->text('description')->nullable();
            $table->string('comment')->nullable();
            $table->string('docs')->nullable();
            $table->date('date_confirm');
            $table->datetime('date_update')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->enum('status', ['Pending', 'Confirmed', 'Cancelled'])->default('Pending');
            $table->datetime('cancel_date')->nullable();
            $table->unsignedBigInteger('cancel_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->foreign('reciever_agency')->references('id')->on('agencies');
            $table->foreign('sender_currency')->references('id')->on('currencies');
            $table->foreign('com_currency')->references('id')->on('currencies');
            $table->foreign('exchange_currency')->references('id')->on('currencies');
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('send_hawala');
    }
};
