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
                  </select>
            
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
                     <input type="date"  name="to_date" id="to_date" value="{{ Request::get('to_date') }}" class="form-control" />
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
                 {{__('Reset')}}</a>   
                  @endif
   
                  </td>
            </tr>
          </table> --}}
          <a class="btn btn-sm btn-primary" href="{{route('send_hawala.create')}}">{{__('New Hawala')}}</a>
          @if (count($send_hawala) > 0 )
          <table id="example1" class="table table-bordered table-striped">
            <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{{__('تاریخ')}}</th>
              <th scope="col">{{__('کاربر')}}</th>
              <th scope="col">{{__('نمایندگی')}}</th>
              <th scope="col">{{__('فرستنده')}}</th>
              <th scope="col">{{__('گیرنده')}}</th>
              <th scope="col">{{__('نرخ')}}</th>
              <th scope="col">{{__('فیصدی')}}</th>
              <th scope="col">{{__('کمیشن')}}</th>
              <th scope="col">{{__('نوع اجرا')}}</th>
              <th scope="col">{{__('حالت')}}</th>
              <th scope="col">{{__('عملکرد')}}</th>
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
                @if($ledger->date_update!="")
                <span class="text-muted" style="font-size: 10px">Updated by:<b>{{$ledger->update_user_name}}<br> <b>{{$ledger->updated_at}}<br></span>
                @endif
              </td>
             
              <td>{{ $ledger->UserName }} </td>
              <td>{{ $ledger->Agency }}<br>
                <b> {{ __('Hawala No. = ') }}{{ $ledger->hawala_no }} </b>
              </td>
              <td>{{$ledger->sender }} <b>({{number_format($ledger->sender_amount) }} {{$ledger->RCurrency}})</b></td>
              <td>{{$ledger->reciever }} <b>({{number_format($ledger->exchange_amount) }} {{$ledger->ECurrency}})</b></td>
              <td>{{ $ledger->rate }}</td>
              <td>{{ $ledger->percent}}</td>
              <td>
                @if( $ledger->comission)
                {{ $ledger->comission }}<b>({{ $ledger->CCurrency }})</b>
                @endif
              </td>
              <td>{{ $ledger->due_type }}<b class="ml-2">{{ $ledger->source_name }}</b></td>
              <td>
                @if($ledger->docs)
                <a class="btn btn-sm btn-info" href="/hawala_send/{{ $ledger->docs }}" target="_blank">
                  سند
                </a>
                @else
                @endif
                @if($ledger->status=="Pending")
                <a href="{{ route('send_hawala.show',$ledger->id) }}" class="btn btn-sm btn-warning">{{__('ناپرداخت')}}</a>
                  {{-- <span class="badge badge-warning">{{__('Unpaid')}}</span> --}}
                @elseif($ledger->status=="Confirmed")
                  <span class="badge badge-success">{{__('فرستاده شد')}}</span>
                @elseif($ledger->status=="Cancelled")
                   <span class="badge badge-secondary">{{__('کنسلد')}}</span>
                   <span class="badge badge-success">{{$ledger->cancel_by}}</span>
                   <span class="badge badge-primary">{{$ledger->cancel_date }}</span>
                   @endif
                </td>
              <td>
                <div class="btn-group">
                  <button type="button" class="btn btn-tool dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                  </button>
                  <div class="dropdown-menu dropdown-menu-right" role="menu" style="">
                   @if($ledger->status=="Pending")
                    <a href="{{ route('send_hawala.edit',$ledger->id ) }}" class="dropdown-item text-primary"><i class="fa fa-edit"></i></a>
                    @if($ledger->status=="Pending")
                    <a href="#" class="dropdown-item">
                      <form method="post" action="{{route('send_hawala.destroy',$ledger->id) }}">
                        @csrf
                        @method('DELETE')
                        <input type="hidden" name="branchID" value="{{$ledger->id}}" />
                        <button class="btn btn-xs btn-danger btn-flat" onclick="return deletes();" type="submit">
                          {{ __('Delete') }}
                          </button>
                    </form>
                      </a>
                      @endif
                    </a>
                    @endif
                    @if($ledger->status=="Cancelled")
                    <a href="#" class="dropdown-item">
                      <form method="post" action="{{route('send_hawala.uncancel',$ledger->id) }}">
                        @csrf
                        @method('PUT')
                        <input type="hidden" name="branchID" value="{{$ledger->id}}" />
                        <button class="btn btn-xs btn-warning btn-flat" onclick="return cancel();" type="submit">
                          {{ __('UNncancel') }}
                          </button>
                    </form>
                    </a>
                    @else 
                    <a href="#" class="dropdown-item">
                      <form method="post" action="{{route('send_hawala.cancel',$ledger->id) }}">
                        @csrf
                        @method('PUT')
                        <input type="hidden" name="branchID" value="{{$ledger->id}}" />
                        <button class="btn btn-xs btn-secondary btn-flat" onclick="return cancel();" type="submit">
                          {{ __('Cancel') }}
                          </button>
                    </form>
                    </a>
                    @endif
                    
                    <a target="_blank" href="{{ route('send_hawala.printPreview',$ledger->id ) }}" class="dropdown-item btn btn-primary btn-sm">{{__('چاپ')}}</a>
                  </div>
                </div>
                </td>
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

