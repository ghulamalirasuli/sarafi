<!DOCTYPE html>
<html>
    <head>
        <title>Print Hawala</title>
        <meta charset="utf-8">
        <meta content="width=device-width, initial-scale=1.0" name="viewport">
      
        <title>@yield('title')</title>
        <meta content="" name="description">
        <meta content="" name="keywords">
        <link rel="stylesheet" href="{{ asset('dist/css/adminlte.css') }}">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
        <!-- Font Awesome -->
        <link rel="stylesheet" href="{{ asset('plugins/fontawesome-free/css/all.min.css')}}">
        <!-- Theme style -->
        <link rel="stylesheet" href="{{ asset('dist/css/adminlte.min.css')}}">
      </head>
<body onload="window.print()">
    <div class="container">
  <div class="card">
    <div class="card-body">
      @if($service)
      <img src="/banners/{{ $service->banner }}" width="100%" class="img-thumbnail">
      @else
      <img src="/defaultban.jpg" width="100%" class="img-thumbnail">
      @endif
     <div class="row bg-info" dir="rtl">
      <div class="col-sm-3">{{ __('ارسال به نمایندگی') }}: {{ $hawala->Agency}}</div>
      <div class="col-sm-3">{{ __('نمبر حواله') }}: {{ $hawala->hawala_no}}</div>
      <div class="col-sm-3">{{ __('شعبه') }}: {{ $hawala->Branch}}</div>
      <div class="col-sm-3">{{ __('تاریخ') }}: 
        <?php
        $dateString =  $hawala->date_update;
        
        // Convert the string to a DateTime object
        $date = new DateTime($dateString);
        
        // Extract date and time separately
        $dateFormatted = $date->format('Y-m-d'); // Date in Y-m-d format
        $timeFormatted = $date->format('h:i A'); // Time in 12-hour format with AM/PM
        ?>
         {{ $dateFormatted}} <b> {{ $timeFormatted}}</b>
        </div>
     </div>
     <div class="row bg-success" dir="rtl">
      <div class="col-sm-4">{{ __('فرستنده') }}: {{ $hawala->sender}} </div>
      <div class="col-sm-4">{{ __('گیرنده') }}: {{ $hawala->reciever}}</div>
      <div class="col-sm-4">{{ __('نوع اجرا') }}: {{ $hawala->due_type}} ({{ $hawala->source_name}})</div>
     </div>
     <div class="row bg-info" dir="rtl">
      <div class="col-sm-3">{{ __('مبلغ فرستنده') }}: {{ $hawala->sender_amount}} {{ $hawala->RCurrency}}</div>
      <div class="col-sm-3">{{ __('مبلغ گیرنده') }}: {{ $hawala->exchange_amount}} {{ $hawala->ECurrency}}</div>
      <div class="col-sm-2">{{ __('نرخ') }}:{{ $hawala->rate}}</div>
      <div class="col-sm-2">{{ __('فیضدی') }}: {{ $hawala->percent}} </div>
      <div class="col-sm-2">{{ __('کمیشن ') }}: {{ $hawala->comission}} {{ $hawala->CCurrency}} </div>
     </div>
     <div class="row bg-warning" dir="rtl">
      <div class="col-sm-12 text-center"><b class="text-danger">{{ $hawala->comment}}</b> {{ $hawala->description}}</div>
     </div>
     @if($hawala->docs)
    <img src="/hawala_send/{{ $hawala->docs }}" width="200" >
    @endif
  </div>
    </div>

    </div>
</body>
</html>


