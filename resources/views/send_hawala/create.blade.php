@section('title')
{{ __('حواله ارسالی') }}
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
      document.getElementById('banks').style.display = 'none';
    }

    function show_banks() {
      document.getElementById('banks').style.display = 'block';
    }

    function hideHawalaType() {
  document.getElementById('exchanges').style.display = 'none';
}

function showHawalaType() {
  document.getElementById('exchanges').style.display = 'block';
}

    </script>
  <div class="container-fluid">
    <div class="row mb-2">
      <div class="col-sm-6">
        <h1 class="m-0">{{ __('حواله ارسالی') }}</h1>
      </div><!-- /.col -->
      <div class="col-sm-6">
        <ol class="breadcrumb float-sm-right">
          <li class="breadcrumb-item"><a href="{{route('dashboard')}}">{{ __('Home') }}</a></li>
          <li class="breadcrumb-item"><a href="{{route('send_hawala.index')}}">{{ __('حواله ها') }}</a></li>
          <li class="breadcrumb-item active">{{ __('حواله ارسالی') }} </li>
        </ol>
      </div><!-- /.col -->
    </div><!-- /.row -->
  </div><!-- /.container-fluid -->

  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">{{ __('حواله ارسالی') }}</h5>

            <div class="card-tools">
              <button type="button" class="btn btn-tool" data-card-widget="collapse">
                <i class="fas fa-minus"></i>
              </button>
            </div>
          </div>
          <!-- /.card-header -->
          <div class="card-body">
            <form class="bg-info p-2" method="POST" id="agency-form"  action="{{route('send_hawala.store')}}" enctype="multipart/form-data">
                @csrf
                <div class="row">
                  <div class="col-sm-3">
                <div class="col-sm-3">
                <label class="col-form-label">{{__('نمایندگی')}}</label><br>
                <select name="reciever_agency" id="reciever_agency" onChange="gethawalano(this.value);" class="js-example-basic-single form-select form-control" aria-label="Default select example">
                  <option value="">...</option>
                  @foreach ($agencys as $agency)
                                <option value="{{$agency->uid}}">{{$agency->agency_name}}</option>
                  @endforeach
                </select>
                @if($errors->has('reciever_agency'))
                        <div class="error">{{ $errors->first('reciever_agency') }}</div>
                     @endif
                </div>
                <div class="col-sm-1">

                <div id="hawala_no">
                  <div class="form-group">
                    <label for="exampleInputFile">{{ __('نمبر حواله') }}</label>
                    <div class="input-group">
                        <input type="text" name="hawala_no" value="" class="form-control" placeholder="{{ __('Hawala No.') }}">
                    </div>
                  </div>
                </div>
                </div>

              <div class="col-sm-3">
                <div class="form-group">
            <div class="col-sm-3">
              <div class="form-group">
                  <label for="exampleInputFile">{{ __('فرستنده') }}</label>
                  <div class="input-group">
                      <input type="text" id="sender" name="sender" value="{{old('sender')}}"  class="form-control" placeholder="{{ __('Sender') }}">
                  </div>
                  @if($errors->has('sender'))
                  <div class="error">{{ $errors->first('sender') }}</div>
               @endif
                </div>
          </div>
                </div>
                <div class="row">

                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('ارز فرستنده')}}</label>
                    <select data-bs-toggle="tooltip"  data-bs-placement="top" title="Currencies"  name="sender_currency" id="sender_currency" class="form-control">
                    @foreach ($currencies as $cur)
                      <option value="{{$cur->uid}}" @selected(old('sender_currency') == $cur->uid)>{{$cur->currency_name}}</option>
                    @endforeach
                  </select>
                  @if($errors->has('sender_currency'))
                  <div class="error">{{ $errors->first('sender_currency') }}</div>
               @endif
                  </div>
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('مبلغ فرستنده')}}</label>
                      <input type="text" onkeyup="final_result(); final_result2()" id="sender_amount" name="sender_amount" value="{{old('sender_amount')}}"  class="form-control" placeholder="{{ __('Sender Amount') }}">
                      @if($errors->has('sender_amount'))
                      <div class="error">{{ $errors->first('sender_amount') }}</div>
                  @endif
                  <div class="col-sm-2" id="percent">
                    <label for="inputEmail3" class="col-form-label">{{__('فیصدی')}}</label>
                      <input type="text" id="percent" name="percent" value="{{old('percent')}}"  class="form-control" placeholder="{{ __('Percent') }}">
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-3">
                    <label for="inputEmail3" class="col-form-label">{{__('گیرنده')}}</label>
                      <input type="text" id="reciever" name="reciever" value="{{old('reciever')}}"  class="form-control" placeholder="{{ __('Receiver') }}">
                      @if($errors->has('reciever'))
                      <div class="error">{{ $errors->first('reciever') }}</div>
                  @endif
                  </div>
                  <div class="col-md-2">
                    <label for="inputEmail3" class="col-form-label">{{__('نوع حواله')}}</label>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="hawala_type" id="simple" value="Simple" checked onclick="hideHawalaType()">
                      <label class="form-check-label" for="simple">
                        {{__('ساده')}}
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="hawala_type" id="exchange" value="Exchange" onclick="showHawalaType()">
                      <label class="form-check-label" for="exchange">
                        {{__('تبادله')}}
                      </label>
                    </div>
                  </div>
                </div>
                <div id="exchanges" style="display: none;">
           <!-- Exchange Section, to be hidden initially and shown when the "Exchange" radio button is selected -->
