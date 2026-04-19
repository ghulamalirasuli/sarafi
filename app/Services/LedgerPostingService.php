<?php

namespace App\Services;

use App\Models\Deposit;
use App\Models\CashBox;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\Expense;
use App\Models\IncomeLedger;
use App\Models\MoneyExchange;
use App\Models\MoneyTransfer;
use App\Models\ReceivedHawala;
use App\Models\SendHawala;
use App\Models\AgencyLedger;

class LedgerPostingService
{

    public function postSendHawala(SendHawala $h): void
    {
        $currency = $this->resolveCurrencyId($h->sender_currency);
        if ($h->sender_customer_id && $h->sender_amount > 0) {
            CustomerLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $h->reference_no,
                'bill_no' => $h->hawala_no,
                'description' => 'Send Hawala — '.$h->reference_no,
                'credit' => 0,
                'debit' => $h->sender_amount,
                'source' => 'send_hawala',
                'customer_id' => $h->sender_customer_id,
                'user_id' => $h->user_id,
                'currency_id' => $currency,
                'date_confirm' => $h->date_confirm,
                'status' => 'confirmed',
            ]);
        }
        if ($h->agency_id && $h->comission > 0) {
            $comCur = $this->resolveCurrencyId($h->com_currency ?? $h->sender_currency);
            AgencyLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $h->reference_no,
                'bill_no' => $h->hawala_no,
                'description' => 'Hawala commission — '.$h->reference_no,
                'credit' => $h->comission,
                'debit' => 0,
                'agency_id' => $h->agency_id,
                'user_id' => $h->user_id,
                'currency_id' => $comCur,
                'date_confirm' => $h->date_confirm,
                'status' => 'confirmed',
            ]);
        }
    }

    public function postReceivedHawala(ReceivedHawala $h): void
    {
        $cur = $this->resolveCurrencyId($h->reciever_currency);
        if ($h->receiver_customer_id && $h->reciever_amount > 0) {
            CustomerLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $h->reference_no,
                'bill_no' => $h->new_hawala_no ?? $h->hawala_no,
                'description' => 'Receive Hawala — '.$h->reference_no,
                'credit' => $h->reciever_amount,
                'debit' => 0,
                'source' => 'recieved_hawala',
                'customer_id' => $h->receiver_customer_id,
                'user_id' => $h->user_id,
                'currency_id' => $cur,
                'date_confirm' => $h->date_confirm,
                'status' => 'confirmed',
            ]);
        }
        if ($h->agency_id && $h->comission > 0) {
            AgencyLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $h->reference_no,
                'bill_no' => $h->hawala_no,
                'description' => 'Agency debit — '.$h->reference_no,
                'credit' => 0,
                'debit' => $h->comission,
                'agency_id' => $h->agency_id,
                'user_id' => $h->user_id,
                'currency_id' => $cur,
                'date_confirm' => $h->date_confirm,
                'status' => 'confirmed',
            ]);
        }
    }

    public function postMoneyExchange(MoneyExchange $m): void
    {
        if (! $m->from_currency_id || ! $m->to_currency_id) {
            return;
        }
        CashBox::create([
            'uid' => UidGenerator::make(),
            'reference_no' => $m->reference_no,
            'type' => 'money_exchange_out',
            'description' => 'FX out — '.$m->reference_no,
            'credit' => 0,
            'debit' => $m->amount,
            'currency_id' => $m->from_currency_id,
            'date_confirm' => now()->toDateString(),
            'user_id' => $m->user_id,
            'status' => 'confirmed',
        ]);
        $toAmount = $m->rate_amount ?? $m->market_amount ?? 0;
        if ($toAmount > 0) {
            CashBox::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $m->reference_no,
                'type' => 'money_exchange_in',
                'description' => 'FX in — '.$m->reference_no,
                'credit' => $toAmount,
                'debit' => 0,
                'currency_id' => $m->to_currency_id,
                'date_confirm' => now()->toDateString(),
                'user_id' => $m->user_id,
                'status' => 'confirmed',
            ]);
        }
        if ($m->benefit > 0) {
            IncomeLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $m->reference_no,
                'description' => 'Exchange benefit — '.$m->reference_no,
                'credit' => $m->benefit,
                'debit' => 0,
                'due_type' => 'exchange_benefit',
                'currency_id' => $m->to_currency_id,
                'date_confirm' => now()->toDateString(),
                'user_id' => $m->user_id,
                'status' => 'confirmed',
            ]);
        }
    }

    public function postMoneyTransfer(MoneyTransfer $t): void
    {
        $cur = $t->currency_id;
        if (! $cur) {
            return;
        }
        CustomerLedger::create([
            'uid' => UidGenerator::make(),
            'reference_no' => $t->reference_no,
            'bill_no' => $t->bill_no1,
            'description' => 'Transfer out — '.$t->reference_no,
            'credit' => 0,
            'debit' => $t->amount,
            'source' => 'money_transfer',
            'customer_id' => $t->from_customer_id,
            'user_id' => $t->user_id,
            'currency_id' => $cur,
            'date_confirm' => now()->toDateString(),
            'status' => 'confirmed',
        ]);
        CustomerLedger::create([
            'uid' => UidGenerator::make(),
            'reference_no' => $t->reference_no,
            'bill_no' => $t->bill_no2,
            'description' => 'Transfer in — '.$t->reference_no,
            'credit' => $t->amount,
            'debit' => 0,
            'source' => 'money_transfer',
            'customer_id' => $t->to_customer_id,
            'user_id' => $t->user_id,
            'currency_id' => $cur,
            'date_confirm' => now()->toDateString(),
            'status' => 'confirmed',
        ]);
    }

    public function postDeposit(Deposit $d, ?int $currencyId = null): void
    {
        $cid = $currencyId ?? $this->resolveCurrencyId($d->currency);
        $desc = ($d->target_type === 'agency' ? 'Agency deposit — ' : 'Customer deposit — ').$d->reference_no;

        // 1. Post to Ledger
        if ($d->target_type === 'agency' && $d->agency_id) {
            AgencyLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $d->reference_no,
                'bill_no' => $d->bill_no,
                'description' => $desc,
                'credit' => $d->credit,
                'debit' => $d->debit,
                'agency_id' => $d->agency_id,
                'user_id' => $d->user_id,
                'currency_id' => $cid,
                'date_confirm' => $d->date_confirm,
                'status' => 'confirmed',
            ]);
        } elseif ($d->target_type === 'customer' && $d->customer_id) {
            CustomerLedger::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $d->reference_no,
                'bill_no' => $d->bill_no,
                'description' => $desc,
                'credit' => $d->credit,
                'debit' => $d->debit,
                'customer_id' => $d->customer_id,
                'user_id' => $d->user_id,
                'currency_id' => $cid,
                'date_confirm' => $d->date_confirm,
                'status' => 'confirmed',
            ]);
        }

        // 2. Post to CashBox
        if ($d->deposit_type === 'cash' || $d->deposit_type === 'bank_transfer') {
            CashBox::create([
                'uid' => UidGenerator::make(),
                'reference_no' => $d->reference_no,
                'type' => 'deposit',
                'description' => $desc,
                'credit' => $d->credit,
                'debit' => $d->debit,
                'currency_id' => $cid,
                'bank_id' => $d->deposit_type === 'bank_transfer' ? $d->bank_id : null,
                'date_confirm' => $d->date_confirm,
                'user_id' => $d->user_id,
                'status' => 'confirmed',
            ]);
        }
    }

    public function postCustomerDeposit(Deposit $d, ?int $currencyId = null): void
    {
        $this->postDeposit($d, $currencyId);
    }

    public function postAgencyDeposit(Deposit $d, ?int $currencyId = null): void
    {
        $this->postDeposit($d, $currencyId);
    }

    public function postExpense(Expense $e, ?int $currencyId = null): void
    {
        $this->syncExpense($e, $currencyId);
    }

    public function syncExpense(Expense $e, ?int $currencyId = null): void
    {
        $cid = $currencyId ?? $this->resolveCurrencyId($e->currency);
        if (! $cid) {
            return;
        }

        $cashPayload = [
            'reference_no' => $e->reference_no,
            'type' => 'expense',
            'description' => $e->description,
            'credit' => 0,
            'debit' => $e->amount,
            'currency_id' => $cid,
            'date_confirm' => $e->date_confirm,
            'user_id' => $e->user_id,
            'status' => 'confirmed',
        ];

        $cashRows = CashBox::withTrashed()
            ->where('reference_no', $e->reference_no)
            ->where('type', 'expense')
            ->get();

        if ($cashRows->isEmpty()) {
            CashBox::create(array_merge(['uid' => UidGenerator::make()], $cashPayload));
        } else {
            foreach ($cashRows as $row) {
                $row->fill($cashPayload);
                $row->save();
                if ($row->trashed()) {
                    $row->restore();
                }
            }
        }

        $incomePayload = [
            'reference_no' => $e->reference_no,
            'description' => 'Expense — '.$e->reference_no,
            'credit' => 0,
            'debit' => $e->amount,
            'due_type' => 'expense',
            'currency_id' => $cid,
            'date_confirm' => $e->date_confirm,
            'user_id' => $e->user_id,
            'status' => 'confirmed',
        ];

        $incomeRows = IncomeLedger::withTrashed()
            ->where('reference_no', $e->reference_no)
            ->where('due_type', 'expense')
            ->get();

        if ($incomeRows->isEmpty()) {
            IncomeLedger::create(array_merge(['uid' => UidGenerator::make()], $incomePayload));
        } else {
            foreach ($incomeRows as $row) {
                $row->fill($incomePayload);
                $row->save();
                if ($row->trashed()) {
                    $row->restore();
                }
            }
        }
    }

    protected function resolveCurrencyId(?string $name): ?int
    {
        if (! $name) {
            return null;
        }

        return \App\Models\Currency::query()->where('currency_name', $name)->value('id');
    }
}
