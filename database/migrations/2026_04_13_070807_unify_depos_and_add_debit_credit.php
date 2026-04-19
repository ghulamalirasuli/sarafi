<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename customer_deposits to deposits
        Schema::rename('customer_deposits', 'deposits');

        // 2. Modify deposits table
        Schema::table('deposits', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->change();
            $table->foreignId('agency_id')->nullable()->after('customer_id')->constrained('agencies')->nullOnDelete();
            $table->decimal('debit', 20, 4)->default(0)->after('amount');
            $table->decimal('credit', 20, 4)->default(0)->after('debit');
            $table->string('target_type')->default('customer')->after('id'); // 'customer' or 'agency'
        });

        // 3. Migrate data from agency_deposits if it exists
        if (Schema::hasTable('agency_deposits')) {
            $agencyDeposits = DB::table('agency_deposits')->get();
            foreach ($agencyDeposits as $ad) {
                DB::table('deposits')->insert([
                    'uid' => $ad->uid,
                    'reference_no' => $ad->reference_no,
                    'target_type' => 'agency',
                    'agency_id' => $ad->agency_id,
                    'bill_no' => $ad->hawala_no,
                    'deposit_type' => $ad->deposit_type,
                    'currency' => $ad->currency,
                    'amount' => $ad->amount,
                    'credit' => $ad->amount, // Default to credit for old deposits
                    'debit' => 0,
                    'formula' => $ad->formula,
                    'rate' => $ad->rate,
                    'exchange_currency' => $ad->exchange_currency,
                    'exchange_amount' => $ad->exchange_amount,
                    'description' => $ad->description,
                    'source' => $ad->source,
                    'source_name' => $ad->source_name,
                    'date_confirm' => $ad->date_confirm,
                    'user_id' => $ad->user_id,
                    'status' => $ad->status,
                    'remark' => $ad->remark,
                    'cancel_date' => $ad->cancel_date,
                    'cancel_by' => $ad->cancel_by,
                    'created_at' => $ad->created_at,
                    'updated_at' => $ad->updated_at,
                    'deleted_at' => $ad->deleted_at,
                ]);
            }
            Schema::dropIfExists('agency_deposits');
        }

        // 4. Update existing deposits to have credit = amount
        DB::table('deposits')->where('credit', 0)->where('debit', 0)->update([
            'credit' => DB::raw('amount')
        ]);
    }

    public function down(): void
    {
        // Not implementing down because it's a destructive change
    }
};
