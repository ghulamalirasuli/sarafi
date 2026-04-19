<?php

namespace App\Http\Controllers;
use Illuminate\Http\RedirectResponse;
use App\Models\Agency;
use App\Models\User;
use App\Models\Bank;
use App\Models\AgencyLedger;
use App\Models\BankLedger;
use App\Models\Currency;
use App\Models\IncomeLedger;
use App\Models\CashBox;
use App\Models\Customer;
use App\Models\CustomerLedger;
use App\Models\SendHawala;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PDF;


class SendHawalaController extends Controller
{

    public function index(Request $request)
    {
        $query = DB::table('send_hawala')
        ->select(
            'send_hawala.*',
            DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
            DB::raw('(SELECT name FROM users WHERE uid = send_hawala.user_id) as UserName'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.com_currency) as CCurrency'),
        );
        $send_hawala = $query->orderbyDesc('send_hawala.created_at')->get();
        $agencys=Agency::all();
        return view('send_hawala.index',compact('send_hawala'));
    }

    public function create()
    {
        $agencys = Agency::all();
        $currencies = Currency::all();
        $customers = Customer::all();
        $banks = Bank::all();
        return view('send_hawala.create', compact('agencys', 'currencies', 'customers', 'banks'));
    }

    public function show(Request $request,$id)
    {
        $hawala = SendHawala::findOrFail($id);
        $agencys = Agency::all();
        $currencies = Currency::all();
        $customers = Customer::all();
        $banks = Bank::all();
        return view('send_hawala.show', compact('hawala', 'agencys', 'currencies', 'customers', 'banks'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reciever_agency' => 'required',
            'sender' => 'required',
            'reciever' => 'required',
            'sender_currency' => 'required',
            'sender_amount' => 'required|numeric',
            'exchange_currency' => 'required_if:hawala_type,Exchange',
            'rate' => 'required_if:hawala_type,Exchange',
            'exchange_amount' => 'required_if:hawala_type,Exchange',
            'com_currency' => 'required',
            'com_amount' => 'required|numeric',
            'description' => 'nullable',
            'comment' => 'nullable',
            'hawala_type' => 'required|in:Simple,Exchange',
            'formula' => 'required_if:hawala_type,Exchange',
        ]);

        $hawala_no = $request->hawala_no ?? $this->generateHawalaNo($request->reciever_agency);

        $sendHawala = SendHawala::create([
            'reciever_agency' => $request->reciever_agency,
            'user_id' => Auth::id(),
            'sender' => $request->sender,
            'reciever' => $request->reciever,
            'sender_currency' => $request->sender_currency,
            'sender_amount' => $request->sender_amount,
            'exchange_currency' => $request->exchange_currency,
            'rate' => $request->rate ?? 1,
            'exchange_amount' => $request->exchange_amount ?? $request->sender_amount,
            'com_currency' => $request->com_currency,
            'com_amount' => $request->com_amount,
            'percent' => $request->percent ?? 0,
            'description' => $request->description,
            'comment' => $request->comment,
            'hawala_type' => $request->hawala_type,
            'formulas' => $request->formula,
            'hawala_no' => $hawala_no,
            'status' => 'Pending',
            'date_confirm' => now(),
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('hawala_send'), $filename);
            $sendHawala->update(['docs' => $filename]);
        }

        return redirect()->route('send_hawala.index')->with('success', 'Hawala created successfully.');
    }

    public function edit($id)
    {
        $hawala = SendHawala::findOrFail($id);
        $agencys = Agency::all();
        $currencies = Currency::all();
        $customers = Customer::all();
        $banks = Bank::all();
        return view('send_hawala.edit', compact('hawala', 'agencys', 'currencies', 'customers', 'banks'));
    }

    public function update(Request $request, $id)
    {
        $hawala = SendHawala::findOrFail($id);
        $validated = $request->validate([
            'reciever_agency' => 'required',
            'sender' => 'required',
            'reciever' => 'required',
            'sender_currency' => 'required',
            'sender_amount' => 'required|numeric',
            'exchange_currency' => 'required_if:hawala_type,Exchange',
            'rate' => 'required_if:hawala_type,Exchange',
            'exchange_amount' => 'required_if:hawala_type,Exchange',
            'com_currency' => 'required',
            'com_amount' => 'required|numeric',
            'description' => 'nullable',
            'comment' => 'nullable',
            'hawala_type' => 'required|in:Simple,Exchange',
            'formula' => 'required_if:hawala_type,Exchange',
        ]);

        $hawala->update([
            'reciever_agency' => $request->reciever_agency,
            'sender' => $request->sender,
            'reciever' => $request->reciever,
            'sender_currency' => $request->sender_currency,
            'sender_amount' => $request->sender_amount,
            'exchange_currency' => $request->exchange_currency,
            'rate' => $request->rate ?? 1,
            'exchange_amount' => $request->exchange_amount ?? $request->sender_amount,
            'com_currency' => $request->com_currency,
            'com_amount' => $request->com_amount,
            'percent' => $request->percent ?? 0,
            'description' => $request->description,
            'comment' => $request->comment,
            'hawala_type' => $request->hawala_type,
            'formulas' => $request->formula,
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('hawala_send'), $filename);
            $hawala->update(['docs' => $filename]);
        }

        return redirect()->route('send_hawala.index')->with('success', 'Hawala updated successfully.');
    }

