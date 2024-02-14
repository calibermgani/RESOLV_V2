import { Component,ViewChildren,ElementRef,QueryList,OnInit,ChangeDetectionStrategy,Input, EventEmitter, Output, OnChanges,ViewEncapsulation } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
// import * as FileSaver from 'file-saver';
import { NgbModal, ModalDismissReasons,NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { FollowupService } from '../../Services/followup.service';
import { debounceTime } from 'rxjs/operators';
// import { pipe } from 'rxjs/util/pipe';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ExcelService } from '../../excel.service';
import { ExportFunctionsService } from '../../Services/export-functions.service';
import { NotifyService } from '../../Services/notify.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
// import { WorkOrderAssign } from '../../models/work-order-assign.bar';
import { AuthService } from '../../Services/auth.service';

import { NgbDatepickerConfig, NgbCalendar, NgbDate, NgbDateStruct,NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
// import { forEach } from '@angular/router/src/utils/collection';
// import { NgbDateCustomParserFormatter} from '../../date_file';
import { NotesHandlerService } from '../../Services/notes-handler.service';
import * as moment from 'moment';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

alwaysShowCalendars: boolean;
ranges: any = {
  'Today': [moment(), moment()],
  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
  'This Month': [moment().startOf('month'), moment().endOf('month')],
  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
}

rangese: any = {
  'Today': [moment(), moment()],
  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
  'Last 7 Days': [moment().subtract(6, 'days'), moment()],
  'Last 30 Days': [moment().subtract(29, 'days'), moment()],
  'This Month': [moment().startOf('month'), moment().endOf('month')],
  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
}

invalidDates: moment.Moment[] = [moment().add(2, 'days'), moment().add(3, 'days'), moment().add(5, 'days')];
isInvalidDate = (m: moment.Moment) =>  {
  return this.invalidDates.some(d => d.isSame(m, 'day') )
}

  response_data!: Subscription;
  observalble!: Subscription;
  update_monitor: Subscription;
  isopend=true;
  subscription !: Subscription;
  bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true  });

  constructor(
  	private formBuilder: FormBuilder,
  	private Jarwis: JarwisService,
    private auth : AuthService,
	private setus: SetUserService,
	private loadingBar: LoadingBarService,
	private modalService: NgbModal,
	private follow: FollowupService,
	public toastr: ToastrManager,
	private excelService:ExcelService,
	private export_handler:ExportFunctionsService,
	private notify_service:NotifyService,
	private datepipe: DatePipe,
	private date_config  : NgbDatepickerConfig,
	private calendar: NgbCalendar,
	private notes_hadler:NotesHandlerService,) {
    this.alwaysShowCalendars = true;
    this.update_monitor=this.notes_hadler.refresh_update().subscribe(message => {
        this.get_report_claims(this.pages,'null','null');
        console.log(this.update_monitor);

    });
   }

  public buyer_name:any;
  submitted = false;
  reportSearch!: FormGroup;
  Status:any;
  Users:any;
  date_range:any;
  associates_detail:any = [];

  ngOnInit() {
    // this.auth.tokenValue.next(false);
    this.formValidator();
  	this.get_buyer();

    this.subscription=this.notify_service.fetch_touch_limit().subscribe(message => {
    this.touch_count = message });
    this.formValidator();
  }

  formValidator(){
    this.reportSearch = this.formBuilder.group({
      transaction_date: [],
      dos: [],
      buyer: [],
    });
  }

  get f() { return this.reportSearch.controls; }


  ngAfterViewInit()
  {
    if(this.touch_count == undefined)
    {
      this.touch_count=this.notify_service.manual_touch_limit();
    }

      console.log('LAST IN REPORTS COMP');

      // this.auth.tokenValue.next(true);
      if(this.auth.tokenValue.value == true)
      {let data = localStorage.getItem('token');
      this.auth.login(data);}
  }

  get_buyer(){
    this.Jarwis.get_buyer('insurance_name').subscribe(
  		data  => this.display_notes(data),
  		error => this.handleError(error)
  	);
  }


  display_notes(data:any){
  	this.buyer_name = data.data;
  }

  maxDate:any;
  get_claims(page:any){



    this.submitted = true;
    if (this.reportSearch.invalid) {
      console.log('dsada');
        return;
    }
    this.get_report_claims(page, 'null', 'null');
  }

  public sortByAsc: boolean = true;

  order_list(type:any, sort_type:any)
  {
    if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.get_report_claims(this.pages,this.sortByAsc,type);
    } else {
        this.sortByAsc = true;
        this.get_report_claims(this.pages,this.sortByAsc,type);
    }

  }

  onTaskAdd($event:any){
    console.log($event.target.value.length);
    if($event.target.value.length == 0){
      this.reportSearch = this.formBuilder.group({
        transaction_date: [],
        dos: [],
        buyer: [],
      });
    }
  }

  dateClear(){
    this.reportSearch = this.formBuilder.group({
      transaction_date: [null],
      dos: [],
      buyer: [],
    });
  }

  public pages:any;
  public trans_startDate:any;
  public trans_endDate:any;
  public startTime:any;
  public endTime:any;
  public dos_startDate:any;
  public dos_endDate:any;

  get_report_claims(page:any,sort_type:any,type:any){

    let page_count=15;

    this.pages=page;

    let transaction_date = this.reportSearch.controls['transaction_date'].value;
    let dos_date = this.reportSearch.controls['dos'].value;

   if(transaction_date != null && transaction_date.startDate != null){

      let trans_startDate_d = new Date( Date.parse(transaction_date.startDate._d));
      let trans_endDate_d = new Date( Date.parse(transaction_date.endDate._d));
      this.trans_startDate = trans_startDate_d.toLocaleDateString();
      this.trans_endDate = trans_endDate_d.toLocaleDateString();
      this.startTime = trans_startDate_d.toLocaleTimeString('it-IT');  // "9:52:48");
      this.endTime = trans_endDate_d.toLocaleTimeString('it-IT');  // "9:52:48");
    }else{
      this.trans_startDate = null;
      this.trans_endDate = null;
      this.startTime = null;
      this.endTime = null;
    }


    if(dos_date != null && dos_date.startDate != null){

      let dos_startDate_d = new Date( Date.parse(dos_date.startDate._d));
      let dos_endDate_d = new Date( Date.parse(dos_date.endDate._d));
      this.dos_startDate = dos_startDate_d.toLocaleDateString();
      this.dos_endDate = dos_endDate_d.toLocaleDateString();

    }else{
       this.dos_startDate = null;
       this.dos_endDate = null
    }

    this.Jarwis.get_report_claims(page,page_count,this.reportSearch.value,sort_type,type,this.startTime,this.endTime,this.trans_startDate,this.trans_endDate,this.dos_startDate,this.dos_endDate).subscribe(
      data  => this.handleReportClaims(data),
      error => this.handleError(error)
    );
  }

  public report_claims:any|null;
  public total:any;
  public total_row:any;
  public skip_rows:any;
  public current_rows:any;
  public current_total:any;
  public skip:any;
  public total_issue:any;

  handleReportClaims(data:any){
    console.log(data.data);
    this.report_claims = data.data;
    this.selected_claims = data.selected_claim_data;
    this.total=data.count;

    if(this.total == 0){
      this.total =1;
      this.total_issue = 1;
    }else{
      this.total_issue = 2;
    }

    console.log(this.total);
    // console.log(this.total);
    this.total_row = data.count;

    this.current_total= data.current_total;
    this.skip = data.skip + 1;
    this.skip_rows = this.skip;
    this.current_rows = this.skip + this.current_total - 1;
    this.total_row = data.count;


  }



  handleError(error:any){

  }

  public check_all: Array<any> =[];
  public selected_claims=[];
  public selected_claim_nos=[];
  public table_datas : string[]=[];
  public assigned_claims:any;
  public touch_count:number = 0;

  public check_all_assign(page:any,event:any)
  {
  if( event.target.checked == true)
  {
    this.check_all[page]==true;
  }
  else{
    this.check_all[page]==false;
  }
  }

  claim_check(count:any)
  {
    if(Number(count)>this.touch_count)
    {
      this.toastr.errorToastr('Claim Exceeds '+ this.touch_count+ ' Touches', 'Exceeds!!');

    }else if(Number(count) == (this.touch_count -1))
    {
      this.toastr.warningToastr('Claim Nearing '+ this.touch_count+ ' Touches.', 'Warning!')
    }
    else if(Number(count) == this.touch_count)
    {
      this.toastr.errorToastr('Claim Reaches '+ this.touch_count+ ' Touches', 'Count Limit!!');
    }
  }


  //Configuration of Dropdown Search
  config:any = {
    displayKey:"description",
    search:true,
    result:'single'
  }

  public claim_number:any;

  public tooltip(claim:any){
    this.claim_number = claim.claim_no;

    this.Jarwis.claims_tooltip(this.claim_number).subscribe(
      data  => this.handleClaimsTooltip(data),
      error => this.handleError(error)
    );
  }

  public claim_data:any;
  public age:any;
  public showAge:any;
  public calculateAge:any;

  public handleClaimsTooltip(data:any){
    this.claim_data = data.claim_data;
    this.age = data.claim_data.dob;

    const convertAge = new Date(this.age);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24))/365);
    this.calculateAge = this.showAge;


  }


