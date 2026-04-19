<?php

namespace App\Http\Controllers;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use App\Models\Agency;
use App\Models\User;
use App\Models\Bank;
use App\Models\AgencyLedger;
use App\Models\BankLedger;
use App\Models\BranchLedger;
use App\Models\Service;
use App\Models\Currency;
use App\Models\Branch;
use App\Models\Income_ledger;
use App\Models\CashBox;
use App\Models\Customers;
use App\Models\CustomerLedger;
use App\Models\Send_Hawala;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Traits\Ledger;
use App\Traits\GetAllRecords;
use PDF;


class SendHawalaController extends Controller
{
    use Ledger;
    use GetAllRecords;

    public function index(Request $request)
    {
        /*
        $branch = $request->branch;
        $status = $request->status;
        $startDate = $request->from_date;
        $endDate = $request->to_date;
        $status = "Pending";

        $query = DB::table('send_hawala')
        ->select(
            'send_hawala.*',
            DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
            DB::raw('(SELECT name FROM users WHERE uid = send_hawala.user_id) as UserName'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
        );
        if (!empty($branch)) {
            $query->where('send_hawala.branch_id', '=', $branch);
        }

        if (!empty($status)) {
            $query->where('send_hawala.status', '=', $status);
        }

        if (!empty($startDate) && !empty($endDate)) {
            $query->whereBetween('send_hawala.date_confirm', [$startDate, $endDate]);
        }
        $send_hawala = $query->orderbyDesc('send_hawala.created_at')->get();
*/
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
        $branches=Branch::all();
        $agencys=Agency::all();
        // $send_hawala = DB::table('send_hawala')
        // ->select(
        //     'send_hawala.*',
        //     DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
        //     DB::raw('(SELECT name FROM users WHERE uid = send_hawala.user_id) as UserName'),
        //     DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
        //     DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
        // )
        // ->orderbyDesc('send_hawala.created_at')->get();
        return view('send_hawala.index',compact('send_hawala','branches'));
    }