    public function gethawalano($agencyid=0){
        $lastRecord = SendHawala::where('reciever_agency',$agencyid)
        ->orderBy('uid', 'desc')
        ->first();

        $lastBillNo = $lastRecord ? $lastRecord->hawala_no : 0;

        $newBillNo = $lastBillNo + 1;

        $returnHTML = view('send_hawala.hawala_no')
        ->with('agencyid', $agencyid)
        ->with('newBillNo', $newBillNo)
        ->render();
        $data = [$returnHTML];
        return response()->json($data);
    }

    public function gethawalano2($agencyid=0){
        $lastRecord = SendHawala::where('reciever_agency',$agencyid)
        ->orderBy('uid', 'desc')
        ->first();

        $lastBillNo = $lastRecord ? $lastRecord->hawala_no : 0;

        $newBillNo = $lastBillNo + 1;

        $returnHTML = view('send_hawala.hawala_no2')
        ->with('newBillNo', $newBillNo)
        ->render();
        $data = [$returnHTML];
        return response()->json($data);
    }

    public function getdue_type($due_type)
    {
        $customers = Customer::all();
        $banks = Bank::all();
        $returnHTML = view('send_hawala.pay_type', compact('due_type', 'customers', 'banks'))->render();
        return response()->json([$returnHTML]);
    }

    public function pay(Request $request, $id)
    {
        $hawala = SendHawala::findOrFail($id);
        $validated = $request->validate([
            'agency' => 'required',
            'reciever' => 'required',
            'sender_currency' => 'required',
            'sender_amount' => 'required',
        ]);

        $hawala->update([
            'reciever_agency' => $request->agency,
            'reciever' => $request->reciever,
            'sender_currency' => $request->sender_currency,
            'sender_amount' => $request->sender_amount,
            'exchange_currency' => $request->exchange_currency,
            'rate' => $request->rate ?? 1,
            'exchange_amount' => $request->exchange_amount ?? $request->sender_amount,
            'com_currency' => $request->com_currency,
            'com_amount' => $request->com_amount,
            'percent' => $request->percent ?? 0,
            'description' => $request->description,
            'comment' => $request->comment,
            'hawala_no' => $request->hawala_no,
            'status' => 'Confirmed',
            'date_update' => now(),
            'due_type' => $request->pay_type,
            'source_name' => $this->getSourceName($request),
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('hawala_send'), $filename);
            $hawala->update(['docs' => $filename]);
        }

        $this->createLedgerEntries($request, $hawala);

        $printPreviewUrl = route('send_hawala.printPreview',$id);
        return "<script>window.open('$printPreviewUrl', '_blank'); window.location.href = '" . route('send_hawala.index') . "';</script>";
    }

    private function generateHawalaNo($agencyId)
    {
        $lastRecord = SendHawala::where('reciever_agency', $agencyId)->orderBy('uid', 'desc')->first();
        return ($lastRecord ? $lastRecord->hawala_no : 0) + 1;
    }

    private function getSourceName($request)
    {
        switch ($request->pay_type) {
            case 'Cash':
                return 'Cash';
            case 'Customer':
                $customer = Customer::find($request->customer);
                return $customer ? $customer->fullname : '';
            case 'Bank':
                $bank = Bank::find($request->bank);
                return $bank ? $bank->bankname : '';
            default:
                return '';
        }
    }

    private function createLedgerEntries($request, $hawala)
    {
        $due_amount = $hawala->exchange_amount + ($request->com_amount * $hawala->rate);
        $cash_amount = $request->sender_amount + $request->com_amount;

        IncomeLedger::create([
            'date' => now(),
            'currency' => $hawala->com_currency,
            'amount' => $request->com_amount,
            'description' => 'Commission from Send Hawala',
            'type' => 'Income',
            'status' => 'Confirmed',
        ]);

        switch ($request->pay_type) {
            case 'Cash':
                CashBox::create([
                    'date' => now(),
                    'currency' => $request->sender_currency,
                    'amount' => $cash_amount,
                    'description' => 'Payment for Send Hawala',
                    'type' => 'Out',
                    'status' => 'Confirmed',
                ]);
                break;
            case 'Customer':
                CustomerLedger::create([
                    'customer_id' => $request->customer,
                    'date' => now(),
                    'currency' => $request->sender_currency,
                    'amount' => $cash_amount,
                    'description' => 'Payment for Send Hawala',
                    'type' => 'Out',
                    'status' => 'Confirmed',
                ]);
                break;
            case 'Bank':
                BankLedger::create([
                    'bank_id' => $request->bank,
                    'date' => now(),
                    'currency' => $request->sender_currency,
                    'amount' => $cash_amount,
                    'description' => 'Payment for Send Hawala',
                    'type' => 'Out',
                    'status' => 'Confirmed',
                ]);
                break;
        }
    }

    public function printPreview(Request $request,$id)
    {
        $query = DB::table('send_hawala')
        ->select(
            'send_hawala.*',
            DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
            DB::raw('(SELECT name FROM users WHERE uid = send_hawala.user_id) as UserName'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.com_currency) as CCurrency'),
        );
        $hawala = $query->where('id',$id)->first();
        $service = null; // Service model not found, placeholder
        return view('send_hawala.print_preview', compact('hawala', 'service'));
    }

    public function cancel($id)
    {
        $hawala = SendHawala::findOrFail($id);
        $hawala->update(['status' => 'Cancelled']);
        return redirect()->back()->with('success', 'Hawala cancelled successfully.');
    }

    public function uncancel($id)
    {
        $hawala = SendHawala::findOrFail($id);
        $hawala->update(['status' => 'Pending']);
        return redirect()->back()->with('success', 'Hawala uncancelled successfully.');
    }
}