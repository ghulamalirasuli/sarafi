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
                <div class="col-sm-3">
                <label class="col-form-label">{{__('نمایندگی')}}</label><br>
                <select name="agency" id="agency" onChange="gethawalano(this.value);" class="js-example-basic-single form-select form-control" aria-label="Default select example">
                  <option value="0">...</option>
                  @foreach ($agencys as $agency)
                                <option value="{{$agency->uid}}" {{ $hawala->reciever_agency == $agency->uid ? 'selected' : '' }}>{{$agency->agency_name}}</option>
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
                        <input type="text" name="hawala_no" value="{{ $hawala->hawala_no }}" class="form-control" placeholder="{{ __('Hawala No.') }}">
                    </div>
                  </div>
                </div>
                </div>

              <div class="col-sm-3">
                <div class="form-group">
            <div class="col-sm-3">
              <div class="form-group">
                  <label for="exampleInputFile">{{ __('گیرنده') }}</label>
                  <div class="input-group">
                      <input type="text" id="reciever" name="reciever" value="{{ $hawala->reciever }}"  class="form-control" placeholder="{{ __('Receiver') }}">
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
                      <input type="text" onkeyup="final_result(); final_result2()" id="sender_amount" name="sender_amount" value="{{ $hawala->sender_amount }}"  class="form-control" placeholder="{{ __('Sender Amount') }}">
                      @if($errors->has('sender_amount'))
                      <div class="error">{{ $errors->first('sender_amount') }}</div>
                  @endif
                  <div class="col-sm-2" id="percent">
                    <label for="inputEmail3" class="col-form-label">{{__('فیصدی')}}</label>
                      <input type="text" id="percent" name="percent" value="{{ $hawala->percent }}"  class="form-control" placeholder="{{ __('Percent') }}">
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-3">
                    <label for="inputEmail3" class="col-form-label">{{__('نوع پرداخت')}}</label>
                    <select name="pay_type" id="pay_type" onchange="getdue_type(this.value);" class="form-control">
                      <option value="Cash" {{ $hawala->due_type == 'Cash' ? 'selected' : '' }}>{{ __('نقدی') }}</option>
                      <option value="Customer" {{ $hawala->due_type == 'Customer' ? 'selected' : '' }}>{{ __('مشتری') }}</option>
                      <option value="Branch" {{ $hawala->due_type == 'Branch' ? 'selected' : '' }}>{{ __('شعبه') }}</option>
                      <option value="Bank" {{ $hawala->due_type == 'Bank' ? 'selected' : '' }}>{{ __('بانک') }}</option>
                    </select>
                  </div>
                  <div class="col-sm-3">
                    <div id="due_type">
                      @include('send_hawala.pay_type', ['due_type' => $hawala->due_type ?? 'Cash', 'customers' => $customers, 'branches' => $branches, 'banks' => $banks])
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('ارز تبادله')}}</label>
                    <select data-bs-toggle="tooltip"  data-bs-placement="top" title="Currencies"  name="exchange_currency" id="exchange_currency" class="form-control">
                    @foreach ($currencies as $cur)
                      <option value="{{$cur->uid}}" {{ $hawala->exchange_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
                    @endforeach
                  </select>
                  </div>
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('نرخ')}}</label>
                      <input type="text" id="rate" name="rate" value="{{ $hawala->rate }}"  class="form-control" placeholder="{{ __('Rate') }}">
                  </div>
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('مبلغ تبادله')}}</label>
                      <input type="text" id="exchange_amount" name="exchange_amount" value="{{ $hawala->exchange_amount }}"  class="form-control" placeholder="{{ __('Exchange Amount') }}">
                  </div>
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('ارز کمیشن')}}</label>
                    <select data-bs-toggle="tooltip" data-bs-placement="top" title="Currencies"  name="com_currency" id="com_currency" class="form-control">
                    @foreach ($currencies as $cur)
                      <option value="{{$cur->uid}}" {{ $hawala->com_currency == $cur->uid ? 'selected' : '' }}>{{$cur->currency_name}}</option>
                    @endforeach
                  </select>
                  </div>
                  <div class="col-sm-2">
                    <label for="inputEmail3" class="col-form-label">{{__('مبلغ کمیشن')}}</label>
                      <input type="text" id="com_amount" name="com_amount" value="{{ $hawala->com_amount }}"  class="form-control" placeholder="{{ __('Commission Amount') }}">
                      @if($errors->has('com_amount'))
                      <div class="error">{{ $errors->first('com_amount') }}</div>
                  @endif
                  </div>
                  <div class="col-md-4">
                    <label for="comment"  class="col-form-label">{{__('ملاحظات (comment)')}}</label>
                    <input type="text" id="comment"  name="comment" value="{{ $hawala->comment }}"  class="form-control"/>
                  </div>
                  <div class="col-sm-6">
                    <label for="inputEmail3" class="col-form-label">{{__('توضیحات')}}</label>
                      <textarea class="form-control"  name="description" rows="1" cols="50">{{ $hawala->description }}</textarea>
                </div>
                      </div>

                  <div class="row">
                    <div class="col-md-2">
                      <label for="inputEmail3" class="col-form-label">{{__('فایل')}}</label>
                      <input type="file" id="file" name="file" class="form-control"/>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button type="submit" name="new"  class="btn btn-sm btn-primary">{{ __('پرداخت') }}</button>
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