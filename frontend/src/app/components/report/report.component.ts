import { Component,ViewChildren,ElementRef,QueryList,OnInit,ChangeDetectionStrategy,Input, EventEmitter, Output, OnChanges,ViewEncapsulation, ViewChild } from '@angular/core';
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
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, GridReadyEvent, SideBarDef, ToolPanelDef } from 'ag-grid-community';
import { gridData } from '../claims/claims.component';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import 'ag-grid-enterprise';

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
	private notes_hadler:NotesHandlerService,
  public loader : NgxUiLoaderService,
  private datePipe: DatePipe,) {
    this.alwaysShowCalendars = true;
    this.update_monitor=this.notes_hadler.refresh_update().subscribe(message => {
        this.get_report_claims(this.pages,'null','null');
        console.log(this.update_monitor);

    });
   }

  public buyer_name:any;
  submitted = false;
  reportSearch!: FormGroup;
  reportSearch_new!:FormGroup;
  Status:any;
  Users:any;
  date_range:any;
  associates_detail:any = [];
  isCollapsed_AllClaims : boolean = true;
  status_list: any;
  all_selectedAge = null; age_options: any = [{ "from_age": 0, "to_age": 30 }, { "from_age": 31, "to_age": 60 }, { "from_age": 61, "to_age": 90 }, { "from_age": 91, "to_age": 120 }, { "from_age": 121, "to_age": 180 }, { "from_age": 181, "to_age": 365 }];
  claim_statuses: any = ['Closed', 'Assigned', 'Auditing', 'Audit'];
  decimal_pattern = "^\[0-9]+(\.[0-9][0-9])\-\[0-9]+(\.[0-9][0-9])?$";
  allClaimsFind!: FormGroup;
  public status_codes_data: Array<any> = [];
  public sub_status_codes_data: string[] = [];
  public status_options: any;
  public sub_options: any;

  ngOnInit() {
    // this.auth.tokenValue.next(false);
    this.formValidator();
  	this.get_buyer();

    this.subscription=this.notify_service.fetch_touch_limit().subscribe(message => {
    this.touch_count = message });
    this.formValidator();
    this.getUsersList();

    this.allClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      responsibility: [],
      total_charge: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      rendering_provider: [],
      payer_name: [],
      claim_status: [],
      bill_submit_date: [],
      denial_code: [],
      date: [],
      status_code: [],
      sub_status_code: [],
    });

    this.pageChange(1,'all_claim',null,null,null,null,null,null);
    this.status_code_select()
  }

  formValidator(){
    this.reportSearch = this.formBuilder.group({
      transaction_date: [],
      dos: [],
      buyer: [],
    });

    this.reportSearch_new = this.formBuilder.group({
      status:[],
      users:[],
      date_range:[]
    })
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

  status_code_select(){
    if(!this.isCollapsed_AllClaims){
      this.get_statuscodes();
    }
  }

    //Get Status codes from Backend
    public get_statuscodes() {
      this.Jarwis.get_status_codes(this.setus.getId(), 'all').subscribe(
        (data: any) => { this.status_list = data['status'], this.process_codes(data) }
      );
    }

    public process_codes(data: any) {
      console.log(data);
      let status_option = [];
      this.status_codes_data = data.status;
      this.sub_status_codes_data = data.sub_status;
      for (let i = 0; i < this.status_codes_data.length; i++) {
        if (this.status_codes_data[i]['status'] == 1) {
          // alert(this.status_codes_data[i]['status_code']);
          status_option.push({ id: this.status_codes_data[i]['id'], description: this.status_codes_data[i]['status_code'] + '-' + this.status_codes_data[i]['description'] });
        }
      }
      this.status_options = status_option;
    }

    allclaims_filter: any;
  allClaims_search(page: number, table: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, allclaimsearch: any, searchdata: any) {
    this.allclaims_filter = searchdata;
    console.log(searchdata);
    this.pageChange(page, table, sort_data, sort_type, sorting_name, sorting_method, allclaimsearch, searchdata);


  }
  search: any;
  searchValue: any;
  allclaim_pages: number = 0;
  pageChange(page: number, table: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, createsearch: any, search: any){
    let allclaimsearch_notNull: any = [];
    let nullVal: boolean = false;
    this.search = search;
    let searchs = this.search;
    this.searchValue = this.search;
    let page_count = 15;
    let allClaims_searchValue: any = [this.allClaimsFind.value];
    if (typeof allClaims_searchValue === 'object' && allClaims_searchValue !== null) {
      Object.keys(allClaims_searchValue).forEach(key => {
        if (typeof allClaims_searchValue[key] === 'object' && allClaims_searchValue[key] !== null) {
          Object.keys(allClaims_searchValue[key]).forEach(val => {
            if (typeof allClaims_searchValue[key][val] === 'object' && allClaims_searchValue[key][val] !== null) {
              Object.keys(allClaims_searchValue[key][val]).forEach(data => {
                if (allClaims_searchValue[key][val][data] === null) {
                  nullVal = false;
                }
                else {
                  nullVal = true;
                }
              });
              allclaimsearch_notNull.push(nullVal);
            }
            else if (typeof allClaims_searchValue[key][val] !== 'object' && allClaims_searchValue[key][val] !== null && allClaims_searchValue[key][val] != '') {
              nullVal = true;
              allclaimsearch_notNull.push(nullVal);
            }
            else if (typeof allClaims_searchValue[key][val] !== 'object' && allClaims_searchValue[key][val] !== null && allClaims_searchValue[key][val] == '') {
              nullVal = false;
              allclaimsearch_notNull.push(nullVal);
            }
          });
        }
      });
    }
    if (allclaimsearch_notNull.some((x: any) => x === true)) {
      this.search = this.allclaims_filter;
      sort_data = 'null';
      sort_type = 'null';
      sorting_name = 'null';
      search = this.search;
    }
    else {
      this.search = null;
      sort_data = null;
      sort_type = null;
      sorting_name = null;
      sorting_method = null;
      search = this.search;
    }
    searchs = this.search;
    console.log(searchs);
    this.allclaim_pages = page;
    if (sorting_name == null && searchs == null) {
      // this.Jarwis.all_claim_list(sort_data, page, page_count, sort_type, null, sorting_method, null, search).subscribe(
      //   data => this.assign_page_data(data),
      //   error => this.handleError(error)
      // );
      this.Jarwis.all_claim_list_new('null').subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );
    } else if (searchs == 'search') {
      if (this.allClaimsFind.value.dos?.[0] != null && this.allClaimsFind.value.dos?.[1] != null) {
        console.log(this.allClaimsFind.value);
        this.allClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.allClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
        this.allClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.allClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
        this.allClaimsFind.value.dos.pop(this.allClaimsFind.value.dos[0]);
        this.allClaimsFind.value.dos.pop(this.allClaimsFind.value.dos[1]);
        const obj = { ... this.allClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

        this.allClaimsFind.value.dos = obj;
        console.log('OBJ', obj);

        console.log('Updated claims', this.allClaimsFind.value.dos);

      }
      if (this.allClaimsFind.value.date?.[0] != null && this.allClaimsFind.value.date?.[1] != null) {
        console.log(this.allClaimsFind.controls['date'].value);
        this.allClaimsFind.value.date.startDate = this.datepipe.transform(new Date(this.allClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
        this.allClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.allClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
        this.allClaimsFind.value.date.pop(this.allClaimsFind.value.date[0]);
        this.allClaimsFind.value.date.pop(this.allClaimsFind.value.date[1]);
        const obj = { ... this.allClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

        this.allClaimsFind.value.date = obj;
        console.log('OBJ', obj);

        console.log('Updated claims', this.allClaimsFind.value.date);
      }
      if (this.allClaimsFind.value.bill_submit_date?.[0] != null && this.allClaimsFind.value.bill_submit_date?.[1] != null) {
        // console.log(this.createClaimsFind.controls.bill_submit_date.value);
        this.allClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.allClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
        this.allClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.allClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
        this.allClaimsFind.value.bill_submit_date.pop(this.allClaimsFind.value.bill_submit_date[0]);
        this.allClaimsFind.value.bill_submit_date.pop(this.allClaimsFind.value.bill_submit_date[1]);
        const obj = { ... this.allClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

        this.allClaimsFind.value.bill_submit_date = obj;
        console.log('OBJ', obj);

        console.log('Updated claims', this.allClaimsFind.value.bill_submit_date);
      }

      // this.Jarwis.all_claim_list(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, this.allClaimsFind.value, this.search).subscribe(
      //   data => this.assign_page_data(data),
      //   error => this.handleError(error)
      // );
      this.Jarwis.all_claim_list_new(this.allClaimsFind.value).subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

    } else {
      // this.Jarwis.all_claim_list(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, null, this.search).subscribe(
      //   data => this.assign_page_data(data),
      //   error => this.handleError(error)
      // );
      this.Jarwis.all_claim_list_new(null).subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );
    }
  }

  GridData_AllClaims:any = [];
  selected_claim_data: any;
  cwo_total: any;
  skip_row: any;
  current_row: any;
  public assign_page_data(data: any) {
    console.log('New Data', data);
    if(data!=null && data !=''){
      console.log('INNNN');
      this.GridData_AllClaims = data.data;
      this.myGrid_6.api?.setRowData(this.GridData_AllClaims);
        //  this.setAutoHeight();
        this.gridApi_6.closeToolPanel();
        // this.autoSizeAll();
      this.loader.stop();
    }
    else
    {
      this.GridData_AllClaims = [];
      this.myGrid_6.api?.setRowData(this.GridData_AllClaims);
        //  this.setAutoHeight();
        this.gridApi_6.closeToolPanel();
        // this.autoSizeAll();
      this.loader.stop();
    }
    if(data){
      this.selected_claim_data = data.selected_claim_data;
      this.cwo_total = data.total;
      this.current_total = data.current_total;
      this.skip = data.skip + 1;
      this.total_row = data.total;
    }


    this.skip_row = this.skip;
    this.current_row = this.skip + this.current_total - 1;

  }

  searchResults: any = [];
  searchFromArray(arr: any, regex: any) {
    let matches = [], i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i].match(regex)) {
        matches.push(arr[i]);
      }
    }
    return matches;
  };

  allclaimSelected: boolean = false;
  allclaim_selected_val: any = null;
  allclaim_results: any = [];
  search_values_for_all_claims:any;
  allclaimSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.allclaim_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.allclaim_selected_val = null;
      this.allclaimSelected = false;
    }
  }
  allclaimSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.allclaimSelected = true;
      this.allclaim_selected_val = value;
    }
    else {
      this.allclaim_selected_val = null;
      this.allclaimSelected = false;
    }
  }

  public allClaim_status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status: any = this.sub_status_codes_data[event.value.id];
      let sub_status_option: any = [];
      console.log('sub_status_option');
      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.allClaimsFind.patchValue({
          sub_status_code: ''
        });
      }
      else {
        for (let i = 0; i < sub_status.length; i++) {
          if (sub_status[i]['status'] == 1) {
            sub_status_option.push({ id: sub_status[i]['id'], description: sub_status[i]['status_code'] + '-' + sub_status[i]['description'] });
          }
          this.sub_options = sub_status_option;
          if (this.sub_options.length != 0) {
            this.allClaimsFind.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.allClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  onSearch() {
    // this.myGrid_1.api?.setQuickFilter(this.search_values_for_create_work);
    // this.myGrid_2.api?.setQuickFilter(this.search_values_for_work_orders);
    // this.myGrid_3.api?.setQuickFilter(this.search_values_for_closed_claims);
    this.myGrid_6.api?.setQuickFilter(this.search_values_for_all_claims);
  }

  onPageSizeChanged1(type:any)
  {
    this.gridApi_6.paginationSetPageSize(Number(this.paginationSizeValue_AllClaims));
  }

  reload_data_allClaims(page:any){
    this.pages = page;
    // this.modalRef?.hide();
    // this.Jarwis.get_first_table_data(null).subscribe((data: any) => {
    //   this.myGrid_1.api?.setRowData(data.data);
    // });

    console.log(this.modalService.hasOpenModals());
    if (this.modalService.hasOpenModals() == false) {
      // this.pageChange(this.pages, 'claim', null, null, 'null', 'null', null, 'null');

      // for (let i = 0; i < this.selected_claim_data.length; i++) {
      //   let claim = this.selected_claim_data[i]['claim_no'];
      //   let ind = this.selected_claim_nos.indexOf(claim);
      //   this.selected_claims.splice(ind, 1);
      //   this.selected_claim_nos.splice(ind, 1);

      // }

      this.Jarwis.all_claim_list_new('null').subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      // this.checkboxes.forEach((element) => {
      //   element.nativeElement.checked = false;
      // });

      this.allClaimsFind.reset();

    }
  }

  public searchClaims: any;
  public workordersearch: any;
  public export_excel_files(type: any, table_name: string, search: any) {

    // const exportParams: ExcelExportParams = {
    //   skipHeader: false,
    //   columnWidth: 20,
    //   sheetName: 'My Sheet Name',
    //   fileName: 'my-file-name.xlsx',
    //   customHeader: [
    //   ]
    // };
    // call exportDataAsExcel() to export your data as an Excel file
    // this.myGrid_1.api?.exportDataAsCsv();

    console.log(table_name);
    // if (table_name == 'Create_work_order_claims') {
    //   this.searchClaims = this.createClaimsFind.value;
    // } else if (table_name == 'Closed_claims') {
    //   this.searchClaims = this.closedClaimsFind.value;
    // } else if (table_name == 'work_orders') {
    //   this.workordersearch = this.workOrderFind.value;
    // }
    // else if(table_name == 'all_claims_list'){
    //   this.searchClaims = this.allClaimsFind.value;
    // }

    // if(table_name !='all_claims_list')
    // {
    // this.Jarwis.fetch_create_claims_export_data(this.setus.getId(), table_name, this.search, this.searchClaims, this.workordersearch).subscribe(
    //   data => this.export_handler.create_claim_export_excel(data),
    //   error => this.error_handler(error)
    // );
    // }
   if(table_name == 'all_claims_list'){
      this.Jarwis.fetch_all_claims_export_data(this.setus.getId(),table_name,this.search,this.searchClaims,this.workordersearch).subscribe(
        data => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
      )
    }
  }

  ExportExcel(){
    this.gridApi_6.exportDataAsExcel();
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
    // console.log('Status',this.Status);
    // console.log('Users',this.Users);
    // console.log('date_range',this.date_range);
    console.log('212',this.reportSearch_new.value);


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

    // this.Jarwis.get_report_claims(page,page_count,this.reportSearch.value,sort_type,type,this.startTime,this.endTime,this.trans_startDate,this.trans_endDate,this.dos_startDate,this.dos_endDate).subscribe(
    //   data  => this.handleReportClaims(data),
    //   error => this.handleError(error)
    // );
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
  console.log(this.associates_detail);

}

@ViewChild('myGrid_6') myGrid_6!: AgGridAngular;
public gridApi_6!: GridApi;
paginationSizeValue_AllClaims:any = 15;

gridOptions6: GridOptions<gridData>  = {
  rowSelection: 'multiple',
  rowHeight: 30,
  suppressHorizontalScroll: false,
  suppressMovableColumns:true,
  pagination: true,
  paginationPageSize:this.paginationSizeValue_AllClaims,
  suppressDragLeaveHidesColumns: true,
  suppressContextMenu: true,
};

public defaultColDef: ColDef = {
  editable: false,
  enableRowGroup: true,
  enablePivot: true,
  enableValue: true,
  sortable: false,
  resizable: false,
  filter:false,
};


public sideBar: SideBarDef | string | string[] | boolean | null = {
  toolPanels: [
    {
      id: 'columns',
      labelDefault: 'Columns Visibility',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
      toolPanelParams: {
        suppressRowGroups: true,
        suppressValues: true,
        suppressPivots: true,
        suppressPivotMode: true,
        suppressColumnFilter: false,
        suppressColumnSelectAll: false,
      },
    } as ToolPanelDef,
  ],
  defaultToolPanel: 'columns',
};

public autoGroupColumnDef: ColDef = {
  minWidth: 200,
};


columnDefs6: ColDef[] = [
  {
    field: 'touch',
    headerName: '',
    width: 45,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
      'font-weight': '500',  'font-family': 'sans-serif',
      'font-size': '15px !important'};
    },
    sortable: true, // Set the `sortable` property to a boolean value
    cellRenderer: this.cellrendered6.bind(this, 'touch'),

  },
  {
    field: 'claim_no',
    headerName: 'Claim No',
    sortable: true, // Set the `sortable` property to a boolean value
    minWidth: 60,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'claim_no'),
    // onCellClicked: this.CellClicked5.bind(this, 'claim_no')
  },
  {
    field: 'dos',
    headerName: 'DOS',
    sortable: true,
    width: 110,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'dos'),
    // onCellClicked: this.CellClicked5.bind(this, 'dos')
  },
  {
    field: 'age',
    headerName: 'Age',
    sortable: true,
    width: 90,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'age'),
    // onCellClicked: this.CellClicked5.bind(this, 'age')
  },
  {
    field: 'acct_no',
    headerName: 'Acc No',
    sortable: true,
    width: 105,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'acct_no'),
    // onCellClicked: this.CellClicked5.bind(this, 'acct_no')
  },
  {
    field: 'patient_name',
    headerName: 'Patient Name',
    sortable: true,
    width:150,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'patient_name'),
    // onCellClicked: this.CellClicked5.bind(this, 'patient_name')
  },
  {
    field: 'rendering_prov',
    headerName: 'Rendering Provider',
    sortable: true,
    width: 175,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'rendering_prov')
  },
  {
    field: 'responsibility',
    headerName: 'Responsibility',
    sortable: true,
    width: 130,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'responsibility')
  },
  {
    field: 'billed_submit_date',
    headerName: 'BillSubmit Date',
    sortable: true,
    width:140,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'billed_submit_date')
  },
  {
    field: 'denial_code',
    headerName: 'Denial Code',
    sortable: true,
    width: 130,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'denial_code')
  },

  {
    field: 'total_charges',
    headerName: 'Total Charges',
    sortable: true,
    width: 125,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'total_charges'),
  },
  {
    field: 'total_ar',
    headerName: 'Total AR',
    sortable: true,
    width: 110,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'total_ar')
  },
  {
    field: 'claim_Status',
    headerName: 'Claim Status',
    sortable: true,
    width: 120,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'claim_Status')
  },
  {
    field: 'assigned_to',
    headerName: 'Assigned To | Date',
    sortable: true,
    width: 160,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'assigned_to')
  },
  {
    field: 'created_ats',
    headerName: 'Executive Work Date',
    sortable: true,
    width: 170,
    cellStyle:(params:any):any=>{
      return {'color': '#363636',
       'font-weight': '500',  'font-family': 'sans-serif',
       'font-size': '15px !important'};
    },
    cellRenderer: this.cellrendered6.bind(this, 'created_ats',)
  },
];


