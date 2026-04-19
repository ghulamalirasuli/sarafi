<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <title>Print Hawala</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Tahoma, Arial, sans-serif; direction: rtl; }
        .header { background: #007bff; color: white; padding: 10px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .col { flex: 1; text-align: center; padding: 5px; }
        .info-row { background: #e9ecef; padding: 10px; margin: 10px 0; }
        .amounts { background: #d4edda; padding: 15px; }
        .comment { background: #fff3cd; padding: 15px; font-weight: bold; color: #856404; }
        @media print { body { -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body onload="window.print()">
    <div class="container">
        <div class="header row">
            <div class="col">{{ __('ارسال به') }}: {{ $hawala->Agency ?? 'N/A' }}</div>
            <div class="col">{{ __('حواله #') }}: {{ $hawala->hawala_no }}</div>
            <div class="col">{{ __('شعبه') }}: {{ $hawala->Branch ?? 'N/A' }}</div>
            <div class="col">{{ __('تاریخ') }}: {{ $hawala->date_update?->format('Y-m-d H:i') }}</div>
        </div>
        
        <div class="info-row row">
            <div class="col">{{ __('فرستنده') }}: {{ $hawala->sender }}</div>
            <div class="col">{{ __('گیرنده') }}: {{ $hawala->reciever }}</div>
            <div class="col">{{ __('نوع پرداخت') }}: {{ ucfirst($hawala->due_type ?? 'N/A') }}</div>
        </div>
        
        <div class="amounts row">
            <div class="col">{{ __('ارسال') }}: {{ number_format($hawala->sender_amount, 2) }} {{ $hawala->RCurrency }}</div>
            <div class="col">{{ __('دریافت') }}: {{ number_format($hawala->exchange_amount, 2) }} {{ $hawala->ECurrency }}</div>
            <div class="col">{{ __('نرخ') }}: {{ $hawala->rate }}</div>
            <div class="col">{{ __('کمیسیون') }}: {{ number_format($hawala->comission, 2) }} {{ $hawala->CCurrency }}</div>
        </div>
        
        <div class="comment">
            {{ $hawala->comment }} {{ $hawala->description }}
        </div>
        
        @if($hawala->docs)
            <img src="/hawala_send/{{ $hawala->docs }}" style="max-width: 300px; margin-top: 20px;" alt="Document">
        @endif
    </div>
</body>
</html>
