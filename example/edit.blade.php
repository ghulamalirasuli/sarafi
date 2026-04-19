@section('title') 
{{ __('ادیت حواله ارسالی') }}
@endsection 
<x-app-layout>

  <script src="{{ asset('plugins/jquery/jquery.min.js')}}"></script>

  <script>
       function gethawalano(val) {
         $.ajax({
          type: "GET",
          url: "/send_hawala/gethawalano/"+val,
          data:'agencyid='+val,
          success: function(data){
              $("#hawala_no").html(data);
              console.log(val);
        } 
          });
   }

      $(document).ready(function() {
        $('.js-example-basic-single').select2();
    });
    function hide_banks() {
      document.getElementById('percent').style.display = 'none';
    }
  
    function show_banks() {
      document.getElementById('percent').style.display = 'block';
    }

    function hideHawalaType() {
  document.getElementById('exchanges').style.display = 'none';
}

function showHawalaType() {
  document.getElementById('exchanges').style.display = 'block';
}

    </script>
        <style>
          .error{
            color: red;
          }
          .star{
            color: red;
          }
        </style>
  <div class="container-fluid">
    <div class="row mb-2">
      <div class="col-sm-6">
        <h1 class="m-0">{{ __('ادیت حواله ارسالی') }}</h1>
      </div><!-- /.col -->
      <div class="col-sm-6">
        <ol class="breadcrumb float-sm-right">
          <li class="breadcrumb-item"><a href="{{route('dashboard')}}">{{ __('Home') }}</a></li>
          <li class="breadcrumb-item active">{{ __('ادیت حواله ارسالی') }} </li>
        </ol>
      </div><!-- /.col -->
    </div><!-- /.row -->
  </div><!-- /.container-fluid -->

  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">{{ __('ادیت حواله ارسالی') }}</h5>

            <div class="card-tools">
              <button type="button" class="btn btn-tool" data-card-widget="collapse">
                <i class="fas fa-minus"></i>
              </button>
            </div>
          </div>
          <!-- /.card-header -->
          <div class="card-body">
            @if ($message = Session::get('error'))
            <div class="alert alert-danger alert-dismissible">
              <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
              <h5><i class="icon fas fa-ban"></i> Alert!</h5>
              {{ __($message) }}
            </div>
        @endif

            @if ($message = Session::get('success'))
            <div class="alert alert-success alert-dismissible">
              <button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button>
              <h5><i class="icon fas fa-check"></i> Alert!</h5>
              {{ __($message) }}
            </div>
          @endif

          <form class="bg-info p-2" method="POST" id="agency-form"  action="{{route('send_hawala.update',$hawala->id)}}">
            @csrf
            @method('PUT')
              
            @if( Auth::user()->user_type=="Mainadmin" ||  Auth::user()->user_type=="Simpleuser")

                  <div class="col-sm-6">
                    <label class="col-form-label">{{__('شعبه')}}</label><br>
                    <select id="branchid" name="branch" class="js-example-basic-single form-select form-control" aria-label="Default select example">
                        <option value="0">...</option>
                        @foreach ($branches as $branch)
                        <option value="{{$branch->uid}}" {{ $hawala->branch_id == $branch->uid ? 'selected' : '' }}>{{$branch->branch_name}} - {{$branch->branch_responsible}}</option>
                        @endforeach
                        
                    </select>
                    @if($errors->has('branch'))
                          <div class="error">{{ $errors->first('branch') }}</div>
                       @endif
                  </div>
                  @endif
            <div class="row">
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('تاریخ')}}</label>
                  <input type="date" name="date" value="<?php echo date("Y-m-d")?>" max="<?php echo date("Y-m-d")?>" class="form-control date" id="inputEmail">
              
            </div>  
            <div class="col-sm-3">
            <label class="col-form-label">{{__('نمایندگی')}}</label><br>
            <select name="agency" id="agency" onChange="gethawalano(this.value);" class="js-example-basic-single form-select form-control" aria-label="Default select example">
              <option value="0">...</option>
              @foreach ($agencys as $agency)
                            <option value="{{ $agency->uid }}" {{ $hawala->reciever_agency == $agency->uid ? 'selected' : '' }}>
                                {{ $agency->agency_name }} - {{ $agency->agency_responsible }}
                            </option>
                    @endforeach
            </select>
            @if($errors->has('agency'))
                    <div class="error">{{ $errors->first('agency') }}</div>
                 @endif
            </div>
            <div class="col-sm-1">
             
            <div id="hawala_no">
              <div class="form-group">
                <label for="exampleInputFile">{{ __('نمبر حواله.') }}</label>
                <div class="input-group">
                    <input type="text" name="hawala_no" value="{{$hawala->hawala_no}}" class="form-control" placeholder="{{ __('Hawala No.') }}">
                   
                </div>
              </div>
            </div>
            </div>
          
          <div class="col-sm-3">
            <div class="form-group">
                <label for="exampleInputFile">{{ __('فرستنده') }}</label>
                <div class="input-group">
                    <input type="text" name="sender" value="{{ $hawala->sender }}" class="form-control" placeholder="{{ __('Enter Sender Name') }}">
                   
                </div>
                @if($errors->has('sender'))
                <div class="error">{{ $errors->first('sender') }}</div>
             @endif
              </div>
        </div>
        <div class="col-sm-3">
          <div class="form-group">
              <label for="exampleInputFile">{{ __('گیرنده') }}</label>
              <div class="input-group">
                  <input type="text" name="reciever" value="{{ $hawala->reciever}}" class="form-control" placeholder="{{ __('Enter Reciever Name') }}">
                 
              </div>
              @if($errors->has('reciever'))
              <div class="error">{{ $errors->first('reciever') }}</div>
           @endif
            </div>
      </div>
            </div>
            <div class="row">
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{ __('نوع حواله:-') }} </label><br>
                <input type="radio" id="simple" value="Simple" name="hawala_type" onclick="hideHawalaType();final_result()" @if($hawala->hawala_type=="Simple") checked @else @endif/>
                {{ __('ساده') }}<br>
                <input type="radio" id="exchange" value="Exchange" name="hawala_type" onclick="showHawalaType();final_result()" @if($hawala->hawala_type=="Exchange") checked @else @endif/>
                {{ __('تباله') }}
                
            </div>
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('ارز فرستنده')}}</label>
                <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies"  name="sender_currency" id="sender_currency" class="form-control">
                 @foreach ($currencies as $cur)
                 <option value="{{$cur->uid}}" {{ $hawala->sender_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
                 @endforeach
                   </select>
                   @if($errors->has('sender_currency'))
                   <div class="error">{{ $errors->first('sender_currency') }}</div>
                @endif
              </div>
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('مبلغ فرستنده')}}</label>
                  <input type="number" value="{{$hawala->sender_amount}}" onkeyup="final_result();final_result2()" id="sender_amount" name="sender_amount" class="form-control"/>
                  @if($errors->has('sender_amount'))
                  <div class="error">{{ $errors->first('sender_amount') }}</div>
               @endif
                </div>
                
                <div class="col-sm-2">
                  <label for="inputEmail3" class="col-form-label">{{ __('کمیشن:-') }} </label><br>
                  <input type="radio" id="manual" onkeyup="final_result2()" value="Manual" name="comission" onclick="hide_banks();" @if( $hawala->percent=='') checked @else @endif/>
                  {{ __('دستی') }}<br>
                  <input type="radio" id="percentage" onkeyup="final_result2()" value="Percentage" name="comission" onclick="show_banks();" @if( $hawala->percent!='') checked @else @endif/>
                  {{ __('فیصدی') }}
                  
              </div>
              <div class="col-sm-2" id="percent" @if($hawala->percent=='') style="display: none" @else style="display: block" @endif >
                <label for="inputEmail3" class="col-form-label">{{__('فیصدی')}}</label>
                  <input type="text" onkeyup="final_result2()" value="{{$hawala->percent}}" id="percent_amount" name="percent_amount" class="form-control"/>
                  @if($errors->has('percent_amount'))
                  <div class="error">{{ $errors->first('percent_amount') }}</div>
               @endif
                </div>
                <div class="col-sm-2">
                  <label for="inputEmail3" class="col-form-label">{{__(' مبلغ کمیشن')}}</label>
                    <input type="text" value="{{$hawala->comission}}" id="com_amount" name="com_amount" class="form-control"/>
                    @if($errors->has('com_amount'))
                    <div class="error">{{ $errors->first('com_amount') }}</div>
                 @endif
                  </div>
            </div>
              {{-- --- To be Hidden--- --}}
              <div id="exchanges" @if($hawala->hawala_type=="Simple") style="display: none" @else style="display: block" @endif >
           <!-- Exchange Section, to be hidden initially and shown when the "Exchange" radio button is selected -->