    public function create()
    {
        $agencys = Agency::all();
        $currencies=Currency::all();
        $branches=Branch::all();
        return view('send_hawala.create',compact('agencys','currencies','branches'));
    }
    public function show(Request $request,$id)
    {
        $hawala = DB::table('send_hawala')
        ->select(
            'send_hawala.*',
            DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
            DB::raw('(SELECT name FROM users WHERE uid = send_hawala.user_id) as UserName'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
            DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
        )
        ->where('send_hawala.id',$id)
        ->first();

        $agencys = Agency::all();
        $currencies=Currency::all();
        return view('send_hawala.show',compact('hawala','agencys','currencies'));
    }


    public function store(Request $request)

    {
        $validated = $request->validate([
            'agency' => 'required|not_in:0',
            'sender_currency' => 'required|not_in:0',
            'sender' => 'required',
            'reciever' => 'required',
            'sender_amount' => 'required',
        ]);
        $cus = Agency::where('uid',$request->customer)->first();
    
        $cuid = "SAH".date('ymdhis');
        $reference_no = "SH".date('ymdhis');
        if( Auth::user()->user_type=="Mainadmin" ||  Auth::user()->user_type=="Simpleuser")
        {
          $branch = $request->branch;
        }
        else{
          $branch = Auth::user()->branch_id;
        }

        if($request->comission=="Manual"){
            $percent = Null;
            $com = $request->com_amount;
        }
        else if($request->comission=="Percentage"){
            $percent =$request->percent_amount;
            $com = $request->com_amount;
        }
        $formulas = $request->formula;
        if($formulas==0){
            $formula = '';
        }
        else{
            $formula = $request->formula;
        }

        if($request->hawala_type=="Simple"){
            $cur = $request->sender_currency;
            $excur = $request->sender_currency;
        }
        else if($request->hawala_type=="Exchange"){
            $cur = $request->sender_currency;
            $excur = $request->exchange_currency;
        }


       $hawala= Send_Hawala::Create([
            'uid'               =>$cuid,
            'reference_no'      =>$reference_no,
            'reciever_agency'     =>$request->agency,
            'hawala_no'         =>$request->hawala_no,
            'sender'            =>$request->sender,
            'reciever'          =>$request->reciever,
            'sender_currency' =>$cur,
            'sender_amount'   =>$request->sender_amount,
            'hawala_type'       =>$request->hawala_type,
            'rate'              =>$request->rate,
            'exchange_currency' =>$excur,
            'exchange_amount'   =>$request->exchange_amount,
            'formulas'          =>$formula,//To Be Checked
            'percent'           =>$percent,
            'comission'         =>$com,
            'com_currency'      =>$request->com_currency,
            'description'       =>$request->description,
            'due_type'          =>'',
            'source_name'       =>'',
            'new_hawala_no'     =>'',
            'date_confirm'      =>$request->date,
            'user_name'         =>Auth::user()->username,
            'user_id'           =>Auth::user()->uid,
            'update_user_name'  =>'',
            'update_user_id'    =>'',
            'branch_name'       =>'',
            'branch_id'         =>$branch,
            'status'           =>'Pending',
            'comment'          =>$request->comment,
            'docs'             =>'',
        ]);  

        return redirect()->route('send_hawala.index')->with('success',__('Send Hawala has been created successfully.'));
   
    }

    public function edit($id)

    {
        $agencys = Agency::all();
        $currencies=Currency::all();
        $branches=Branch::all();
        $hawala = Send_Hawala::findOrFail($id);

        return view('send_hawala.edit',compact('hawala','agencys','currencies','branches'));
    }
    public function update(Request $request, $id)
    {
        $hawala = Send_Hawala::findOrFail($id);
        $validated = $request->validate([
            'agency' => 'required|not_in:0',
            'sender_currency' => 'required|not_in:0',
            'sender' => 'required',
            'reciever' => 'required',
            'sender_amount' => 'required',
        ]);
        if( Auth::user()->user_type=="Mainadmin" ||  Auth::user()->user_type=="Simpleuser")
        {
          $branch = $request->branch;
        }
        else{
          $branch = Auth::user()->branch_id;
        }

        if($request->comission=="Manual"){
            $percent = Null;
            $com = $request->com_amount;
        }
        else if($request->comission=="Percentage"){
            $percent =$request->percent_amount;
            $com = $request->com_amount;
        }

        $formulas = $request->formula;
        if($formulas==0 || $request->hawala_type=="Simple"){
            $formula = '';
            $cur = $request->sender_currency;
            $excur = $request->sender_currency;
        }
        else{
            $formula = $request->formula;
            $cur = $request->sender_currency;
            $excur = $request->exchange_currency;
        }

        $hawala->update([
            'reciever_agency'     =>$request->agency,
            'hawala_no'         =>$request->hawala_no,
            'sender'            =>$request->sender,
            'reciever'          =>$request->reciever,
            'sender_currency' =>$cur,
            'sender_amount'   =>$request->sender_amount,
            'hawala_type'       =>$request->hawala_type,
            'rate'              =>$request->rate,
            'exchange_currency' =>$excur,
            'exchange_amount'   =>$request->exchange_amount,
            'formulas'          =>$formula,//To Be Checked
            'percent'           =>$percent,
            'comission'         =>$com,
            'com_currency'       =>$request->com_currency,
            'description'       =>$request->description,
            'due_type'          =>'',
            'source_name'       =>'',
            'new_hawala_no'     =>'',
            'date_confirm'       =>$request->date,
            'update_user_name'         =>Auth::user()->username,
            'update_user_id'           =>Auth::user()->uid,
            'branch_name'       =>'',
            'branch_id'         =>$branch,
            'comment'          =>$request->comment,
            'docs'             =>'',
        ]);
    
    
        return redirect()->route('send_hawala.index')->with('success',__('Send Hawala has been updated successfully.'));
     }

     public function gethawalano($agencyid=0){
    
        // Retrieve the last record for the current agency
$lastRecord = Send_Hawala::where('reciever_agency',$agencyid)
->orderBy('uid', 'desc')
->first();

// Extract the bill_no from the last record
$lastBillNo = $lastRecord ? $lastRecord->hawala_no : 0;

// Increment the bill_no for the new form submissions
$newBillNo = $lastBillNo + 1;

     $returnHTML = view('send_hawala.hawala_no')
     ->with('agencyid', $agencyid)
     ->with('newBillNo', $newBillNo)
     ->render();
     $data = [$returnHTML];
     return response()->json($data);

}

public function gethawalano2($agencyid=0){
    
    // Retrieve the last record for the current agency
$lastRecord = Send_Hawala::where('reciever_agency',$agencyid)
->orderBy('uid', 'desc')
->first();

// Extract the bill_no from the last record
$lastBillNo = $lastRecord ? $lastRecord->hawala_no : 0;

// Increment the bill_no for the new form submissions
$newBillNo = $lastBillNo + 1;

 $returnHTML = view('send_hawala.hawala_no2')
 ->with('newBillNo', $newBillNo)
 ->render();
 $data = [$returnHTML];
 return response()->json($data);

}


public function pay(Request $request, $id)
{
    $hawala = Send_Hawala::findOrFail($id);
    $validated = $request->validate([
        'agency' => 'required|not_in:0',
        'sender_currency' => 'required|not_in:0',
        'sender' => 'required',
        'reciever' => 'required',
        'sender_amount' => 'required',
    ]);
    if( Auth::user()->user_type=="Mainadmin" ||  Auth::user()->user_type=="Simpleuser")
    {
      $branch = $request->branch;
    }
    else{
      $branch = Auth::user()->branch_id;
    }

    if($request->comission=="Manual"){
        $percent = Null;
        $com = $request->com_amount;
    }
    else if($request->comission=="Percentage"){
        $percent =$request->percent_amount;
        $com = $request->com_amount;
    }

    $formulas = $request->formula;
    if($formulas==0 || $request->hawala_type=="Simple"){
        $formula = '';
    }
    else{
        $formula = $request->formula;
    }

    $file = $request->file('file');
    $image = "";
    if(!empty($file)){
        $image = time().".".$file->getClientOriginalExtension();
        $file->move('hawala_send',$image);
    }
    else {
        $image = Null;
    }


    if($request->pay_type=="Cash"){
       $source = 'Cash';
       $newhno = '';
    }
    elseif($request->pay_type=="Customer"){
       $cus = Customers::where('uid',$request->customer)->first();
       $source = $cus->fullname.' ' .$cus->branch_name;
       $newhno = $request->bill_no;
    }
   

    elseif($request->pay_type=="Branch"){
       $br = Branch::where('uid',$request->branch_name)->first();
       $source = $br->branch_name.' ' .$br->branch_responsible;
       $newhno = $request->bill_no;
    }

    elseif($request->pay_type=="Bank"){
       $ba = Bank::where('uid',$request->bank)->first();
       $source = $ba->bankname.' '. $ba->accountnumber;
       $newhno = '';
    }
    $agency = Agency::where('uid',$request->agency)->first();
    $due_amount = $hawala->exchange_amount + ($request->com_amount * $hawala->rate);
   $cash_amount = $request->sender_amount + $request->com_amount;
    $hawala->update([
        'reciever_agency'   =>$request->agency,
        'hawala_no'         =>$request->hawala_no,
        'sender'            =>$request->sender,
        'reciever'          =>$request->reciever,
        'sender_currency'   =>$request->sender_currency,
        'sender_amount'     =>$request->sender_amount,
        'exchange_currency' =>$request->exchange_currency,
        'exchange_amount'   =>$request->exchange_amount,
        'percent'           =>$request->percent_amount,
        'comission'         =>$request->com_amount,
        'due_type'          =>$request->pay_type,
        'source_name'       =>$source,
        'new_hawala_no'     =>$newhno,
        'date_update'     =>$request->date,
        'branch_name'       =>'',
        'docs'              =>$image,
        'status'            =>'Confirmed',
    ]);

    AgencyLedger::Create([
       'uid' =>$hawala->uid,
       'reference_no' =>$hawala->reference_no,
       'agency_id'  =>$request->agency,
       'bill_no'      =>$request->hawala_no,
       'description'  =>$hawala->description,
       'credit'        =>$hawala->exchange_amount,
       'debit'        =>0,
       'currency_id'  =>$hawala->exchange_currency,
       'date_confirm' =>$request->date,
       'user_name'    =>Auth::user()->username,
       'user_id'      =>Auth::user()->uid,
       'update_user_name'=>'',
       'update_user_id'  =>'',
       'branch_id'       =>$hawala->branch_id,
       'status'          =>'Confirmed',
       'source' =>'Sent Hawala',
   ]);

   Income_ledger::Create([
    'uid'           =>$hawala->uid,
    'reference_no'  =>$hawala->reference_no,
    'credit'        =>$request->com_amount,
    'debit'         =>0,
    'currency'      =>$hawala->com_currency,
    'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
    'due_type'     =>'Sent Hawala',
    'date_confirm' =>$request->date,
    'user_name'    =>Auth::user()->username,
    'user_id'      =>Auth::user()->uid,
    'update_user_name'=>'',
    'update_user_id'  =>'',
    'branch_id'       =>$hawala->branch_id,
    'status'          =>'Confirmed',
]);

    if($request->pay_type=="Cash"){
        CashBox::create([
            'uid'          => $hawala->uid,
            'reference_no' => $hawala->reference_no,
            'type'         => 'بابت حواله ارسالی',
            'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
            'credit'        => $request->sender_amount,
            'debit'  =>0,
            'currency_id'  => $request->sender_currency,
            'date_confirm' => $request->date,
            'user_name'    =>Auth::user()->username,
            'user_id'      =>Auth::user()->uid,
            'branch_id'    =>$hawala->branch_id,
            'status'       =>'Confirmed',
        ]);
        CashBox::create([
            'uid'          => $hawala->uid,
            'reference_no' => $hawala->reference_no,
            'type'         => 'کمیشن حواله ارسالی ',
            'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
            'credit'        => $hawala->comission,
            'debit'  =>0,
            'currency_id'  => $hawala->com_currency,
            'date_confirm' => $request->date,
            'user_name'    =>Auth::user()->username,
            'user_id'      =>Auth::user()->uid,
            'branch_id'    =>$hawala->branch_id,
            'status'       =>'Confirmed',
        ]);

    }

    elseif($request->pay_type=="Customer"){
        CustomerLedger::Create([
            'uid' =>$hawala->uid,
            'reference_no' =>$hawala->reference_no,
            'customer_id'  =>$request->customer,
            'bill_no'      =>$request->bill_no,
            'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
            // 'comission'    =>$request->com_amount,
            'credit'       =>0,
            'debit'        =>$request->sender_amount,
            'currency_id'  =>$hawala->exchange_currency,
            'date_confirm' =>$request->date,
            'user_name'    =>Auth::user()->username,
            'user_id'      =>Auth::user()->uid,
            'update_user_name'=>'',
            'update_user_id'  =>'',
            'branch_name'     =>'',
            'branch_id'       =>$hawala->branch_id,
            'status'          =>'Confirmed',
            'source' =>'بابت حواله ارسالی',
        ]); 
        CustomerLedger::Create([
            'uid' =>$hawala->uid,
            'reference_no' =>$hawala->reference_no,
            'customer_id'  =>$request->customer,
            'bill_no'      =>$request->bill_no,
            'description'  =>'بابت کمیشن ؛' .$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
            'credit'       =>0,
            'debit'        =>$hawala->comission,
            'currency_id'  =>$hawala->com_currency,
            'date_confirm' =>$request->date,
            'user_name'    =>Auth::user()->username,
            'user_id'      =>Auth::user()->uid,
            'update_user_name'=>'',
            'update_user_id'  =>'',
            'branch_name'     =>'',
            'branch_id'       =>$hawala->branch_id,
            'status'          =>'Confirmed',
            'source' =>'بابت حواله ارسالی',
        ]); 

    }
   
   elseif($request->pay_type=="Branch"){
       BranchLedger::Create([
           'uid' =>$hawala->uid,
           'reference_no' =>$hawala->reference_no,
           'branch_id'  =>$request->branch_name,
           'bill_no'      =>$request->bill_no,
           'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
           'credit'       =>0,
           'debit'        =>$due_amount,
           'currency_id'  =>$hawala->exchange_currency,
           'date_confirm' =>$request->date,
           'user_name'    =>Auth::user()->username,
           'user_id'      =>Auth::user()->uid,
           'status'          =>'Confirmed',
           'source'  =>'Recieved Hawala',
       ]);    
}

elseif($request->pay_type=="Bank"){
   BankLedger::Create([
       'uid' =>$hawala->uid,
       'reference_no' =>$hawala->reference_no,
       'bank_id'  =>$request->bank,
       'description'  =>$hawala->description.' ' .$agency->agency_name.' HawalaNo.= '.$request->hawala_no,
       'credit'       =>$cash_amount,
       'debit'        =>0,
       'currency_id'  =>$hawala->exchange_currency,
       'date_confirm' =>$request->date,
       'user_name'    =>Auth::user()->username,
       'user_id'      =>Auth::user()->uid,
       'branch_id'  => $hawala->branch_id,
       'status'          =>'Confirmed'
   ]);        
}
    $printPreviewUrl = route('send_hawala.printPreview',$id);
    return "<script>window.open('$printPreviewUrl', '_blank'); window.location.href = '" . route('send_hawala.index') . "';</script>";

 }

 public function printPreview(Request $request,$id)
 {
    $service = Service::first();
    $query = DB::table('send_hawala')
->select(
    'send_hawala.*',
    DB::raw('(SELECT agency_name FROM agency WHERE uid = send_hawala.reciever_agency) as Agency'),
    DB::raw('(SELECT branch_name FROM branch WHERE uid = send_hawala.branch_id) as Branch'),
    DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.sender_currency) as RCurrency'),
    DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.exchange_currency) as ECurrency'),
    DB::raw('(SELECT currency_name FROM currency WHERE uid = send_hawala.com_currency) as CCurrency'),
);
$hawala = $query->where('id',$id)->first();
     return view('send_hawala.print_preview',compact('id','hawala','service'));
 }


 public function getdue_type($due_type=0){
    $currencies=Currency::all();
    $customers=Customers::all();
    $branches=Branch::all();
    $banks=Bank::all();

 $returnHTML = view('send_hawala.pay_type')
 ->with('due_type', $due_type)
 ->with('currencies', $currencies)
 ->with('customers', $customers)
 ->with('branches', $branches)
 ->with('banks', $banks)
 ->render();
 $data = [$returnHTML];
 return response()->json($data);

}

 public function destroy($id)
 {
   Send_Hawala::where('id',$id)->forceDelete();
   return redirect()->back()->with('success','Send Hawala has been deleted successfully');
}
public function cancel($id)
{
   $date = date('Y-m-d H:i:s');
   $hawala = Send_Hawala::where('id',$id)->first();
   
   DB::table('send_hawala')
   ->where('id', $id)
   ->update(array(
       'status'        => 'Cancelled',
       'cancel_by'   =>Auth::user()->name.' ('.Auth::user()->username.')',
       'cancel_date' =>$date,
   ));
   DB::table('cash_box')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
       'deleted_at'        => null,
   ));

   DB::table('bank_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));

   DB::table('branch_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
   DB::table('agency_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
   DB::table('customer_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
   DB::table('income_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Cancelled',
       'deleted_by'   =>"Send Hawala Cancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
 return redirect()->back()->with('success','Send Hawala has been cancelled successfully');
}

public function uncancel($id)
{
   $date = date('Y-m-d H:i:s');
   $hawala = Send_Hawala::where('id',$id)->first();
   
   DB::table('send_hawala')
   ->where('id', $id)
   ->update(array(
       'update_user_name' => Auth::user()->name.' ('.Auth::user()->username.')',
       'update_user_id' => Auth::user()->uid,
       'status'        => 'Pending',
       'cancel_by'   =>null,
       'cancel_date' =>null,
       
   ));
   DB::table('cash_box')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
       'deleted_at'        => null,
   ));

   DB::table('bank_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));

   DB::table('branch_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
   DB::table('agency_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
   DB::table('customer_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));

   DB::table('income_ledger')
   ->where('uid', $hawala->uid)
   ->update(array(
       'status'        => 'Pending',
       'deleted_by'   =>"Send Hawala Uncancelled By ".Auth::user()->name.' ('.Auth::user()->username.')',
       'restored_date' =>$date,
   ));
 return redirect()->back()->with('success','Send Hawala has been cancelled successfully');
}
}
