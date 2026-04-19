@if($due_type=="Cash")

@elseif($due_type=="Customer")
<div class="row">
<div class="col-md-6">
    <label for="exchange_currency" class="col-form-label">{{__('مشتری')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies" name="customer" id="customer" class="form-control">
      @foreach ($customers as $cur)
        <option value="{{$cur->uid}}">{{$cur->fullname .' '.$cur->branch_name}}</option>
      @endforeach
    </select>
  </div>
  
  <div class="col-sm-6">
    <label for="inputEmail3" class="col-form-label">{{__('چک نمبر.')}}</label>
      <input type="text"  id="bill_no" name="bill_no" class="form-control"/>
    </div>
  </div>
@elseif($due_type=="Branch")
<div class="row">
<div class="col-md-6">
    <label for="exchange_currency" class="col-form-label">{{__('شعبه')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies" name="branch_name" id="branch_name" class="form-control">
      @foreach ($branches as $br)
        <option value=" {{ $br->uid}}"> {{ $br->branch_name }} - {{ $br->branch_responsible }}</option>
      @endforeach
    </select>
  </div>
  <div class="col-sm-6">
    <label for="inputEmail3" class="col-form-label">{{__('چک نمبر.')}}</label>
      <input type="text"  id="bill_no" name="bill_no" class="form-control"/>
    </div>
</div>
@elseif($due_type=="Bank")

<div class="col-md-6">
    <label for="exchange_currency" class="col-form-label">{{__('بانک')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies" name="bank" id="bank" class="form-control">
      @foreach ($banks as $ba)
        <option value="{{$ba->uid}})"> {{$ba->bankname}} ({{$ba->accountnumber}})</option>
      @endforeach
    </select>
  </div>

@endif