<div class="row">
  <div class="col-sm-2">
    <label for="inputEmail3" class="col-form-label">{{__('فرمول')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies"  name="formula" id="formula" class="form-control">
     <option value="0">...</option>
     <option value="Multiply" {{ $hawala->formulas == 'Multiply' ? 'selected' : '' }}>{{__('ضرب')}}</option>
     <option value="Division" {{ $hawala->formulas == 'Division' ? 'selected' : '' }}>{{__('تقسیم')}}</option>
       </select>
  </div>
  <!-- Exchange Currency -->
  <div class="col-md-2">
    <label for="exchange_currency" class="col-form-label">{{__('ارز تبادله')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies" name="exchange_currency" id="exchange_currency" class="form-control">
      @foreach ($currencies as $cur)
        <option value="{{$cur->uid}}" {{ $hawala->exchange_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
      @endforeach
    </select>
    @if($errors->has('exchange_currency'))
      <div class="error">{{ $errors->first('exchange_currency') }}</div>
    @endif
  </div>
  
  <!-- Rate -->
  <div class="col-md-2">
    <label for="rate" class="col-form-label">{{__('نرخ')}}</label>
    <input type="text" onkeyup="final_result()" id="rate" name="rate" class="form-control" value="{{$hawala->rate}}"/>
  </div>
  
  <!-- Exchange Amount -->
  <div class="col-md-2">
    <label for="exchange_amount" class="col-form-label">{{__('مبلغ تبادله')}}</label>
    <input type="text" value="{{$hawala->exchange_amount}}" id="exchange_amount" name="exchange_amount" class="form-control"/>
  </div>
</div>
              </div>
               {{-- ---End To be Hidden--- --}}
             
            <div class="row">
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('ارز کمیشن')}}</label>
                <select data-bs-toggle="tooltip" data-bs-placement="top" title="Currencies"  name="com_currency" id="com_currency" class="form-control">
                 @foreach ($currencies as $cur)
                 <option value="{{$cur->uid}}" {{ $hawala->com_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
                 @endforeach
                   </select>
                 
              </div>
              <div class="col-md-4">
                <label for="comment"  class="col-form-label">{{__('ملاحظات (comment)')}}</label>
                <input type="text" id="comment"  name="comment" value="{{$hawala->comment}}"  class="form-control"/>
              </div>
              <div class="col-sm-6">
                <label for="inputEmail3" class="col-form-label">{{__('توضیحات')}}</label>
                  <textarea class="form-control"  name="description" rows="1" cols="50">{{ $hawala->description }}</textarea>
            </div> 
                  </div>
                
              <div class="card-footer">
                <button type="submit" name="new" id="submit-button" class="btn btn-sm btn-primary">{{ __('آپدیت') }}</button>
                <a href="{{route('send_hawala.index')}}" class="btn btn-sm btn-secondary">{{__('Back')}}</a>
              </div>
            </form>
     
          </div>
        </div>
        <!-- /.card -->
      </div>
      <!-- /.col -->
    </div>
    <!-- /.row -->

  </div><!--/. container-fluid -->
  <script  type="text/javascript">
    function final_result() {
    var hawala_type = document.querySelector('input[name="hawala_type"]:checked').value;
    var reciever_amount = parseFloat(document.getElementById("sender_amount").value) || 0;
    var rate = parseFloat(document.getElementById("rate").value) || 1; // Default to 1 if parsing fails
    var formula = document.getElementById("formula").value;

    var sell_amount = reciever_amount; // Default to receiver amount in case none of the conditions apply

    if (hawala_type === "Exchange") {
        if (formula === "Division") {
            sell_amount = reciever_amount / rate;
        } else if (formula === "Multiply") {
            sell_amount = reciever_amount * rate;
        }
        // No need for an additional condition for rate == 1, as it's covered by the default sell_amount initialization
    }

    document.getElementById("exchange_amount").value = sell_amount.toFixed(2);
}

// ---- To find Comission--------->
function final_result2() {
  var reciever_amount = parseFloat(document.getElementById("sender_amount").value) || 0;
  var isPercentage = document.getElementById("percentage").checked;
  var comInput = document.getElementById("com_amount");

  if (isPercentage) {
    // Assuming you have an input field for entering the percentage value
    var percentageValue = parseFloat(document.getElementById("percent_amount").value) || 0;
    var com = (reciever_amount * percentageValue) / 100;
    comInput.value = com.toFixed(2);
  } else {

  }
}

    </script>
</x-app-layout>