<div class="row">
  <div class="col-sm-2">
    <label for="inputEmail3" class="col-form-label">{{__('فرمول')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies"  name="formula" id="formula" class="form-control">
     <option value="0">...</option>
     <option value="Multiply">{{__('ضرب')}}</option>
     <option value="Division">{{__('تقسیم')}}</option>
       </select>
  </div>
  <!-- Exchange Currency -->
  <div class="col-md-2">
    <label for="exchange_currency" class="col-form-label">{{__('ارز تبادله')}}</label>
    <select data-bs-toggle="tooltip" onchange="final_result()" data-bs-placement="top" title="Currencies" name="exchange_currency" id="exchange_currency" class="form-control">
      @foreach ($currencies as $cur)
        <option value="{{$cur->uid}}" @selected(old('exchange_currency') == $cur->uid)>{{$cur->currency_name}}</option>
      @endforeach
    </select>
    @if($errors->has('exchange_currency'))
      <div class="error">{{ $errors->first('exchange_currency') }}</div>
    @endif
  </div>

  <!-- Rate -->
  <div class="col-md-2">
    <label for="rate" class="col-form-label">{{__('نرخ')}}</label>
    <input type="text" onkeyup="final_result()" id="rate" name="rate" class="form-control" value="1"/>
  </div>

  <!-- Exchange Amount -->
  <div class="col-md-2">
    <label for="exchange_amount" class="col-form-label">{{__('مبلغ تبادله')}}</label>
    <input type="text" id="exchange_amount" name="exchange_amount" class="form-control"/>
  </div>
</div>
              </div>
               {{-- ---End To be Hidden--- --}}

            <div class="row">
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('ارز کمیشن')}}</label>
                <select data-bs-toggle="tooltip" data-bs-placement="top" title="Currencies"  name="com_currency" id="com_currency" class="form-control">
                @foreach ($currencies as $cur)
                  <option value="{{$cur->uid}}" @selected(old('com_currency') == $cur->uid)>{{$cur->currency_name}}</option>
                @endforeach
              </select>
              @if($errors->has('com_currency'))
              <div class="error">{{ $errors->first('com_currency') }}</div>
           @endif
              </div>
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('مبلغ کمیشن')}}</label>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="comission" id="manual" value="Manual" checked onclick="hide_banks()">
                  <label class="form-check-label" for="manual">
                    {{__('دستی')}}
                  </label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="comission" id="percentage" value="Percentage" onclick="show_banks()">
                  <label class="form-check-label" for="percentage">
                    {{__('فیصدی')}}
                  </label>
                </div>
              </div>
              <div class="col-sm-2" id="banks" style="display: none;">
                <label for="inputEmail3" class="col-form-label">{{__('فیصدی کمیشن')}}</label>
                  <input type="text" id="percent_amount" name="percent_amount" value="{{old('percent_amount')}}" onkeyup="final_result2()" class="form-control" placeholder="{{ __('Percent Amount') }}">
              </div>
              <div class="col-sm-2">
                <label for="inputEmail3" class="col-form-label">{{__('مبلغ کمیشن')}}</label>
                  <input type="text" id="com_amount" name="com_amount" value="{{old('com_amount')}}"  class="form-control" placeholder="{{ __('Commission Amount') }}">
                  @if($errors->has('com_amount'))
                  <div class="error">{{ $errors->first('com_amount') }}</div>
              @endif
              </div>
              <div class="col-md-4">
                <label for="comment"  class="col-form-label">{{__('ملاحظات (comment)')}}</label>
                <input type="text" id="comment"  name="comment" value="{{old('comment')}}"  class="form-control"/>
              </div>
              <div class="col-sm-6">
                <label for="inputEmail3" class="col-form-label">{{__('توضیحات')}}</label>
                  <textarea class="form-control"  name="description" rows="1" cols="50">{{ old('description') }}</textarea>
            </div>
                  </div>

              <div class="row">
                <div class="col-md-2">
                  <label for="inputEmail3" class="col-form-label">{{__('فایل')}}</label>
                  <input type="file" id="file" name="file" class="form-control"/>
                </div>
              </div>
                  <div class="card-footer">
                    <button type="submit" name="new"  class="btn btn-sm btn-primary">{{ __('ذخیره') }}</button>
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

// ---- To find Comission--------->>
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
    // If manual is selected, the user will input the commission amount manually.
    // You might want to clear the commission amount input or leave it as is.
    // For example, to clear the input you can uncomment the next line.
    // comInput.value = '';
  }
}

    </script>
</x-app-layout>