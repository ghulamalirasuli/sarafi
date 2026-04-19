@section('title') 
{{ __('حواله های ارسالی') }}
@endsection 
<x-app-layout>

  <script src="{{ asset('plugins/jquery/jquery.min.js')}}"></script>

  <script>
       function getdue_type(val) {
         $.ajax({
          type: "GET",
          url: "/send_hawala/getdue_type/"+val,
          data:'pay_type='+val,
          success: function(data){
              $("#due_type").html(data);
              $('#due_type select').select2({
                placeholder: 'Select an account',  // Optional: Placeholder text
                allowClear: true                    // Optional: Allow clearing selection
            });
        } 
          });
   }
   
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
        <h1 class="m-0">{{ __('حواله های ارسالی ') }}</h1>
      </div><!-- /.col -->
      <div class="col-sm-6">
        <ol class="breadcrumb float-sm-right">
          <li class="breadcrumb-item"><a href="{{route('dashboard')}}">{{ __('Home') }}</a></li>
          <li class="breadcrumb-item"><a href="{{route('send_hawala.index')}}">{{ __('حواله ها') }}</a></li>
          <li class="breadcrumb-item active">{{ __('حواله های ارسالی') }} </li>
        </ol>
      </div><!-- /.col -->
    </div><!-- /.row -->
  </div><!-- /.container-fluid -->

  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">{{ __('حواله های ارسالی ') }}</h5>

            <div class="card-tools">
              <button type="button" class="btn btn-tool" data-card-widget="collapse">
                <i class="fas fa-minus"></i>
              </button>
            </div>
          </div>
          <!-- /.card-header -->
          <div class="card-body">
            <div class="alert alert-warning alert-dismissible">
              <i class="icon fas fa-exclamation-triangle"></i> 
              {{ __('قبل از ارسال فرم خود را از جزییات حواله مطمین سازید') }}
            </div>
            <form class="bg-info p-2" method="POST" id="agency-form"  action="{{route('send_hawala.pay',$hawala->id)}}" enctype="multipart/form-data">
                @csrf
                @method('PUT')
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
                    <label for="exampleInputFile">{{ __('نمبر حواله') }}</label>
                    <div class="input-group">
                        <input type="text" readonly name="hawala_no" value="{{$hawala->hawala_no}}" class="form-control" placeholder="{{ __('Hawala No.') }}">
                       
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
                    <label for="inputEmail3" class="col-form-label">{{__('ارز فرستنده')}}</label>
                    <select data-bs-toggle="tooltip"  data-bs-placement="top" title="Currencies"  name="sender_currency" id="sender_currency" class="form-control">
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
                      <input type="number" readonly value="{{$hawala->sender_amount}}" id="sender_amount" name="sender_amount" class="form-control"/>
                      @if($errors->has('sender_amount'))
                      <div class="error">{{ $errors->first('sender_amount') }}</div>
                   @endif
                    </div>
                    
                   
                  <div class="col-sm-2" id="percent">
                    <label for="inputEmail3" class="col-form-label">{{__('فیصدی')}}</label>
                      <input type="text" readonly value="{{$hawala->percent}}" id="percent_amount" name="percent_amount" class="form-control"/>
                      @if($errors->has('percent_amount'))
                      <div class="error">{{ $errors->first('percent_amount') }}</div>
                   @endif
                    </div>
                    <div class="col-sm-2">
                      <label for="inputEmail3" class="col-form-label">{{__('مبلغ کمیشن')}}</label>
                        <input type="text" readonly value="{{$hawala->comission}}" id="com_amount" name="com_amount" class="form-control"/>
                        @if($errors->has('com_amount'))
                        <div class="error">{{ $errors->first('com_amount') }}</div>
                     @endif
                      </div>
                      <div class="col-md-2">
                        <label for="exchange_currency" class="col-form-label">{{__('ارز تبادله')}}</label>
                        <select data-bs-toggle="tooltip" data-bs-placement="top" title="Currencies" name="exchange_currency" id="exchange_currency" class="form-control">
                          @foreach ($currencies as $cur)
                            <option value="{{$cur->uid}}" {{ $hawala->exchange_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
                          @endforeach
                        </select>
                        @if($errors->has('exchange_currency'))
                          <div class="error">{{ $errors->first('exchange_currency') }}</div>
                        @endif
                      </div>
                     
                      <!-- Exchange Amount -->
                      <div class="col-md-2">
                        <label for="exchange_amount" class="col-form-label">{{__('مبلغ تبالده')}}</label>
                        <input type="text" readonly onkeyup="final_result()" value="{{$hawala->exchange_amount}}" id="exchange_amount" name="exchange_amount" class="form-control"/>
                      </div>
                </div>
                <div class="row">
                  <div class="col-md-2">
                    <label for="file" class="col-form-label">{{__('سند')}}</label>
                    <input type="file" id="file" name="file" class="form-control"/>
                  </div>
                    <div class="col-sm-3">
                      <label for="inputEmail3" class="col-form-label">{{__('نوع پرداخت')}}</label>
                      <select onChange="getdue_type(this.value);"  name="pay_type" id="pay_type" class="form-control">
                       <option value="Cash">{{__('نقده')}}</option>
                       <option value="Customer">{{__('حساب مشتری')}}</option>
                       <option value="Branch">{{__('حساب شعبه')}}</option>
                       <option value="Bank">{{__('حشاب بانک')}}</option>
                         </select>
                    </div>
                    <div class="col-sm-7">
                        <div id="due_type"></div>
                    </div>
                </div>
                  <div class="card-footer">
                    <button type="submit" name="submit" class="btn btn-sm btn-primary">{{ __('ارسال') }}</button>
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
  <script>
    function final_result() {
  var exchange_amount = parseFloat(document.getElementById("exchange_amount").value);
  var amount1 =parseFloat(document.getElementById("amount1").value);

  var amount2 = exchange_amount - amount1;
  document.getElementById("amount2").value = amount2;
}

    </script>
</x-app-layout>