cellrendered6(headerName: any, params: any) {
  switch (headerName) {
    case 'touch': {
      if (params.value>=this.touch_count || params.value<this.touch_count) {
        return  params.value;
      }
      else
        return '-Nil-';
    }
    case 'claim_no': {
      if (params.value) {
        return params.value;
      }
      else
        return '-Nil-';
    }
    case 'dos': {
      if (params.value) {
        if (params.value != '11/30/1899') {
          let x = params.value;
          x = this.datePipe.transform(x, 'MM/dd/yyyy');
          return `${x}`;
        }
        else {
          return '01/01/1970';
        }
      }
      else {
        return '-Nil-';
      }
    }
    case 'age': {
      if (params.value)
        if (params.value <= 0) {
          return 0;
        }
        else {
          return `${params.value}`
        }
      else
        return '-Nil-';
    }
    case 'acct_no': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'patient_name': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'rendering_prov': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'responsibility': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'total_charges': {
      if (params.value)
      if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); }
      else
      {
        return '-Nil-';
      }
      break;
    }
    case 'total_ar': {
      if (params.value) {
        if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); }
      }
      else {
        return '-Nil-';
      }
      break;
    }
    case 'claim_Status': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'denial_code': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'billed_submit_date': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }
    case 'claim_note': {
      if (params.value)
        return params.value;
      else
        return '-Nil-';
    }

    case 'assigned_to':{
      let x = params.value;
      let rowData = params.node.data;
      let created_at = rowData.created_at;
      created_at = created_at.substring(0, 10);
      created_at = this.datePipe.transform(x, 'MM/dd/yyyy');
      created_at != null ? created_at : '-Nil-'

      return `${ x != null ? x : 'UA'} | ${created_at}`
    }
    case 'created_ats':{
      let x = params.value;
      let created_ats = new Date(x);
      let result = created_ats.toLocaleDateString('en-US');
      let rowData = params.node.data;
      let claimStatus = rowData.claim_Status;
      if(claimStatus!=null || claimStatus != '')
      return `${result}`
      else
      return '-Nil-';

    }
  }
}

onGridReady_6(params: GridReadyEvent) {
  this.gridApi_6 = params.api;
  console.log('event', params);
  // setTimeout(() => {
  //   console.log('444', this.GridData_CreateWorkOrders);
  //   this.cdtn = true;
  //   this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
  // }, 4000);
}

rowValue_ID_6:any;
onSelectionChanged_allClaims(params:any){
  this.rowValue_ID_6 = this.gridApi_6.getSelectedRows();
  console.log('ID6', this.rowValue_ID_6);
}


}
