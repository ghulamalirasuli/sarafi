<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->string('bankname');
            $table->string('bankaccount')->nullable();
            $table->string('accountnumber')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