public export_files(type:any)
{
  let filter='all claims';

  let table_name = 'Report_claims'

  let transaction_date = this.reportSearch.controls['transaction_date'].value;
  let dos_date = this.reportSearch.controls['dos'].value;

 if(transaction_date != null && transaction_date.startDate != null){

    let trans_startDate_d = new Date( Date.parse(transaction_date.startDate._d));
    let trans_endDate_d = new Date( Date.parse(transaction_date.endDate._d));
    this.trans_startDate = trans_startDate_d.toLocaleDateString();
    this.trans_endDate = trans_endDate_d.toLocaleDateString();
    this.startTime = trans_startDate_d.toLocaleTimeString('it-IT');  // "9:52:48");
    this.endTime = trans_endDate_d.toLocaleTimeString('it-IT');  // "9:52:48");
  }else{
    this.trans_startDate = null;
    this.trans_endDate = null;
    this.startTime = null;
    this.endTime = null;
  }


  if(dos_date != null && dos_date.startDate != null){

    let dos_startDate_d = new Date( Date.parse(dos_date.startDate._d));
    let dos_endDate_d = new Date( Date.parse(dos_date.endDate._d));
    this.dos_startDate = dos_startDate_d.toLocaleDateString();
    this.dos_endDate = dos_endDate_d.toLocaleDateString();

  }else{
     this.dos_startDate = null;
     this.dos_endDate = null
  }

  this.Jarwis.fetch_claims_report_export_data(this.reportSearch.value,this.startTime,this.endTime,this.trans_startDate,this.trans_endDate,this.dos_startDate,this.dos_endDate, table_name).subscribe(
    data  => this.export_handler.report_export_excel(data),
    error => this.error_handler(error)
    );
}

error_handler(error:any)
{

  if(error.error.exception == 'Illuminate\Database\QueryException')
  {
    this.toastr.warningToastr('File Cannot Be Deleted','Foreign Key Constraint');
  }
else{
  this.toastr.errorToastr(error.error.exception, 'Error!');
}


}

public tooltipOptions:any= {
  'placement': 'right',
  'show-delay': '200',
  'tooltip-class': 'new-tooltip-class',
  'background-color': '#9ad9e4'
};

getUsersList(){
  this.Jarwis.get_associates(this.setus.getId()).subscribe(
    data => this.assign_data(data),
    error => this.handleError(error)
  );
}

public assign_data(data: any) {
  this.associates_detail = data.data;
}


}
