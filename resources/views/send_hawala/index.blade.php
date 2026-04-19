@section('title')
{{ __('حواله های ارسالی') }}
@endsection
<x-app-layout>

  <div class="container-fluid">
    <div class="row mb-2">
      <div class="col-sm-6">
        <h1 class="m-0">{{ __('حواله های ارسالی') }}</h1>
      </div><!-- /.col -->
      <div class="col-sm-6">
        <ol class="breadcrumb float-sm-right">
          <li class="breadcrumb-item"><a href="{{route('dashboard')}}">{{ __('Home') }}</a></li>
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
            <h5 class="card-title">{{ __('حواله های ارسالی') }}</h5>

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
          <table class="mt-100">

            <tr>
          {{-- <form method="GET">
            @if( Auth::user()->user_type=="Mainadmin" ||  Auth::user()->user_type=="Simpleuser")
            <td>
                <select data-bs-toggle="tooltip" data-bs-placement="top" title="Branch"  name="branch" id="branch" class="js-example-basic-single form-select form-control">
                 <option value='0'>...</option>
                @foreach ($branches as $user)
                <option value="{{$user->uid}}" {{Request::get('branch') == $user->uid ? 'selected':''}}>{{$user->branch_name}} ({{$user->branch_responsible}})</option>
                @endforeach
                  /* Lines 61-63 omitted */
            </td>
            @endif
            <td>
              <select data-bs-toggle="tooltip" data-bs-placement="top" title="Status"  name="status" id="status" class="js-example-basic-single form-select form-control">
               <option value='0'>...</option>
              <option value="Pending" {{Request::get('status') == "Pending" ? 'selected':''}}>{{__('Unpaid')}}</option>
              <option value="Confirmed" {{Request::get('status') == "Confirmed" ? 'selected':''}}>{{__('Paid')}}</option>
              <option value="Cancelled" {{Request::get('status') == "Cancelled" ? 'selected':''}}>{{__('Cancelled')}}</option>
            </select>

          </td>
              <td>
                  <input type="date" name="from_date" id="from_date" value="{{ Request::get('from_date') }}" class="form-control" >
              </td>

                <td>
                     /* Lines 79-80 omitted */
                </td>
                <td>
                <input type="submit" name="filter" id="filter" class="btn btn-info btn-sm" value="{{__('Search')}}">
                </td>
              </form>
              <td colspan="2">
                <a class="btn btn-sm btn-primary" href="{{route('send_hawala.create')}}">{{__('New Hawala')}}</a>
              </td>
              <td>

                @if(Request::get('branch') || Request::get('status') || Request::get('from_date') || Request::get('to_date'))
                <a type="button" class="btn btn-danger  btn-sm" href="{{ route('send_hawala.index') }}">
          </table> --}}
          <a class="btn btn-sm btn-primary" href="{{route('send_hawala.create')}}">{{__('New Hawala')}}</a>
          @if (count($send_hawala) > 0 )
          <table id="example1" class="table table-bordered table-striped">
            <thead>
            <tr>
              <th scope="col">#</th>
              <th>{{ __('Date') }}</th>
              <th>{{ __('User') }}</th>
              <th>{{ __('Agency') }}</th>
              <th>{{ __('Sender') }}</th>
              <th>{{ __('Receiver') }}</th>
              <th>{{ __('Rate') }}</th>
              <th>{{ __('Percent') }}</th>
              <th>{{ __('Status') }}</th>
              <th>{{ __('Due Type') }}</th>
              <th>{{ __('Actions') }}</th>
            </tr>
          </thead>
          <tbody>
            @foreach($send_hawala as $key => $ledger)
            @php
            $showRecord = (Auth::user()->user_type == "Mainadmin" || Auth::user()->user_type == "Simpleuser" || $ledger->branch_id == Auth::user()->branch_id) ? true : false;
        @endphp
        @if($showRecord)
            <tr>
              <td>{{ ++$key }} </td>
              <td>{{ $ledger->date_confirm }}<br>
                <small>{{ $ledger->hawala_no }}</small>
              </td>

              <td>{{ $ledger->UserName }} </td>
              <td>{{ $ledger->Agency }}<br>
                <small>{{ $ledger->Branch }}</small>
              </td>
              <td>{{$ledger->sender }} <b>({{number_format($ledger->sender_amount) }} {{$ledger->RCurrency}})</b></td>
              <td>{{$ledger->reciever }} <b>({{number_format($ledger->exchange_amount) }} {{$ledger->ECurrency}})</b></td>
              <td>{{ $ledger->rate }}</td>
              <td>{{ $ledger->percent}}</td>
              <td>
                @if($ledger->status == 'Pending')
                  <span class="badge badge-warning">{{ __('Pending') }}</span>
                @elseif($ledger->status == 'Confirmed')
                  <span class="badge badge-success">{{ __('Paid') }}</span>
                @elseif($ledger->status == 'Cancelled')
                  <span class="badge badge-danger">{{ __('Cancelled') }}</span>
                @endif
              </td>
              <td>{{ $ledger->due_type }}<b class="ml-2">{{ $ledger->source_name }}</b></td>
              <td>
                @if($ledger->status == 'Pending')
                  <a href="{{ route('send_hawala.show', $ledger->id) }}" class="btn btn-sm btn-info">{{ __('Pay') }}</a>
                  <a href="{{ route('send_hawala.edit', $ledger->id) }}" class="btn btn-sm btn-warning">{{ __('Edit') }}</a>
                  <a href="{{ route('send_hawala.cancel', $ledger->id) }}" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">{{ __('Cancel') }}</a>
                @elseif($ledger->status == 'Cancelled')
                  <a href="{{ route('send_hawala.uncancel', $ledger->id) }}" class="btn btn-sm btn-success" onclick="return confirm('Are you sure?')">{{ __('Uncancel') }}</a>
                @else
                  <a href="{{ route('send_hawala.printPreview', $ledger->id) }}" class="btn btn-sm btn-primary" target="_blank">{{ __('Print') }}</a>
                @endif
           </tr>
           @endif
           @endforeach
          </tbody>
        </table>
        @endif
          </div>
        </div>
        <!-- /.card -->
      </div>
      <!-- /.col -->
    </div>
    <!-- /.row -->

  </div><!--/. container-fluid -->

</x-app-layout>