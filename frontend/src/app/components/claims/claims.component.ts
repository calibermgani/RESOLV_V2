import { Component, ViewChildren, ElementRef, QueryList, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, ViewEncapsulation, AfterViewInit, OnDestroy, TemplateRef, ViewChild, Renderer2 } from '@angular/core';
import * as XLSX from 'xlsx';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import * as FileSaver from 'file-saver';
import { NgbModal, ModalDismissReasons, NgbModalConfig, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { FollowupService } from '../../Services/followup.service';
import { connect, debounceTime } from 'rxjs/operators';
import { pipe } from 'rxjs';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ExcelService } from '../../excel.service';
import { ExportFunctionsService } from '../../Services/export-functions.service';
import { NotifyService } from '../../Services/notify.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { WorkOrderAssign } from '../../models/work-order-assign.bar';
import { NgbDatepickerConfig, NgbCalendar, NgbDate, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
// import { forEach } from '@angular/router/src/utils/collection';
// import { NgbDateCustomParserFormatter} from '../../date_file';
import { NotesHandlerService } from '../../Services/notes-handler.service';
import * as moment from 'moment';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { CheckboxSelectionCallbackParams, ColDef, ExcelExportParams, GridApi, GridOptions, GridReadyEvent, HeaderCheckboxSelectionCallbackParams, ICellRendererParams } from 'ag-grid-community';
import { BsModalRef, BsModalService, ModalDirective, ModalOptions } from 'ngx-bootstrap/modal';
import { template } from 'lodash';
import { AgGridAngular } from 'ag-grid-angular';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { AuthService } from 'src/app/Services/auth.service';

//import * as localization from 'moment/locale/fr';
//moment.locale('fr', localization);


export interface gridData {
  claim_no: any;
  dos: any;
  age: any;
  acct_no: any;
  patient_name: any;
  rendering_prov: any;
  responsibility: any;
  prim_ins_name: any;
  sec_ins_name: any;
  total_charges: any;
  total_ar: any;
  claim_Status: any;
  denial_code: any;
  assigned_to: any
}

@Component({
  selector: 'app-claims',
  templateUrl: './claims.component.html',
  styleUrls: ['./claims.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})



export class ClaimsComponent implements OnInit, OnDestroy, AfterViewInit {

  page = "";
  createWork = "";
  isDesc: boolean = false;
  column: string = "dos";
  associateCount: any = '';
  filter = '';
  assigned = "";
  reAssigned = "";
  status_list: any;
  select_date: any = null;
  submit_date: any = null;
  all_select_date: any;
  resaaigned_select_date: any;
  closed_select_date: any = null;
  // reallocate_select_date: any;
  allclaim_billsubmit_date: any;
  // reallocate_billsubmit_date:any;
  selectedAge = null;
  all_selectedAge = null;
  closed_selectedAge = null;
  reassigned_selectedAge = null;
  // reallocate_selectedAge = null;
  age_options: any = [{ "from_age": 0, "to_age": 30 }, { "from_age": 31, "to_age": 60 }, { "from_age": 61, "to_age": 90 }, { "from_age": 91, "to_age": 120 }, { "from_age": 121, "to_age": 180 }, { "from_age": 181, "to_age": 365 }];
  claim_statuses: any = ['Closed', 'Assigned', 'Auditing', 'Audit'];
  decimal_pattern = "^\[0-9]+(\.[0-9][0-9])\-\[0-9]+(\.[0-9][0-9])?$";
  isSelectedAll = false;
  public status_codes_data: Array<any> = [];
  public sub_status_codes_data: string[] = [];
  public status_options: any;
  public sub_options: any;

  results: any = [];
  closed_results: any = [];
  reassigned_results: any = [];
  allclaim_results: any = [];
  // reallocate_results:any = [];
  searchResults: any = [];
  isValueSelected: boolean = false;
  selected_val: any = null;
  reassignSelected: boolean = false;
  reassign_selected_val: any = null;
  closedSelected: boolean = false;
  closed_selected_val: any = null;
  allclaimSelected: boolean = false;
  allclaim_selected_val: any = null;

  getUserList: any = [];
  // reallocateSelected:boolean = false;
  // reallocate_selected_val:any = null;

  public initial_wo_filter: any;
  public initial_allclaim_filter: any;
  public initial_create_filter: any;
  public initial_closed_filter: any;


  @ViewChildren('pageRow') private pageRows!: QueryList<ElementRef<HTMLTableRowElement>>;

  @ViewChildren("checkboxes") checkboxes!: QueryList<ElementRef>;


  //selected: any;

  configure = {
    displayKey: "description",
    search: true,
    result: 'single'
  }



  public filecount: any;
  public file_name = [];
  public data: any = null;
  public error: any = null;
  public fileupload: any = null;
  public newclaim: any = null;
  public duplicate: any = null;
  public mismatch: any = null;
  public claimno: any = null;
  public filenote: any = null;
  public claims_processed: any;
  new_claims: any = [];
  duplicate_claims: any = [];
  mismatch_claims: any = [];
  mismatch_claim_nos: number = 0;
  mismatch_claim_data: any = [];
  mismatch_claim_numbers: any = [];
  mismatch_claim_data_value: any = [];
  mismatch_claim_data_mismatch: any = [];
  mismatch_claim_number_sort: any = [];
  new_claim_data: any = [];
  file_upload: any;
  input_data: any = [];
  closeResult: string = '';
  old_value: any = [];
  new_value: any = [];
  fieldselect: any = [];
  roles: any = [];
  importProcessed: any;
  datas: string[] = [];
  mismatch_field_list: any = [];
  mismatch_selected: string = '';
  @Input('data') table_datas_list: any = [];
  loading!: boolean;
  field_name = [];
  sortByAsc: boolean = true;

  public editnote_value = null;

  formdata = new FormData();
  formGroup!: FormGroup;
  search_data!: FormControl;
  wo_search_data!: FormControl;
  filter_option!: FormControl;

  processNotes!: FormGroup;
  claimNotes!: FormGroup;
  workOrder!: FormGroup;
  closedClaimsFind!: FormGroup;
  createClaimsFind!: FormGroup;
  reallocateClaimsFind!: FormGroup;
  allClaimsFind!: FormGroup;
  workOrderFind!: FormGroup;
  autoclose_claim!: FormGroup;
  reassignedClaimsFind!: FormGroup;
  reimport_formGroup!: FormGroup;
  changeExecutive!: FormGroup;
  // formGroup: FormGroup;
  submitted = false;
  submitUser = false;
  userEnabled = false;
  auditClaimsEnabled = false;
  dependentUserOptions: any = [];
  checkAuditClaims: any = [];
  selectedUserId: any;
  // checkboxAuditClaims: any;
  modalform!: FormGroup;

  get v() { return this.qcNotes.controls; }
  public tabdat = ['date', 'file_name', 'claims', 'newclaims', 'uploaded'];
  public reimport_tabdat = ['date', 'file_name', 'claims', 'uploaded'];

  myDate = new Date();

  subscription!: Subscription;
  observalble: Subscription;
  response_data;

  name = 'Angular';

  selecteds: any = null;
  selectedClosed: any = null;
  selectedAll: any;
  selectedReallocate: any;
  selectedReasssign: any;
  selectedDueDate: any;
  selectedCreatedAt: any;
  alwaysShowCalendars: boolean;
  ranges: any = {
    'Today': [moment(), moment()],
    'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
  invalidDates: moment.Moment[] = [moment().add(2, 'days'), moment().add(3, 'days'), moment().add(5, 'days')];

  isInvalidDate = (m: moment.Moment) => {
    return this.invalidDates.some(d => d.isSame(m, 'day'))
  }


  constructor(private formBuilder: FormBuilder,
    private Jarwis: JarwisService,
    private setus: SetUserService,
    private loadingBar: LoadingBarService,
    private modalService: NgbModal,
    private follow: FollowupService,
    public toastr: ToastrManager,
    private excelService: ExcelService,
    private export_handler: ExportFunctionsService,
    private notify_service: NotifyService,
    private datepipe: DatePipe,
    private date_config: NgbDatepickerConfig,
    private calendar: NgbCalendar,
    private notes_hadler: NotesHandlerService,
    public formatter: NgbDateParserFormatter,
    private modal: BsModalService,
    private el: ElementRef,
    private renderer: Renderer2,
    private datePipe: DatePipe,
    private auth : AuthService
  ) {
    //this.alwaysShowCalendars = true;
    // this.fromDate = calendar.getToday();
    // this.toDate = calendar.getNext(calendar.getToday(), 'd', 10);
    this.observalble = this.setus.update_edit_perm().subscribe(message => { this.check_edit_permission(message) });
    this.response_data = this.notes_hadler.get_response_data('audit').subscribe((message: any) => { this.collect_response(message) });
    this.alwaysShowCalendars = true;
    this.maxDate.setDate(this.maxDate.getDate() + 7);
    this.minDate.setDate(this.minDate.getDate() - 1);
    this.bsRangeValue = [this.minDate, this.maxDate];

  }



  //Red Alerrt Box
  private _opened: boolean = false;
  private isOpen: boolean = false;
  private _positionNum: number = 0;
  private _modeNum: number = 1;


  private _MODES: Array<string> = ['push'];
  private _POSITIONS: Array<string> = ['right'];

  private redalert() {
    this._opened = !this._opened;
  }

  private mynotes() {
    this.isOpen = !this.isOpen;
  }

  private _togglePosition(): void {
    this._positionNum++;

    if (this._positionNum === this._POSITIONS.length) {
      this._positionNum = 0;
    }
  }

  private _toggleMode(): void {
    this._modeNum++;

    if (this._modeNum === this._MODES.length) {
      this._modeNum = 0;
    }
  }



  onFileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(evt.target);
    console.log('Length',target.files.length);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = (XLSX.utils.sheet_to_json(ws, { header: 2 }));
      console.log(target.files[0]['name'].length);

      if (this.data.length != 0 && target.files[0].type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && target.files[0]['name'].length <= 200) {
        this.formdata.append('file_name', target.files[0]);

        this.formdata.append('user_id', this.setus.getId()!);
        console.log('FormData',this.formdata);

        this.filenote = "";
      }
      else if (target.files[0]['name'].length > 200) {
        this.formGroup.controls['file'].reset();
        this.toastr.errorToastr('Upload another file.', 'File Name too long!');
      }
      else {
        // console.log("Name",target.files[0]['name'].length);
        // console.log("Name",target.files[0]['name'].length);
        this.formGroup.controls['file'].reset();
        // this.filenote="Invalid File";

        this.toastr.errorToastr('Invalid File.', 'Oops!');


        // setTimeout(()=>{
        //   this.filenote = "";
        //   }, 1000);
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  onReimport_FileChange(event: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(event.target);
    console.log(target.files.length);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();

    reader.onload = (ele: any) => {
      /* read workbook */
      const bstr: string = ele.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = (XLSX.utils.sheet_to_json(ws, { header: 2 }));
      console.log(target.files[0]['name'].length);

      if (this.data.length != 0 && target.files[0].type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && target.files[0]['name'].length <= 200) {
        this.formdata.append('file_name', target.files[0]);

        this.formdata.append('user_id', this.setus.getId()!);
        console.log(this.formdata);

        this.filenote = "";
      }
      else if (target.files[0]['name'].length > 200) {
        this.reimport_formGroup.controls['file'].reset();
        this.toastr.errorToastr('Upload another file.', 'File Name too long!');
      }
      else {
        // console.log("Name",target.files[0]['name'].length);
        // console.log("Name",target.files[0]['name'].length);
        this.reimport_formGroup.controls['file'].reset();
        // this.filenote="Invalid File";

        this.toastr.errorToastr('Invalid File.', 'Oops!');


        // setTimeout(()=>{
        //   this.filenote = "";
        //   }, 1000);
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  onAutocc_FileChange(evt: any) {
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(evt.target);
    console.log(target.files.length);

    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;

      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      this.data = (XLSX.utils.sheet_to_json(ws, { header: 2 }));
      console.log(target.files[0]['name'].length);

      if (this.data.length != 0 && target.files[0].type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && target.files[0]['name'].length <= 200) {
        this.formdata.append('file_name', target.files[0]);

        this.formdata.append('user_id', this.setus.getId()!);
        console.log(this.formdata);

        this.filenote = "";
      }
      else if (target.files[0]['name'].length > 200) {
        this.autoclose_claim.controls['file'].reset();
        this.toastr.errorToastr('Upload another file.', 'File Name too long!');
      }
      else {
        // console.log("Name",target.files[0]['name'].length);
        // console.log("Name",target.files[0]['name'].length);
        this.autoclose_claim.controls['file'].reset();
        // this.filenote="Invalid File";

        this.toastr.errorToastr('Invalid File.', 'Oops!');


        // setTimeout(()=>{
        //   this.filenote = "";
        //   }, 1000);
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }

  file_upload_id: any;

  public ignore_function() {
    this.Jarwis.updateingnore(this.file_upload_id).subscribe(
      message => this.updateignore(message),
      error => this.notify(error)
    );
  }

  public ignore() {
    this.duplicate = 0;
    this.toastr.successToastr('Successfully');
  }

  public updateignore(message: any) {
    console.log();
    // this.process_uld_file(message.upload_id);
  }

  public handlesuccess(res: any) {
    this.filecount = res.file_datas;
    console.log(this.filecount);
  }
  duplicates: any;

  public handlemessage(message: any) {
    // console.log("Handle",message);
    //assigning backend values to frontend

    this.newclaim = message.message.new_filter.length;
    this.duplicate = message.message.duplicate_filter.length;
    this.duplicates = message.message.filedata.total_claims;
    this.mismatch = message.message.mismatch_nos;
    console.log('mismatch' + this.mismatch);
    this.claimno = message.message.mismatch_nos;
    this.new_claims = message.message.new_filter_data;
    this.duplicate_claims = message.message.duplicate_filter;
    this.mismatch_claims = message.message.mismatch_data;
    this.mismatch_claim_nos = message.message.mismatch_nos;
    this.new_claim_data = message.message.new_datas;
    this.file_upload = message.message.filedata;
    this.file_upload_id = message.message.filedata.id;
    console.log(message.message.filedata.id);
    this.field_name = message.message.field_name;
    this.claims_processed = message.message.filedata.claims_processed;

    // console.log("Field",this.field_name)
    //Mismatch data Keys
    this.mismatch_claim_numbers = Object.keys(message.message.mismatch_data);
    this.mismatch_claim_number_sort = this.mismatch_claim_numbers;
    let z: any = [];
    let x: any = [];
    let y: any = [];
    let field_list: any = [];
    this.mismatch_claim_numbers.forEach(function (value: any) {
      let keys = value;
      let data = message.message.mismatch_data[keys]['midb'];
      let data2 = message.message.mismatch_data[keys]['mupd'];
      x[keys] = Object.values(data);
      y[keys] = Object.values(data2);
      z[keys] = Object.keys(data);
      let fields = Object.keys(data);
      for (let i = 0; i < fields.length; i++) {
        let x = field_list.find((x: any) => x == fields[i]);
        if (x == undefined) {
          field_list.push(fields[i]);
        }
      }
    });
    //For Mismatch View
    this.mismatch_field_list = field_list;
    this.old_value = [];
    this.new_value = [];
    this.fieldselect = [];
    this.mismatch_claim_data = z;
    this.mismatch_claim_data_value = x;
    this.mismatch_claim_data_mismatch = y;
    this.loadingBar.stop();
    // this.getclaims();
    this.pageChange(1, 'all', null, null, 'null', 'null', 'null', 'null');
    this.fileupload = "";


    // this.error = message.error;
    // setTimeout(()=>{
    //   this.error = "";
    //   }, 1500);
  }

  notify(error: any) {
    //console.log(error);
    this.toastr.errorToastr('Error in Uploading File.');
  }

  upload_total: number = 0;
  latest_id: any;
  importedfile: any;
  skip_row_import: any;
  current_row_import: any;
  total_row_import: any
  handleResponse(data: any) {
    console.log(data);
    if(data){
      this.GridData_Import = data.message;
      this.myGrid_4.api.setRowData(this.GridData_Import);
      console.log('GridData_Import',this.GridData_Import);

    }
    this.roles = data.message;
    console.log('Rols',this.roles);
    this.latest_id = data.latest_id;
    this.importedfile = (data.message.filter((x: any) => x.id == this.latest_id));
    console.log(this.importedfile);
    this.importedfile.forEach((element: any) => {
      this.importProcessed = element.processed;
    });
    console.log(this.importProcessed);
    this.datas = this.tabdat;
    this.upload_total = data.count;
    this.total = data.count;
    this.current_total = data.current_total;
    this.skip = data.skip + 1;
    this.skip_row_import = this.skip;
    this.current_row_import = this.skip + this.current_total - 1;
    this.total_row_import = data.count;
  }

  handleError(error: any) {
    console.log('Error', error);
  }

  reimport_roles: any = [];
  reimport_datas: any;
  reimportProcessed: any;
  reimport_upload_total: number = 0;
  reimport_latest_id: any;
  reimportedfile: any;
  reimport_current_total: any;
  reimport_skip: any;
  skip_row_reimport: any;
  current_row_reimport: any;
  total_row_reimport: number = 0;
  reimport_page: number = 0;
  reimport_total: number = 0;
  handleResponse_reimport(data: any) {
    console.log(data);
    if(data.message){
      this.GridData_ReImport = data.message;
      this.myGrid_5.api.setRowData(this.GridData_ReImport);
      console.log('GridData_Import',this.GridData_Import);
    }
    this.reimport_roles = data.message;
    console.log(this.reimport_roles);
    this.reimport_latest_id = data.latest_id;
    this.reimportedfile = data.message.filter((x: any) => x.id == this.reimport_latest_id);
    console.log(this.reimportedfile);
    this.reimportedfile.forEach((element: any) => {
      this.reimportProcessed = element.processed;
    });
    console.log(this.reimportProcessed);
    this.reimport_datas = this.reimport_tabdat;
    this.reimport_upload_total = data.count;
    this.reimport_total = data.count;
    this.reimport_current_total = data.current_total;
    this.reimport_skip = data.skip + 1;
    this.skip_row_reimport = this.reimport_skip;
    this.current_row_reimport = this.reimport_skip + this.reimport_current_total - 1;
    this.total_row_reimport = data.count;
  }

  // private getclaims()
  // {
  //   this.Jarwis.getclaims(this.setus.getId()).subscribe(
  //     data  => this.handleResponse(data),
  //     error => this.handleError(error)
  //   );
  // }

  filedown(data: any, name: any) {

    //console.log("Template",data);
    console.log(data);
    if (data.size == 47) {
      console.log('dfasdas');
      // this.error = "No Preferred Fields";
      this.toastr.errorToastr('No Preferred Fields.');
      // setTimeout(()=>{
      //   this.error = "";
      //   }, 1500);
    }
    else {
      // FileSaver.saveAs(data, name);
      console.log('dfasdas');
      // this.excelService.exportAsExcelFile(data, 'template');
      this.export_handler.create_template(data);
      this.toastr.successToastr('Download Complete');
    }
  }

  getfile(event: any, name: any) {
    this.Jarwis.getfile(event).subscribe(
      data => { FileSaver.saveAs(data, name); this.toastr.successToastr('Download Complete'); },
      error => { this.toastr.errorToastr("File Not Found") }

    );
  }

  public templates() {
    this.Jarwis.template().subscribe(
      data => this.filedown(data, 'template')

    );
  }

  open(content: any) {
    this.openModal(content);
    // this.modalService.open(content, { centered: true, windowClass: 'custom-class' }).result.then((result) => {
    //   this.closeResult = `${result}`;
    // }, (reason) => {
    //   this.closeResult = `${this.getDismissReason()}`;
    // });
  }

  //Modal Dismiss on Clicking Outside the Modal
  private getDismissReason() {
    this.clear();
    this.clear_notes();
  }

  public processdata() {
    console.log(this.formGroup.value)
       let x = this.formGroup.controls['report_date'].value;
        const date = new Date(x);
       const formattedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      };

      //  const day = date.getDate();
      //  const month = date.getMonth()+1;
      //  const year = date.getFullYear();
      //  const formattedDate = `${day}-${month}-${year}`;
       this.formGroup.value.report_date = formattedDate;
       console.log('updated formGroupValue',this.formGroup.value);


    // this.loadingBar.start();

    let report_date = this.formGroup.value.report_date;
    this.formdata.append('report_date',  report_date.day + '-' + report_date.month + '-' + report_date.year);
    this.formdata.append('notes', this.formGroup.value.notes);
    this.formdata.append('practice_dbid', localStorage.getItem('practice_id')!);
    console.log(this.formdata);
    this.Jarwis.upload(this.formdata).subscribe(
      message => { this.handlemessage(message); this.toastr.successToastr('Uploaded'); },
      error => this.notify(error)
    );
    console.log('FormData',this.formdata);
  }
  public process_reimport() {
    console.log(this.reimport_formGroup.value)
    let x = this.reimport_formGroup.controls['report_date'].value;
    const date = new Date(x);
   const formattedDate = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };

  //  const day = date.getDate();
  //  const month = date.getMonth()+1;
  //  const year = date.getFullYear();
  //  const formattedDate = `${day}-${month}-${year}`;
   this.reimport_formGroup.value.report_date = formattedDate;
   console.log('updated formGroupValue',this.reimport_formGroup.value);
    // this.loadingBar.start();
    let report_date = this.reimport_formGroup.value.report_date;
    let file_name = this.reimport_formGroup.value['file'];
    this.formdata.append('file_name', file_name);
    this.formdata.append('user_id', this.setus.getId()!);
    this.formdata.append('report_date', report_date.day + '-' + report_date.month + '-' + report_date.year);
    this.formdata.append('notes', this.reimport_formGroup.value.notes);
    this.formdata.append('practice_dbid', localStorage.getItem('practice_id')!);
    this.Jarwis.file_reimport(this.formdata).subscribe(
      (message: any) => {
        let data = message['reimport_msg'];
        this.notifysuccess(data), this.load_reimport_data(1)
      },
      error => this.notify(error)
    );
  }
  notifysuccess(message: any) {
    console.log(message)
    this.toastr.successToastr(message);
  }
  public auto_close_claim() {
    console.log(this.autoclose_claim.value['file']);
    let file_name = this.autoclose_claim.value['file'];
    this.formdata.append('file_name', file_name);
    this.formdata.append('user_id', this.setus.getId()!);
    this.formdata.append('practice_dbid', localStorage.getItem('practice_id')!);
    console.log(this.formdata);
    this.Jarwis.uploadcloseclaim(this.formdata).subscribe(
      (message: any) => {
        let data = message['message'];
        console.log(data); this.notifysuccess(data)
      },
      error => this.notify(error)
    );
  }

  public clear() {
    this.formGroup.controls['file'].reset();
    this.formGroup.controls['notes'].reset();
    this.formGroup.controls['report_date'].reset();
  }

  public clear_reimport() {
    this.reimport_formGroup.controls['file'].reset();
    this.reimport_formGroup.controls['notes'].reset();
    this.reimport_formGroup.controls['report_date'].reset();
  }

  public saveclaims() {
    this.Jarwis.createnewclaims(this.new_claim_data, this.file_upload, this.setus.getId()).subscribe(
      data => this.updatelog(data),
      error => this.handleError(error)
    );
  }

  public updatelog(data: any) {
    if (data.error == 'Created') {
      this.toastr.successToastr('New Claims Created.');
      console.log(this.claims_processed);
      this.new_claims = [];
      this.newclaim = 0;
    }


    // let compare = data.message.filter(item => this.new_claims.indexOf(item) < 0);
    // this.new_claims = compare;
    // this.newclaim = this.new_claims.length;

  }

  // public mismatch_action(data)
  // {
  //   if(data == 'Replace')
  //   {
  //     let mismatch_keys = this.mismatch_claim_data;
  //     let mismatch_values = this.mismatch_claim_data_mismatch;
  //     let mismatchkey = {};
  //     let mismatchvalue = {};
  //     this.mismatch_claim_numbers.forEach(function (value) {
  //       mismatchkey[value] = mismatch_keys[value];
  //       mismatchvalue[value] = mismatch_values[value];
  //       });
  //     let inputdata = [];
  //     inputdata.push(mismatchkey);
  //     inputdata.push(mismatchvalue);
  //     this.Jarwis.mismatch(inputdata).subscribe(
  //       message=> this.updatemismatch(message),
  //       error => this.notify(error)
  //       );
  //       }
  //       }

  public updatemismatch(data: any) {
    this.mismatch = data.message.length;
    console.log(this.mismatch);
    this.mismatch_claim_nos = data.message.length;
    this.mismatch_claim_numbers = Object.keys(data.message);
  }

  public displayvalues(claim: any, field: any) {
    this.old_value[claim] = this.mismatch_claims[claim]['midb'][field.target.value];
    this.new_value[claim] = this.mismatch_claims[claim]['mupd'][field.target.value];
    this.fieldselect[claim] = field;
  }

  public action(claim: any, data: any, type: any) {
    let field = data[claim];
    if (field == 0 || field == 'Select' || field == undefined && type != 'Ignore_all_fields') {
      this.toastr.errorToastr("Please Select a Value.")
      // console.log("Please Select a Value.");
    }
    else {
      let value = this.mismatch_claims[claim]['mupd'][field];
      let inputdata = [];
      inputdata.push(claim);
      inputdata.push(field);
      inputdata.push(value);

      if (type == 'Overwrite') {
        this.Jarwis.overwrite(inputdata, this.setus.getId()).subscribe(
          message => this.update_action(message, field, claim),
          error => this.notify(error)
        );
        this.toastr.successToastr("Successfull ")
      }
      else if (type == 'Ignore') {
        this.update_action('ignore', field, claim);
        this.toastr.successToastr("Successfull ")
      }
      else if (type == 'Ignore_all_fields') {
        this.mismatch_claim_data.splice(claim, 0);
        let indexsort = this.mismatch_claim_number_sort.indexOf(claim);
        this.mismatch_claim_number_sort.splice(indexsort, 1);
        this.mismatch_claim_nos = this.mismatch_claim_nos - 1;
        this.mismatch = this.mismatch_claim_nos;
        this.toastr.successToastr("Successfull ")
      }
    }
  }

  public ignore_all(data: any) {
    if (this.mismatch_selected == undefined || this.mismatch_selected == "All") {
      this.toastr.errorToastr("Please select Anything.");
      // console.log("Please select Anything.");
    }
    else {
      let mismatch_field_list_key: number = this.mismatch_field_list.indexOf(this.mismatch_selected);
      this.mismatch_field_list.splice(mismatch_field_list_key, 1);
      //Display Claims Removal
      this.mismatch_claim_number_sort = [];
      //Delete field data from Claims
      for (let i = 0; i < data.length; i++) {
        let claim_id = data[i];
        let array = this.mismatch_claim_data[claim_id];
        let index = <any>[];
        for (let j = 0; j < array.length; j++) {
          if (array[j] != this.mismatch_selected && array[j] != undefined) {
            index.push(array[j]);
          }
        }
        //Insert if Not Null
        if (index.length == 0) {
          //Main Sorted Variable
          let mismatchsort = this.mismatch_claim_numbers.indexOf(claim_id);
          this.mismatch_claim_numbers.splice(mismatchsort, 1);
          //Decrease Mismatch Claims Number
          this.mismatch_claim_nos = this.mismatch_claim_nos - 1;
          this.mismatch = this.mismatch_claim_nos;
        }
        else {
          this.mismatch_claim_data[claim_id] = index;
        }
        //Assigning Claims to current Instance Variable
        this.mismatch_claim_number_sort = this.mismatch_claim_numbers;
        this.old_value = [];
        this.new_value = [];
        //Clear Array
        index = [];
      }
    }
  }

  public overwrite_all(data: any) {
    if (this.mismatch_selected == undefined || this.mismatch_selected == "All") {
      this.toastr.errorToastr("Please select Anything.");
      // console.log("Please select Anything.");
    }
    else {
      let field = this.mismatch_selected;
      let value = [];
      for (let i = 0; i < data.length; i++) {
        value[data[i]] = this.mismatch_claims[data[i]]['mupd'][field];
      }
      let inputdata: any = [];
      inputdata.push(field);
      inputdata.push(data);
      inputdata.push(value);
      this.Jarwis.overwrite_all(inputdata, this.setus.getId()).subscribe(
        message => this.update_action_overwrite(message, field, data),
        error => this.notify(error)
      );
    }
  }

  public update_action_overwrite(data: any, field: any, claim: any) {
    //Collective Dropdown Ops
    let mismatch_field_list_key: number = this.mismatch_field_list.indexOf(field);
    this.mismatch_field_list.splice(mismatch_field_list_key, 1);
    //Display Claims Removal
    this.mismatch_claim_number_sort = [];
    //Delete field data from Claims
    let index = <any>[];
    for (let i = 0; i < claim.length; i++) {
      let claim_id = claim[i];
      let array = this.mismatch_claim_data[claim_id];

      for (let j = 0; j < array.length; j++) {

        if (array[j] != field && array[j] != undefined) {
          index.push(array[j]);
        }

      }
      //Insert if Not Null
      if (index.length == 0) {
        //Main Sorted Variable
        let mismatchsort = this.mismatch_claim_numbers.indexOf(claim_id);
        this.mismatch_claim_numbers.splice(mismatchsort, 1);

        //Decrease Mismatch Claims Number
        this.mismatch_claim_nos = this.mismatch_claim_nos - 1;
        this.mismatch = this.mismatch_claim_nos;
      }
      else {
        this.mismatch_claim_data[claim_id] = index;
      }
      //Assigning Claims to current Instance Variable
      this.mismatch_claim_number_sort = this.mismatch_claim_numbers;
      this.old_value = [];
      this.new_value = [];
      //Clear Array
      index = [];
    }
  }

  public update_action(data: any, field: any, claim: any) {
    let array = this.mismatch_claim_data[claim];
    this.mismatch_claim_data.splice(claim, 0);
    const index = <any>[];
    for (var i = 0; i < array.length; i++) {
      if (array[i] != field) {
        index.push(array[i]);
      }
    }
    this.mismatch_claim_data[claim] = index;
    if (this.mismatch_selected != undefined || this.mismatch_selected == "All") {
      let indexsort = this.mismatch_claim_number_sort.indexOf(claim);
      this.mismatch_claim_number_sort.splice(indexsort, 1);
    }

    //To remove Claims
    if (index.length == 0) {
      let ind = this.mismatch_claim_numbers.indexOf(claim);
      this.mismatch_claim_numbers.splice(ind, 1);
      this.mismatch_claim_nos = this.mismatch_claim_nos - 1;
      this.mismatch = this.mismatch_claim_nos;
    }
  }

  public display_selected(data: any) {
    this.mismatch_selected = data.target.value;
    this.mismatch_claim_number_sort = [];
    if (data == "All") {
      this.mismatch_claim_number_sort = this.mismatch_claim_numbers;
      this.old_value = [];
      this.new_value = [];
    }
    else {
      for (let i = 0; i < this.mismatch_claim_numbers.length; i++) {
        let claim: any = this.mismatch_claim_numbers[i];
        let claim_data: any = this.mismatch_claim_data[claim];
        let find = claim_data.find((x: any) => x == data);
        if (find != undefined) {
          this.mismatch_claim_number_sort.push(claim);
          this.old_value[claim] = this.mismatch_claims[claim]['midb'][data];
          this.new_value[claim] = this.mismatch_claims[claim]['mupd'][data];
          console.log(this.mismatch_claims[claim]['mupd'][data]);
          this.fieldselect[claim] = data;
        }
      }
    }
  }

  //Create Work Order Tab Functions*****
  table_fields: string[] = [];
  table_datas: any = [];
  claim_clicked: any;
  claim_related: any = [];
  process_notes: any = [];
  claim_notes: any = [];
  line_data: any = [];

  //Get Claim Details to Display
  // private getclaim_details()
  // {
  //   this.Jarwis.getclaim_details(this.setus.getId()).subscribe(
  //     data  => this.form_table(data),
  //     error => this.handleError(error)
  //   );
  // }

  // public form_table(data)
  // {
  //   this.table_fields=data.data.fields;
  //   // this.table_datas=data.data.datas;
  // }

  //Managing Values displayed in Modal
  public claim_no: any;

  public tooltipOptions: any = {
    'placement': 'right',
    'show-delay': '200',
    'tooltip-class': 'new-tooltip-class',
    'background-color': '#9ad9e4',
    'margin-top': '20px'
  };

  public tooltip(claim: any) {
    this.claim_no = claim.claim_no;

    this.Jarwis.claims_tooltip(this.claim_no).subscribe(
      data => this.handleClaimsTooltip(data),
      error => this.handleError(error)
    );
  }

  claim_data: any;
  age: any;
  showAge: any;
  calculateAge: any;

  public handleClaimsTooltip(data: any) {
    this.claim_data = data.claim_data;
    this.age = data.claim_data.dob;

    const convertAge = new Date(this.age);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
    this.calculateAge = this.showAge;
    console.log(this.calculateAge);
  }

  public claimslection(claim: any) {
    console.log('CLIAM', claim);
    this.claim_no = claim.claim_no;
    this.get_line_items(claim);
    this.check_reassign_alloc(claim);
    //Clear Previous Claims
    this.clear_refer();
    this.claim_clicked = claim;
    // let length=this.table_datas?.length;
    this.claim_related = [];
    // this.get_related(claim);
    // console.log("Selected",this.claim_clicked);
    //Related Claims
    this.loading = true;

    this.Jarwis.get_selected_claim_details_fork(claim).subscribe(
      (data: any) => {
        this.claim_related = data[0]['data'],
          this.line_data = data[1]['data'],
          this.line_item_data.push(data[1]['data'])
      },
      error => this.handleError(error)
    );

    this.claim_related = [];


    //Check in DB for matching account_no


    // let length=this.table_datas.length;
    //   for(let i=0;i<this.table_datas.length;i++)
    //   {
    //     let related_length=this.claim_related.length;
    //     length= length-1;
    //     if(related_length<3)
    //     {
    //       if(this.table_datas[length]['acct_no'] == claim.acct_no && this.table_datas[length]['claim_no'] != claim.claim_no )
    //       {
    //        this.claim_related.push(this.table_datas[length]);
    //       }
    //     }
    //   }
    this.send_calim_det('footer_data');
    this.send_calim_det('followup');

    this.getnotes(this.claim_clicked);
    this.processNotesDelete(this.claim_no);
  }
  confirmation_type: string = '';
  reassign_claim: string = '';
  curr_reassigned_claims: any = [];
  reassign_allocation: boolean = true;

  check_reassign_alloc(claim: any | never) {
    //console.log("ROle",this.setus.get_role(),claim['audit_work_order']);
    //console.log(this.setus.get_role_id());
    if ((this.setus.get_role_id() == '4' || this.setus.get_role_id() == '3') && claim['audit_work_order'] != null) {
      let already_re = this.curr_reassigned_claims.indexOf(claim.claim_no);
      //console.log("Here REassign",claim,already_re);
      if (already_re < 0) {
        this.reassign_allocation = true;
        //console.log(this.reassign_allocation);
      }
      else {
        this.reassign_allocation = false;
      }

    }
    else {
      this.reassign_allocation = false;
    }

  }

  /*get_related(claim)
 {
   this.Jarwis.get_related_calims(claim,'followup',this.setus.getId()).subscribe(
     data  => this.list_related(data),
     error => this.handleError(error)
     );
 }

 list_related(claims)
 {
   this.claim_related = claims.data;
 }*/
  edit_permission: boolean = false;
  check_edit_permission(data: any) {
    if (data.includes('claims')) {
      this.edit_permission = true;
      //console.log(data);
    }
    else {
      this.edit_permission = false;
    }
    //console.log(this.edit_permission);
  }


  claim_active: any;
  public send_calim_det(type: any) {
    console.log(type);
    console.log(this.main_tab);
    if (this.main_tab == true) {
      if (type == 'claims') {
        console.log(this.claim_clicked['claim_no']);
        this.follow.setvalue(this.claim_clicked['claim_no']);
      }
      else {
        this.notes_hadler.selected_tab(this.claim_clicked['claim_no']);
        this.notes_hadler.set_claim_details(this.claim_clicked);
        this.claim_active = this.claim_clicked;
      }
    }
    else {
      if (type == 'claims') {
        this.follow.setvalue(this.active_claim);
      }
      else {

        this.notes_hadler.selected_tab(this.active_claim);
        let claim_detials = this.refer_claim_det.find((x: any) => x.claim_no == this.active_claim);
        this.notes_hadler.set_claim_details(claim_detials);
        this.claim_active = this.active_claim;
      }

    }

  }





  processNotesDelete(data: any) {
    // this.Jarwis.process_notes_delete(data, this.setus.getId()).subscribe(
    //   data  => this.handleResponseProcess(data),
    //   error => this.handleError(error)
    // );
  }

  handleResponseProcess(data: any) {
    this.getnotes(this.claim_clicked);
  }



  public closeclaimslection(claim: any) {
    this.claim_no = claim.claim_no;
    //console.log(this.claim_no);
    this.get_line_items(claim);
    this.check_reassign_alloc(claim);   //  removed because this function is not used
    //Clear Previous Claims
    this.clear_refer();
    this.claim_clicked = claim;
    let length = this.table_datas.length;
    this.claim_related = [];
    // this.get_related(claim);
    // console.log("Selected",this.claim_clicked);
    //Related Claims
    this.loading = true;

    this.Jarwis.get_selected_claim_details_fork(claim).subscribe(
      (data: any) => {
        this.claim_related = data[0]['data'],
          this.line_data = data[1]['data'],
          this.line_item_data.push(data[1]['data'])
      },
      error => this.handleError(error)
    );
    //console.log(this.claim_related);
    this.claim_related = [];


    //Check in DB for matching account_no


    // let length=this.table_datas.length;
    //   for(let i=0;i<this.table_datas.length;i++)
    //   {
    //     let related_length=this.claim_related.length;
    //     length= length-1;
    //     if(related_length<3)
    //     {
    //       if(this.table_datas[length]['acct_no'] == claim.acct_no && this.table_datas[length]['claim_no'] != claim.claim_no )
    //       {
    //        this.claim_related.push(this.table_datas[length]);
    //       }
    //     }
    //   }
    //this.send_calim_det('footer_data');
    this.send_calim_det('Audit');
    this.getnotes(this.claim_clicked);
    //this.processNotesDelete(this.claim_no);
  }

  //Refer Claim Clicked Action
  refer_claim_det: any = [];
  refer_claim_no: any = [];
  refer_claim_notes_nos: any = [];
  refer_process_notes_nos: any = [];
  refer_qc_notes_nos: any = [];
  refer_client_notes_nos: any = [];
  refer_claim_notes: any = [];
  refer_process_notes: any = [];
  refer_qc_notes: any = [];
  refer_client_notes: any = [];
  main_tab: boolean = true;
  active_tab: any = [];
  active_refer_claim: any = [];
  active_refer_process: any = [];
  active_refer_qc: any = [];
  active_refer_client: any = [];
  active_claim: any = [];
  refer_claim_editable: any = 'false';
  assigned_datas: any;
  claim_status: any;
  claim_nos: any;

  public referclaim(claim: any) {
    console.log(claim.claim_no);

    claim = claim;

    console.log(claim);

    this.claim_nos = claim.claim_no;


    console.log(this.type);

    this.claim_status = claim.claim_Status;
    this.Jarwis.get_claimno(this.claim_nos, this.setus.getId(), this.claim_status, this.type).subscribe(
      data => this.handleClaimNo(data),
      error => this.handleError(error)
    );


    this.get_line_items(claim);


    if (this.refer_claim_no.indexOf(claim['claim_no']) < 0) {
      this.refer_claim_det.push(claim);
      this.refer_claim_no.push(claim['claim_no']);

      this.Jarwis.getnotes(claim).subscribe(
        data => this.refer_notes(data, claim.claim_no),
        error => this.handleError(error)
      );

    }
    else {
      this.selected_tab(claim['claim_no']);
    }

    //this.get_line_items(claim);
    // this.check_reassign_alloc(claim);
    //Clear Previous Claims
    //this.clear_refer();

    this.send_calim_det('footer_data');
    this.send_calim_det('claims');

    this.getnotes(this.claim_clicked);
    this.processNotesDelete(this.claim_no);
  }

  public handleClaimNo(data: any) {
    this.assigned_datas = data.claim_count;
    console.log(this.assigned_datas);
    this.refer_claim(this.assigned_datas);
  }

  refer_claim(assigned_datas: any) {
    if (assigned_datas == true) {
      this.refer_claim_editable = 'true';
    } else if (assigned_datas == false) {
      this.refer_claim_editable = 'false';
    }
  }

  //Display Reference Notes
  public refer_notes(data: any, claimno: any) {
    this.refer_claim_notes_nos.push(claimno);
    this.refer_claim_notes.push(data.data.claim);

    this.refer_process_notes_nos.push(claimno);
    this.refer_process_notes.push(data.data.process);

    this.refer_qc_notes_nos.push(claimno);
    this.refer_qc_notes.push(data.data.qc);

    this.refer_client_notes_nos.push(claimno);
    this.refer_client_notes.push(data.data.client);


    let index_claim = this.refer_claim_notes_nos.indexOf(claimno);
    let index_process = this.refer_process_notes_nos.indexOf(claimno);
    let index_qc = this.refer_qc_notes_nos.indexOf(claimno);
    let index_client = this.refer_client_notes_nos.indexOf(claimno);

    this.active_refer_claim = this.refer_claim_notes[index_claim];
    this.active_refer_process = this.refer_process_notes[index_process];
    this.active_refer_qc = this.refer_qc_notes[index_qc];
    this.active_refer_client = this.refer_client_notes[index_client];

    this.main_tab = false;
    this.active_claim = claimno;


  }

  public update_refer_notes(data: any, type: any, claimno: any) {
    console.log(type);
    let index_up_qc = this.refer_qc_notes_nos.indexOf(claimno);
    let index_up_process = this.refer_process_notes_nos.indexOf(claimno);
    console.log(index_up_process);
    let index_up_claim = this.refer_claim_notes_nos.indexOf(claimno);
    if (type == 'processnotes') {
      if (index_up_process == undefined) {
        this.refer_process_notes_nos.push(claimno);
        this.refer_process_notes.push(data.data);
        index_up_process = this.refer_process_notes_nos.indexOf(claimno);
      }
      else {
        this.refer_process_notes[index_up_process] = data.data;
        console.log(this.refer_process_notes[index_up_process]);
      }
      // this.refer_process_notes[claimno]=data.data;
    }
    else if (type == 'claimnotes') {
      if (index_up_claim == undefined) {
        this.refer_claim_notes_nos.push(claimno);
        this.refer_claim_notes.push(data.data);
        index_up_claim = this.refer_claim_notes_nos.indexOf(claimno);
      }
      else {
        this.refer_claim_notes[index_up_claim] = data.data;
      }
      // this.refer_claim_notes[claimno]=data.data;
    }
    else if (type == 'qcnotes') {
      if (index_up_qc == undefined) {
        this.refer_qc_notes_nos.push(claimno);
        this.refer_qc_notes.push(data.data);
        index_up_qc = this.refer_qc_notes_nos.indexOf(claimno);
      }
      else {
        this.refer_qc_notes[index_up_qc] = data.data;
      }

      // this.refer_qc_notes[claimno]=data.data;
    }
    this.active_refer_claim = this.refer_claim_notes[index_up_claim];
    this.active_refer_process = this.refer_process_notes[index_up_process];
    this.active_refer_qc = this.refer_qc_notes[index_up_qc];
  }

  //Focus on Selected Tab
  public selected_tab(claimno: any) {
    console.log(claimno);
    if (claimno == 'maintab') {
      this.main_tab = true;
      this.active_claim = [];
    }
    else {

      let index_qc = this.refer_qc_notes_nos.indexOf(claimno);
      let index_process = this.refer_process_notes_nos.indexOf(claimno);
      let index_claim = this.refer_claim_notes_nos.indexOf(claimno);
      let index_client = this.refer_claim_notes_nos.indexOf(claimno);

      this.active_refer_claim = this.refer_claim_notes[index_claim];
      this.active_refer_process = this.refer_process_notes[index_process];
      this.active_refer_qc = this.refer_qc_notes[index_qc];
      this.active_refer_client = this.refer_client_notes[index_client];
      this.main_tab = false;
      console.log(this.main_tab, '--->>>>');
      this.active_claim = claimno;
    }
    this.send_calim_det('footer_data');
    this.send_calim_det('followup');
  }

  //Close Refer Tab
  public close_tab(claim_no: any) {
    let index = this.refer_claim_det.indexOf(claim_no);
    let list_index = this.refer_claim_no.indexOf(claim_no.claim_no);
    this.refer_claim_det.splice(index, 1);
    this.refer_claim_no.splice(list_index, 1);
    this.main_tab = true;
    this.active_claim = [];
    this.send_calim_det('footer_data');
    this.send_calim_det('followup');
    this.get_line_items(this.claim_clicked);
  }

  //Clear Tabs Details
  public clear_refer() {
    this.main_tab = true;
    this.active_claim = [];
    this.refer_claim_det = [];
    this.refer_claim_no = [];
  }

  qc_notes: any;
  client_notes: any;
  //Update Displayed Notes
  public display_notes(data: any, type: any) {
    console.log('data' + data);
    if (this.active_claim != undefined) {
      console.log(type);
      console.log(this.active_claim);
      if (this.active_claim.length != 0) {
        this.update_refer_notes(data, type, this.active_claim)
      }
      else {
        if (type == 'processnotes') {
          console.log(type);
          console.log(data);
          this.process_notes = data.data;
          console.log(this.process_notes);
        }
        else if (type == 'claimnotes') {
          this.claim_notes = data.data;
          console.log(this.claim_notes);
        }
        else if (type == 'qcnotes') {
          this.qc_notes = data.data;
          console.log(this.qc_notes);
        }
        else if (type == 'All') {
          this.process_notes = data.data.process;
          this.claim_notes = data.data.claim;
          this.qc_notes = data.data.qc;
          this.client_notes = data.data.client;
          console.log("All details");
          console.log(this.claim_notes);
          console.log(this.qc_notes);
        }
      }
      this.loading = false;
      this.processNotes.reset();
      //this.claimNotes.reset();
      //this.qcNotes.reset();
    }

  }

  //Get Notes
  public getnotes(claim: any) {
    // console.log("get_notes",claim)
    this.process_notes = [];
    this.claim_notes = [];
    this.qc_notes = [];
    this.client_notes = [];
    let type = 'All';
    this.Jarwis.getnotes(claim).subscribe(
      data => this.display_notes(data, type),
      error => this.handleError(error)
    );
  }

  get_audit_codes() {
    if (!this.audit_codes_list) {
      this.Jarwis.get_audit_codes(this.setus.getId()).subscribe(
        data => this.assign_audit_codes(data),
        error => this.handleError(error)
      );
    }

  }

  root_cause_list: any;
  err_type_list: any;

  assign_audit_codes(data: any) {
    // console.log(data);
    let root_stats = data.root_states;
    let err_stats = data.err_types;

    this.audit_codes_list = { root: root_stats, error: err_stats };

    let root_states = [];
    for (let i = 0; i < root_stats.length; i++) {
      if (root_stats[i].status == '1') {
        root_states.push({ id: root_stats[i]['id'], description: root_stats[i]['name'] });
      }
    }
    this.root_cause_list = root_states;
    let error_states = [];
    for (let j = 0; j < err_stats.length; j++) {
      if (err_stats[j].status == '1') {
        error_states.push({ id: err_stats[j]['id'], description: err_stats[j]['name'] });
      }
    }
    this.err_type_list = error_states;
    // console.log("err",this.err_type_list,this.root_cause_list);
    // sub_status_option.push({id: sub_status[i]['id'], description: sub_status[i]['status_code'] +'-'+ sub_status[i]['description'] });

  }


  //Edit Notes
  edit_noteid: any;
  initial_edit: boolean = false;
  audit_codes_list: any;
  public editnotes(type: any, value: any, id: any) {
    if (type == 'qc_notes_init') {
      let qc_data = this.qc_notes_data.find(x => x.id == id['claim_no']);
      this.editnote_value = qc_data.notes;
      this.edit_noteid = id;
      this.initial_edit = true;
    } else if (type == 'processnote') {
      this.editnote_value = value;
      this.edit_noteid = id;
      this.initial_edit = false;
    }
    else {
      this.editnote_value = value.content;
      this.edit_noteid = id;

      if (type == 'qcnote') {
        let root_cause = value.root_cause;
        let error_type = JSON.parse(value.error_type);

        // console.log(this.audit_codes_list);
        let root_det = this.audit_codes_list.root.find((x: any) => x.id = root_cause);

        let error_det = this.audit_codes_list.error;

        let selecetd_err: any = [];
        // console.log("ERR_tyoe",error_type);
        error_type.forEach(function (value: any) {
          let keys = value;
          let error = error_det.find((x: any) => x.id == keys);
          selecetd_err.push({ id: keys, description: error['name'] });
        });
        this.qcNotes.patchValue({
          root_cause: { id: root_cause, description: root_det['name'] },
          error_type: selecetd_err
        });
      }




      this.initial_edit = false;
    }

  }

  rc_et_data: any;

  //Handle Rootcause and Error Type
  public handle_notes_opt() {
    // console.log("QC",this.qcNotes.value);

    let error_type = this.qcNotes.value['error_type'];
    let root_cause = this.qcNotes.value['root_cause'];
    let error_types_ids: any = [];

    error_type.forEach(function (value: any) {
      let keys = value;
      error_types_ids.push(keys['id']);
    });

    this.rc_et_data = { root_cause: root_cause['id'], error_types: error_types_ids }

  }




  //Update Notes
  public updatenotes(type: any) {
    if (this.initial_edit == true) {
      this.handle_notes_opt();
      // console.log("QC",this.rc_et_data);
      let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };
      this.notes_hadler.set_notes(this.setus.getId(), notes_det, this.edit_noteid, 'create_qcnotes');

      // this.qc_notes_data[this.edit_noteid['claim_no']]=this.qcNotes.value['qc_notes'];

      this.qc_notes_data.find((x: any) => x.id == this.edit_noteid['claim_no']).notes = this.qcNotes.value['qc_notes'];


      this.initial_edit = false;
      this.send_calim_det('followup');
      this.send_calim_det('footer_data');
    }
    else {

      if (type == 'processnotes') {
        this.Jarwis.process_note(this.setus.getId(), this.processNotes.value['processnotes'], this.edit_noteid, 'processupdate', 'audit-closed').subscribe(
          data => this.display_notes(data, type),
          error => this.handleError(error)
        );
      }
      else if (type == 'claimnotes') {
        this.Jarwis.claim_note(this.setus.getId(), this.claimNotes.value['claim_notes'], this.edit_noteid, 'claimupdate').subscribe(
          data => this.display_notes(data, type),
          error => this.handleError(error)
        );
      }
      else if (type == 'qcnotes') {


        let claim_active;

        if (this.main_tab == true) {
          claim_active = this.claim_clicked;
        }
        else {
          claim_active = this.refer_claim_det.find((x: any) => x.claim_no == this.active_claim);
        }



        this.Jarwis.check_edit_val(claim_active, 'audit').subscribe(
          data => {
            this.set_note_edit_validity(data);
            if (this.note_edit_val != undefined) {
              this.handle_notes_opt();
              let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };

              this.Jarwis.qc_note(this.setus.getId(), notes_det, this.edit_noteid, 'qcupdate').subscribe(
                data => this.display_notes(data, type),
                error => this.handleError(error)
              );
            }
            else {
              this.toastr.errorToastr('Notes cannot be Updated.', 'Claim Processed.');
            }
          },
          error => this.handleError(error)
        );


      }

    }
    this.editnote_value = null;
  }




  //Save Notes
  qc_notes_data: Array<any> = [];
  qc_notes_data_list: any = [];
  qcNotes!: FormGroup;
  public savenotes(type: any) {
    console.log(type);
    let claim_id: any;
    if (this.active_claim.length != 0) {
      let index = this.refer_claim_no.indexOf(this.active_claim);
      claim_id = this.refer_claim_det[index];
    }
    else {
      claim_id = this.claim_clicked;
    }
    if (type == 'processnotes') {
      this.Jarwis.process_note(this.setus.getId(), this.processNotes.value['processnotes'], claim_id, 'processcreate', 'create_claims').subscribe(
        data => this.display_notes(data, type),
        error => this.handleError(error)
      );
    }
    else if (type == 'claimnotes') {
      this.Jarwis.claim_note(this.setus.getId(), this.claimNotes.value['claim_notes'], claim_id, 'claim_create').subscribe(
        data => this.display_notes(data, type),
        error => this.handleError(error)
      );
    }
    else if (type == 'qcnotes') {
      console.log(this.qcNotes.value);
      this.submitted = true;
      this.Jarwis.qc_note(this.setus.getId(), this.qcNotes.value['qc_notes'], claim_id, 'create_qcnotes').subscribe(
        data => this.display_notes(data, type),
        error => this.handleError(error)
      );
      this.handle_notes_opt();
      // console.log("QC",this.rc_et_data);
      this.qc_notes_data.push({ notes: this.qcNotes.value['qc_notes'], id: claim_id['claim_no'], notes_opt: this.rc_et_data });
      this.qc_notes_data_list.push(claim_id['claim_no']);

      let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };
      this.notes_hadler.set_notes(this.setus.getId(), notes_det, claim_id, 'create_qcnotes');
      this.send_calim_det('footer_data');
      this.send_calim_det('followup');
    }
  }

  public collect_response(data: any) {

    if (this.main_tab == true) {
      this.check_note_edit_validity(this.claim_clicked);
    }
    else {

      let claim_detials = this.refer_claim_det.find((x: any) => x.claim_no == this.active_claim);
      this.check_note_edit_validity(claim_detials);
    }

    this.display_notes(data, 'qcnotes');
    this.get_workorder('closedClaims', 0, 0, 1, 1, null, null, null, null, null, null, null);
    let index = this.qc_notes_data_list.indexOf(this.active_claim);
    this.qc_notes_data_list.splice(index, 1);
  }

  check_note_edit_validity(claim: any) {
    this.Jarwis.check_edit_val(claim, 'audit').subscribe(
      data => this.set_note_edit_validity(data),
      error => this.handleError(error)
    );

  }


  note_edit_val: any = 0;
  set_note_edit_validity(data: any) {
    if (data.edit_val == true) {
      this.note_edit_val = data.note_id['id'];
    }
    else {
      this.note_edit_val = undefined;
    }
  }



  public clear_notes() {
    this.editnote_value = null;
    this.processNotes.reset();
  }

  //Send Claim Value to Followup-Template Component on Opening Template
  // public send_calim_det()
  // {
  //   if(this.main_tab==true)
  //   {
  //     this.follow.setvalue(this.claim_clicked['claim_no']);
  //   }
  //   else
  //   {
  //     this.follow.setvalue(this.active_claim)
  //   }
  //  }



  //Create Work Order
  public check_all: Array<any> = [];
  public selected_claims: any = [];
  public selected_claim_nos: any = [];

  public check_all_assign(page: any, event: any) {
    if (event.target.checked == true) {
      this.check_all[page] = true;
      console.log(this.check_all[page]);
    }
    else {
      this.check_all[page] = false;
    }

  }
  //Select all Check

  selectAll(isChecked: boolean) {
    this.isSelectedAll = !this.isSelectedAll;
    const indices = (this.pageRows.toArray().map((vcr: any) => +vcr.nativeElement.dataset.index));
    this.table_datas.filter((i: any) => indices.indexOf(i.index) > -1)
      .forEach((i: any) => i.checked = this.isSelectedAll);
  }

  // public select_all(event)
  // {
  // if(event.target.checked == true)
  // {
  // this.check_all='all';
  // }
  // else if(event.target.checked == false)
  // {
  //   this.check_all='none';
  // }

  // }
  public select_claim(content: any) {
    console.log('selected_claim_no', this.selected_claim_nos);
    if (this.selected_claim_nos.length == 0) {
      this.toastr.errorToastr('Please Select Claim');
    }
    else {
      this.openModal(content);
      this.cdtn = true;
      // this.modalService.open(content, { centered: true, windowClass: 'custom-class' }).result.then((result) => {
      //   this.closeResult = `${result}`;
      // }, (reason) => {
      //   this.closeResult = `${this.getDismissReason()}`;
      // });
    }
  }

  //Selected Claim Sorting
  public selected(event: any, claim: any, index: any) {
    console.log(this.selected_claim_nos);

    if (claim == 'all' && event.target.checked == true) {
      // for(let i=0;i<index;i++){
      //   var selected_claim_datas;
      //   selected_claim_datas.push(this.selected_claim_data[i]);
      // }
      let selected_claim_data: any = this.selected_claim_data;
      let claim_nos: any = this.selected_claim_nos;
      let claim_data: any = this.selected_claims;
      selected_claim_data.forEach(function (value: any) {
        let keys: any = value;
        if (!claim_nos.includes(keys['claim_no'])) {
          claim_nos.push(keys['claim_no']);
          claim_data.push(keys);
        }
      });
      this.selected_claim_nos = claim_nos;
      this.selected_claims = claim_data;
      console.log(this.selected_claim_nos);
    }
    else if (claim == 'all' && event.target.checked == false) {

      for (let i = 0; i < this.selected_claim_data.length; i++) {
        let claim: any = this.selected_claim_data[i]['claim_no'];
        let ind: any = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);
      }

      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if (event.target.checked == true) {
      this.selected_claims.push(this.selected_claim_data[index]);
      this.selected_claim_nos.push(claim);
    }
    else if (event.target.checked == false) {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind, 1);
      this.selected_claim_nos.splice(ind, 1);

    }

  }



  public closed_selected(event: any, claim: any, index: any) {
    console.log(event.target.checked);
    console.log(claim);
    console.log(index);

    if (claim == 'all' && event.target.checked == true) {
      let closed_claim_data = this.closed_claim_data;
      let claim_nos = this.selected_claim_nos;
      let claim_data = this.selected_claims;

      closed_claim_data.forEach(function (value: any) {
        let keys = value;
        if (!claim_nos.includes(keys['claim_no'])) {
          claim_nos.push(keys['claim_no']);
          claim_data.push(keys);
        }
      });
      this.selected_claim_nos = claim_nos;
      console.log(this.selected_claim_nos);
      this.selected_claims = claim_data;
    }
    else if (claim == 'all' && event.target.checked == false) {

      for (let i = 0; i < this.closed_claim_data.length; i++) {
        let claim = this.closed_claim_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);

      }

      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if (event.target.checked == true) {
      this.selected_claims.push(this.closed_claim_data[index]);
      this.selected_claim_nos.push(claim);
    }
    else if (event.target.checked == false) {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind, 1);
      this.selected_claim_nos.splice(ind, 1);

    }

  }


  associates_detail: Array<any> = [];

  //Render Associates data into Popup
  public assign_data(data: any) {
    this.associates_detail = data.data;
  }

  //Get Associates data
  public get_associates() {
    this.Jarwis.get_associates(this.setus.getId()).subscribe(
      data => this.assign_data(data),
      error => this.handleError(error)
    );
  }

  claim_assign_type: string = 'null';
  selected_associates: any = [];

  //Selected Associates
  public selected_id: any;
  public select_associates(event: any, id: any) {
    console.log('testing_id: ' + id);
    if (event.target.checked == true) {
      this.selected_associates.push(id);
      this.selected_id = id;
      console.log(this.selected_associates);

    }
    else if (event.target.checked == false) {
      let index = this.selected_associates.indexOf(id);
      this.selected_associates.splice(index, 1);

      //Reduce Assigned Numbers Unchecked Associates
      let x = this.assigned_claims_details.find(v => v.id == id);
      if (x != undefined) {
        let ind = this.assigned_claims_details.indexOf(x);
        this.assigned_claims_details.splice(ind, 1);
        if (x.value != 0) {
          this.assigned_claim_nos = this.assigned_claim_nos - Number(x.value);
        }
      }

      // console.log(x);
      // Limit Remove
      let limit_index = this.limit_exceeds.indexOf(x);
      this.limit_exceeds.splice(limit_index, 1);

      if (this.limit_exceeds.length == 0) {
        this.limit_clearance = true;
      }


    }

    this.associates_error_status = true;
    this.proceed_stats();
  }

  //Manual or Automatic Assign
  public assign_type(type: any) {
    if (this.selected_associates.length == 0) {
      this.toastr.errorToastr("Please select Associate");
    }
    else {
      this.claim_assign_type = type;
    }
  }



  //Auto assign Claims

  tested: any;
  public auto_post_claims(data: any) {
    this.assign_status = [];
    console.log("Claim Stats", data.import_det);
    let claim_stats = data.data;
    //   this.for(let j=0;j < assigned_associates.length;j++)
    // {
    let reassigned_claims = [];
    let new_claim = [];
    this.tested = data.import_det;

    console.log(this.selected_claim_nos.length);

    for (let i = 0; i < this.selected_claim_nos.length; i++) {
      console.log(this.selected_claim_nos[i]);
      let curr_claim = this.selected_claim_nos[i];
      console.log(curr_claim);

      if (curr_claim != null) {
        let reass_index = reassigned_claims.findIndex(v => v.id == this.selected_id);
        console.log(reass_index);
        if (reass_index < 0) {
          reassigned_claims.push({ id: this.selected_id, value: [curr_claim] })
          console.log("Reassigned", reassigned_claims);
        }
        else {
          reassigned_claims[reass_index]['value'].push(curr_claim);
          console.log("Reassigned2", reassigned_claims);
        }
      }
      else {
        new_claim.push(this.selected_claim_nos[i]);
        console.log(new_claim);
      }

    }


    // console.log("associate",new_claim,this.associates_detail,this.selected_associates);

    let process_associates = [];
    let claim_assign_nos = []

    console.log(this.selected_associates);

    if (this.selected_associates.length == 0) {
      process_associates = this.associates_detail;
    }
    else {
      for (let i = 0; i < this.selected_associates.length; i++) {
        console.log(this.selected_associates[i]);
        process_associates.push(this.associates_detail.find(v => v.id == this.selected_associates[i]));
        console.log(process_associates);
      }
    }

    let assign_total = 0;
    let total_new_cliam = new_claim.length;
    process_associates.forEach(element => {
      assign_total += Number(2);
      console.log("Assoc", assign_total, "TOT", element['assign_limit']);
    });


    for (let i = 0; i < process_associates.length; i++) {
      var assigned: any = {};
      let associate_data = process_associates[i];
      // console.log("Assoc_data",associate_data,associate_data['assign_limit'],associate_data);

      // let assignable_nos=Number(associate_data['assign_limit']) - Number(associate_data['assigned_claims']);

      console.log('total_new_cliam ' + total_new_cliam);
      console.log('assign_total ' + assign_total);
      console.log('associate_data ' + associate_data['assign_limit']);

      let assignable = (Number('1') / Number(assign_total)) * Number('1');
      console.log(assignable);
      let assignable_nos = Number(assignable.toFixed());

      console.log("Ass_nos", total_new_cliam, assignable, assignable_nos);


      let assigned_claims = [];
      console.log(associate_data['id']);
      if (reassigned_claims.findIndex(x => x.id == associate_data['id']) >= 0) {
        let claims_ref: any = reassigned_claims.find(x => x.id = associate_data['id']);

        console.log(claims_ref);

        let claims = claims_ref['value'];
        console.log("=>", claims)
        assigned_claims = claims;
      }

      console.log(assignable_nos);

      if (assignable_nos > 0) {
        console.log(new_claim);
        let new_assigned = new_claim.splice(0, assignable_nos);
        console.log(new_assigned);
        new_assigned.forEach(element => {
          assigned_claims.push(element);
        });

      }

      assigned['assigned'] = assigned_claims.length;
      assigned['assigned_to'] = associate_data['id'];
      assigned['claims'] = assigned_claims;
      assigned['max'] = assigned_claims.length;

      console.log(assigned);
      console.log(this.assign_status);
      this.assign_status.push(assigned);
      console.log(this.assign_status);
    }

    // console.log("Assigned",reassigned_claims,"New",new_claim,this.associates_detail);
    // console.log("Final",this.assign_status);



    // Old Logic
    /*
    if(assignable_nos >0)
    {
      // console.log("Ind",reassigned_claims,associate_data['id'],reassigned_claims.findIndex(x => x.id == associate_data['id'] ));
      if( reassigned_claims.findIndex(x => x.id == associate_data['id'] ) >= 0 )
      {
        let claims_ref=reassigned_claims.find(x => x.id = associate_data['id'] );
        console.log("claims_ref",claims_ref,claims_ref['value'].length,claims_ref['value'].length <= assignable_nos)

        let assigned_claims=[];

        if(claims_ref['value'].length <= Number(assignable_nos) )
        {
          let claims=claims_ref['value'];
          // console.log("Fmm,f",claims);
          assigned_claims.push(claims);
          assignable_nos=assignable_nos-claims.length;
          let new_assigned;
          if(assignable_nos >0 && new_claim.length >= assignable_nos)
          {
            new_assigned= new_claim.splice(0,assignable_nos);

          }
          else if(new_claim.length !=0)
          {
            new_assigned=new_claim;
            new_claim=[];
          }
          assigned_claims.push(new_assigned);

        }
        else
        {
          // console.log("comp",claims_ref['value'],claims_ref['value'].length,assignable_nos);
          claims_ref['value'].length = assignable_nos ;
          assigned_claims= claims_ref['value'];
          // console.log("Exceed,f",claims_ref['value']);
        }

        // console.log("Old and New",assigned_claims);
        // var assigned={
        //   assigned:assigned_claims.length,
        //   assigned_to:associate_data['id'],
        //   claims:assigned_claims,
        //   max:assignable_nos
        // };
        assigned['assigned']= assigned_claims.length;
        assigned['assigned_to']= associate_data['id'];
        assigned['claims']= assigned_claims;
        assigned['max']= assignable_nos;
        // console.log(assigned);
        this.assign_status.push(assigned);


      }
      else if(new_claim.length > 0)
      {
        let claims_assigned;
        if(new_claim.length >= assignable_nos)
        {
          claims_assigned=new_claim.splice(0,assignable_nos)
        }
        else if(new_claim.length !=0)
        {
          claims_assigned=new_claim;
          new_claim=[];
        }
        // console.log("New",claims_assigned,assignable_nos,"NC",new_claim)

        // var assigned_here={
        //   assigned:associate_data.length,
        //   assigned_to:associate_data['id'],
        //   claims:claims_assigned,
        //   max:assignable_nos
        // };

        assigned['assigned']= claims_assigned.length;
        assigned['assigned_to']= associate_data['id'];
        assigned['claims']= claims_assigned;
        assigned['max']= assignable_nos;
        // console.log(assigned);
        this.assign_status.push(assigned);


      }
    }
  */





    // console.log(this.assign_status);

    let assigned_count = 0;
    console.log(this.assign_status);
    this.create_workorder();

    this.assign_status.forEach(element => {

      assigned_count += element.claims.length;

    });

    console.log(assigned_count);

    // if(this.assign_status.length == 0)
    if (assigned_count == 0) {
      this.null_assigned = true;

    }
    else {
      this.null_assigned = false;
      this.associates_error_status = false;
    }
  }


  //Manual Assign Function
  public assigned_claims_details: Array<any> = [];
  public associate_error: string = '';
  public associate_error_handler: any = [];
  assigned_claim_nos: number = 0;
  public manual_assign(event: any, id: any) {
    let check = this.assigned_claims_details.some(function (value) {
      return value.id === id;
    });;
    console.log("Man", event.target.value, id, check);
    if (event.target.value != 0) {
      if (!check) {
        console.log(id);
        console.log(event.target.value);
        this.assigned_claims_details.push({ id: id, value: event.target.value });
        console.log(this.assigned_claims_details);
      }
      else {
        this.assigned_claims_details.find(v => v.id == id).value = event.target.value;
        console.log(this.assigned_claims_details);
      }
    }
    else if (this.assigned_claims_details.find(v => v.id == id) != 0 && this.assigned_claims_details.find(v => v.id == id) != undefined) {
      // console.log(this.assigned_claims_details.find(v => v.id == id));
      this.assigned_claims_details.find(v => v.id == id).value = 0;
      console.log(this.assigned_claims_details);
    }
    // console.log("assigned",this.assigned_claims_details);
    this.calculate_assigned();
    // this.check_limit();
    this.associates_error_status = true;
    this.proceed_stats();
  }

  public assigned_data: Array<any> = [];
  //Calculate Assigned and Unassigned Claims
  public calculate_assigned() {
    let total = 0;
    for (let i = 0; i < this.assigned_claims_details.length; i++) {
      total += Number(this.assigned_claims_details[i]['value']);
      this.assigned_data[this.assigned_claims_details[i]['id']] = this.assigned_claims_details[i]['value'];
    }

    this.assigned_claim_nos = total;
  }

  limit_clearance: boolean = false;
  limit_exceeds: any = [];
  //Monitor Limit of Associates
  check_limit() {
    // console.log("Here",this.assigned_claims_details)

    for (let i = 0; i < this.assigned_claims_details.length; i++) {
      let associate = this.associates_detail.find(x => x['id'] == this.assigned_claims_details[i]['id']);

      let total_assigned = Number(this.assigned_claims_details[i]['value']) + Number(associate['assigned_claims']);
      // console.log("Ta",total_assigned,associate['assign_limit'])
      if (associate['assign_limit'] < total_assigned) {
        //Filter duplicate
        if (this.limit_exceeds.indexOf(associate['id']) < 0) {
          this.limit_exceeds.push(associate['id']);
        }
        // console.log("Limit _exccede",this.limit_exceeds)
        this.limit_clearance = false;
      }
      else {
        // console.log("Entered")
        if (this.limit_exceeds.length == 0) {
          this.limit_clearance = true;
        }
        else {
          //Splice code
          let index = this.limit_exceeds.indexOf(associate['id']);
          this.limit_exceeds.splice(index, 1);

          if (this.limit_exceeds.length == 0) {
            this.limit_clearance = true;
          }
        }
      }
      // console.log("Associate",associate);
    }

  }

  claim_proceed: boolean = true;

  // console.log(this.assigned_claim_nos,this.selected_claim_nos)
  proceed_stats() {
    // console.log(this.selected_claim_nos.length ,',', this.assigned_claim_nos, this.selected_claim_nos.length,this.limit_exceeds  )
    if (this.selected_claim_nos.length >= this.assigned_claim_nos && this.selected_claim_nos.length != 0 && this.assigned_claim_nos != 0 && this.limit_exceeds.length == 0) {
      // console.log("P_Stats  -> True")
      this.claim_proceed = false;
    }
    else {
      // console.log("P_Stats  -> False")
      this.claim_proceed = true;
    }

  }

  //Verify Selected claims and associates
  public assign_claims() {

    this.Jarwis.check_claims(this.selected_claim_nos).subscribe(
      data => {
        console.log("O/p", data)
        if (this.claim_assign_type == 'Manual') {
          this.assign_associates(data)
        } else if (this.claim_assign_type == 'Auto') {
          console.log('auto post');
          this.auto_post_claims(data);
          this.modalService.dismissAll()
        }
      },
      error => this.handleError(error)
    );

  }
  //associateCount : any [] = [];

  //Assign Claims to Associates
  public claims_assigned: Array<any> = [];
  public assign_status: Array<any> = [];
  public associates_error_status: boolean = true;
  public error_details: any;
  public null_assigned: boolean = true;
  public assign_associates(data: any) {
    let claim_numbers = this.selected_claim_nos;
    let assigned_associates = this.assigned_claims_details;

    console.log(assigned_associates);
    console.log(this.selected_claim_nos);
    console.log(assigned_associates);
    this.error_details = [];
    this.assign_status = [];

    this.associates_error_status = true;


    let unassigned_numbers: any = [];
    //Assign Logic
    for (let j = 0; j < assigned_associates.length; j++) {

      // this.assign_status.push({id:assigned_associates[j]['id'],to:assigned_associates[j]['value']});
      let assign = [];
      let count = 0;

      for (let x = 0; x < Object.keys(data.data).length; x++) {
        if (data.data[claim_numbers[x]] != null) {
          // console.log(data.data);
          if (data.data[claim_numbers[x]]['assigned_to'] == assigned_associates[j]['id'] && count < assigned_associates[j]['value']) {
            assign.push(claim_numbers[x]);
            count++;

            unassigned_numbers.push(claim_numbers[x]);

          }

        }
      }
      this.assign_status.push({ claims: assign, assigned: count, max: assigned_associates[j]['value'], assigned_to: assigned_associates[j]['id'] });;
      console.log(this.assign_status);
    }
    let missing = claim_numbers.filter((item: any) => unassigned_numbers.indexOf(item) < 0);
    let new_claim = [];
    let reopen_claim = [];

    for (let z = 0; z < missing.length; z++) {
      if (data.data[missing[z]] == null) {
        new_claim.push(missing[z]);
      }
      else {
        reopen_claim.push(missing[z]);
      }
    }
    let cont = 0;
    for (let j = 0; j < assigned_associates.length; j++) {
      let count = this.assign_status.find(v => v.assigned_to == assigned_associates[j]['id']);
      count = Number(count['max']) - Number(count['assigned']);
      if (count != 0) {
        let assign = [];
        let loop_count = 0;
        for (let i = 0; i < count; i++) {
          if (new_claim[cont] != undefined) {
            assign.push(new_claim[cont]);
            cont++;
            loop_count++;
            ///Continue Here to update 'assign_status' and form it as 'claims_assigned' format  *************IMPORTANT-------******
          }
          // this.assigned_claims_details.find(v => v.id == id).value = event.target.value;
        }
        //Concat Claim Values
        if (loop_count != 0) {
          let array_data = this.assign_status.find(v => v.assigned_to == assigned_associates[j]['id']);
          let index = this.assign_status.findIndex(x => x.assigned_to == assigned_associates[j]['id']);
          let claims = array_data['claims'];
          let assigned_nos = array_data['assigned'];
          for (let z = 0; z < claims.length; z++) {
            assign.push(claims[z]);
          }
          array_data['claims'] = assign;
          array_data['assigned'] = Number(assigned_nos) + Number(loop_count);
          if (array_data['assigned'] > 0) {
            this.assign_status[index] = array_data;
          }
        }
      }
    }
    let unassigned_new_claims = [];
    if (cont < new_claim.length) {
      for (let i = cont; i < new_claim.length; i++) {
        unassigned_new_claims.push(new_claim[i]);
      }
    }

    //Final Check for Unassigned Claims and Associates
    let claim_array: any = [];
    let claim_name: any = [];
    for (let i = 0; i < this.assign_status.length; i++) {
      if (this.assign_status[i]['claims'].length == 0) {
        claim_array.push(this.assign_status[i]['assigned_to']);

        let name = this.associates_detail.find(v => v.id == this.assign_status[i]['assigned_to']);
        claim_name.push(name['firstname']);
        // let x=this.assigned_claims_details.find(v => v.id == id);
      }
    }

    if (claim_array.length != 0 || reopen_claim.length != 0 || unassigned_new_claims.length != 0) {
      this.error_details['associates'] = claim_array;
      this.error_details['reopen'] = reopen_claim;
      this.error_details['new_claims'] = unassigned_new_claims;
      this.error_details['associate_name'] = claim_name;
      this.associates_error_status = true;
    }
    else {
      this.associates_error_status = false;
    }
    let current_assigned = 0;
    let total_assigned = 0;
    this.assign_status.forEach(element => {
      current_assigned = element.assigned;
      total_assigned = Number(total_assigned) + Number(current_assigned);
    });

    if (total_assigned == 0) {
      this.null_assigned = true;
    }
    else {
      this.null_assigned = false;
    }
    console.log("Assigned", this.assign_status);
  }

  assigntype_reset: any;
  removeTextbox() {
    //this.assign_type().reset();
    this.assigntype_reset = this.assign_type(this.type);
    this.assigntype_reset = '';
    this.associateCount = '';
  }

  public work_order_notify(data: any) {
    this.assign_status = [];
    this.selected_associates = [];
    console.log(this.assign_status);
    this.selected_claim_nos = [];
    this.selected_claims = [];
    this.check_all = [];
    this.assigned_claims_details = [];
    this.assigned_data = [];
    this.workOrder.reset();
    this.pageChange(1, 'claim', null, null, null, null, null, null);
    this.toastr.successToastr('Work Order Created');
    this.reload_data(1);
  }
  //Create Work Order
  public create_workorder() {
    console.log(this.assign_status);
    if (this.workOrder.value) {
      let y = this.workOrder.controls['due_date'].value;
      let x = new Date(y);
      let year = x.getFullYear();
      let month = x.getMonth() + 1; // Months are zero-based, so we add 1
      let day = x.getDate() - 1; // Subtracting 1 from the date to get the previous day

      let result = { year: year, month: month, day: day };

      console.log(result);

      this.workOrder.value.due_date = result;
    }
    this.Jarwis.create_workorder(this.setus.getId(), this.workOrder.value, this.assign_status, 'followup').subscribe(
      data => this.work_order_notify(data),
      error => this.handleError(error)
    );
  }
  isChecked = true;
  checkedEvnt(val: any) {
    for (let i = 0; i < this.associates_detail.length; i++) {
      this.associates_detail[i].isChecked = val;
    }
    this.associateCount = '';
  }

  public clear_fields() {
    this.assigned_claims_details = [];
    this.workOrder.reset();
    this.formGroup.reset();
    this.associates_detail = [];
  }

  public ignore_error(type: any) {
    // alert(type);
    if (type == 'associates') {
      this.error_details['associates'] = [];
    }
    else if (type == 'reopen') {
      this.error_details['reopen'] = [];
    }
    else if (type == 'newclaims') {
      this.error_details['new_claims'] = [];
    }
    else if (type == 'assign_to_others') {
      let reopen = this.error_details['reopen']
      for (let x = 0; x < reopen.length; x++) {
        for (let i = 0; i < this.assign_status.length; i++) {
          let min = this.assign_status[i]['assigned'];
          let max = this.assign_status[i]['max'];
          if (Number(max) - Number(min) > 0) {
            let claims = this.assign_status[i]['claims'];
            claims.push(reopen[x]);
            this.assign_status[i]['claims'] = claims;
            this.assign_status[i]['assigned'] = Number(min) + 1;
            break;
          }
        }
      }

      this.error_details['reopen'] = [];
    }

    if (this.error_details['associates'] == '' && this.error_details['reopen'] == '' && this.error_details['new_claims'] == '') {
      this.associates_error_status = false;
    }
    console.log(this.assign_status);
  }

  sorting_name: any;
  order_list(type: any, table: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
    this.sorting_name = type;

    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.pageChange(this.pages, table, this.sortByAsc, type, sorting_name, sorting_method, null, search);
    } else {
      this.sortByAsc = true;
      this.pageChange(this.pages, table, this.sortByAsc, type, sorting_name, sorting_method, null, search);
    }

  }

  sort(property: any) {
    this.isDesc = false;
    this.column = property;
    let direction = this.isDesc ? 1 : -1;
    this.table_datas.sort(function (a: any, b: any) {
      if (a[property] < b[property]) {
        return -1 * direction;
      } else if (a[property] > b[property]) {
        return 1 * direction;
      } else {
        return 0;
      }
    });
  }

  desort(property: any) {
    this.isDesc = true;
    this.column = property;
    let direction = this.isDesc ? 1 : -1;
    this.table_datas.sort(function (a: any, b: any) {
      if (a[property] < b[property]) {
        return -1 * direction;
      } else if (a[property] > b[property]) {
        return 1 * direction;
      } else {
        return 0;
      }
    });
  }

  // desort(propertys) {
  //   this.isDesc = true;
  //   this.column = propertys;
  //   let descending = this.isDesc ? -1 : 1;
  //   this.table_datas.desort(function(a, b) {
  //     if (a[propertys] > b[propertys]) {
  //       return 1 * descending;
  //     } else if (a[propertys] < b[propertys]) {
  //       return -1 * descending;
  //     } else {
  //       return 0;
  //     }
  //   });
  // }

  createclaims_filter: any;
  createClaims_search(page: number, table: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, createsearch: any, searchdata: any) {
    console.log('claim_value', this.createClaimsFind.value);
    this.createclaims_filter = searchdata;
    console.log('Search Data', searchdata);

    this.pageChange(page, table, sort_data, sort_type, sorting_name, sorting_method, createsearch, searchdata);
  }
  allclaims_filter: any;
  allClaims_search(page: number, table: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, allclaimsearch: any, searchdata: any) {
    this.allclaims_filter = searchdata;
    console.log(searchdata);
    this.pageChange(page, table, sort_data, sort_type, sorting_name, sorting_method, allclaimsearch, searchdata);
  }
  /* reallocateclaims_filter;
  reallocateClaims_search(page: number, table, sort_data, sort_type, sorting_name, sorting_method, reallocatesearch, searchdata) {
    this.reallocateclaims_filter = searchdata;
    console.log(searchdata);
    this.pageChange(page, table, sort_data, sort_type, sorting_name, sorting_method, reallocatesearch, searchdata);
  } */

  //Table to list claims and Pagination
  upload_page: number = 0;
  pages: number = 0;
  total: number = 0;
  allclaim_pages: number = 0;
  allclaim_total: number = 0;
  reallocate_pages: number = 0;
  claim_status_codes = [];
  claim_sub_status_codes = [];
  searchs: any;
  public pageChange(page: number, table: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
    this.search = search;
    let searchs = this.search;
    this.searchValue = this.search;

    let page_count = 15;

    if (table == 'claim') {
      if (createsearch) {

        this.Jarwis.get_first_table_data(createsearch).subscribe(
          data => this.assign_page_data(data),
          error => this.handleError(error)
        )
      }


      // let createsearch_notNull: any = [];
      // let nullVal: boolean = false;
      // let createClaims_searchValue: any = [this.createClaimsFind.value];
      // if (typeof createClaims_searchValue === 'object' && createClaims_searchValue !== null) {
      //   Object.keys(createClaims_searchValue).forEach(key => {
      //     if (typeof createClaims_searchValue[key] === 'object' && createClaims_searchValue[key] !== null) {
      //       Object.keys(createClaims_searchValue[key]).forEach(val => {
      //         if (typeof createClaims_searchValue[key][val] === 'object' && createClaims_searchValue[key][val] !== null) {
      //           Object.keys(createClaims_searchValue[key][val]).forEach(data => {
      //             if (createClaims_searchValue[key][val][data] === null) {
      //               nullVal = false;
      //             }
      //             else {
      //               nullVal = true;
      //             }
      //           });
      //           createsearch_notNull.push(nullVal);
      //         }
      //         else if (typeof createClaims_searchValue[key][val] !== 'object' && createClaims_searchValue[key][val] !== null && createClaims_searchValue[key][val] != '') {
      //           nullVal = true;
      //           createsearch_notNull.push(nullVal);
      //         }
      //         else if (typeof createClaims_searchValue[key][val] !== 'object' && createClaims_searchValue[key][val] !== null && createClaims_searchValue[key][val] == '') {
      //           nullVal = false;
      //           createsearch_notNull.push(nullVal);
      //         }
      //       });
      //     }
      //   });
      // }
      // if (createsearch_notNull.some((x: any) => x === true)) {
      //   this.search = this.createclaims_filter;
      //   search = this.search;
      //   sort_data = 'null';
      //   sort_type = 'null';
      //   sorting_name = null;
      // }
      // else {
      //   this.search = null;
      //   search = this.search;
      //   sort_type = null;
      // }

      searchs = this.search;
      this.pages = page;
      if (sorting_name == null && searchs == null) {
        console.log('Sort_data', sort_data);
        // this.Jarwis.get_table_page(sort_data, page, page_count, sort_type, sorting_name, sorting_method, null, search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
      } else if (searchs == 'search') {
        if (this.createClaimsFind.value.dos?.[0] != null && this.createClaimsFind.value.dos?.[1] != null) {
          console.log(this.createClaimsFind.value.dos);
          this.createClaimsFind.value.dos['startDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
          this.createClaimsFind.value.dos['endDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
          this.createClaimsFind.value.dos.pop(this.createClaimsFind.value.dos[0]);
          this.createClaimsFind.value.dos.pop(this.createClaimsFind.value.dos[1]);
          const obj = { ... this.createClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.createClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.createClaimsFind.value.dos);
        }
        if (this.createClaimsFind.value.date?.[0] != null && this.createClaimsFind.value.date?.[1] != null) {
          console.log(this.createClaimsFind.controls['date'].value);
          this.createClaimsFind.value.date['startDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
          this.createClaimsFind.value.date['endDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
          this.createClaimsFind.value.date.pop(this.createClaimsFind.value.date[0]);
          this.createClaimsFind.value.date.pop(this.createClaimsFind.value.date[1]);
          const obj = { ... this.createClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.createClaimsFind.value.date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.createClaimsFind.value.date);
        }
        if (this.createClaimsFind.value.bill_submit_date?.[0] != null && this.createClaimsFind.value.bill_submit_date?.[1] != null) {

          this.createClaimsFind.value.bill_submit_date['startDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
          this.createClaimsFind.value.bill_submit_date['endDate'] = this.datepipe.transform(new Date(this.createClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
          this.createClaimsFind.value.bill_submit_date.pop(this.createClaimsFind.value.bill_submit_date[0]);
          this.createClaimsFind.value.bill_submit_date.pop(this.createClaimsFind.value.bill_submit_date[1]);
          const obj = { ... this.createClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.createClaimsFind.value.bill_submit_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.createClaimsFind.value.bill_submit_date);
        }
        // this.Jarwis.get_table_page(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, this.createClaimsFind.value, this.search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_first_table_data(this.createClaimsFind.value).subscribe(
          data => this.assign_page_data(data),
          error => this.handleError(error)
        )
      } else {
        console.log('SORT_DATA', sort_data);
        // this.Jarwis.get_table_page(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, null, this.search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
      }

      // if(sorting_name == 'null' && searchs == null){
      //   this.Jarwis.get_workorder(filter,0,0,1,page,sort_type,sort_data,sorting_name,sorting_method,closedsearch,search).subscribe(
      //     data  => this.form_closedClaims_table(data,page),
      //     error => this.error_handler(error)
      //   );
      // }else if(searchs == 'search'){
      //   this.Jarwis.get_workorder(filter,0,0,1,page,sort_type,sort_data,this.closed_sorting_name,this.sortByAsc,this.closedClaimsFind.value,this.search).subscribe(
      //     data  => this.form_closedClaims_table(data,page),
      //     error => this.error_handler(error)
      //   );
      // }
      // else{
      //   this.Jarwis.get_workorder(filter,0,0,1,page,sort_type,sort_data,this.closed_sorting_name,this.sortByAsc,closedsearch,this.search).subscribe(
      //     data  => this.form_closedClaims_table(data,page),
      //     error => this.error_handler(error)
      //   );
      // }
    }
    /** Developer : Sathish
        Date : 09/01/2023
        Purpose : To get all Calims Table */
    else if (table == 'all_claim') {
      let allclaimsearch_notNull: any = [];
      let nullVal: boolean = false;
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
    /* else if (table == 'reallocate_claims') {
      console.log(sorting_name);
      let itemnotNull = [];
      let nullVal:boolean = false;
      let reallocate_searchdata = [this.reallocateClaimsFind.value];
      if (typeof reallocate_searchdata === 'object' && this.reallocateClaimsFind.value !== null) {
        Object.keys(reallocate_searchdata).forEach(key => {
          if (typeof reallocate_searchdata[key] === 'object' && reallocate_searchdata[key] !== null) {
            Object.keys(reallocate_searchdata[key]).forEach(val => {
              if(typeof reallocate_searchdata[key][val] === 'object' && reallocate_searchdata[key][val] !== null) {
                Object.keys(reallocate_searchdata[key][val]).forEach(data => {
                  if(reallocate_searchdata[key][val][data] === null){
                    nullVal = false;
                  }
                  else{
                    nullVal = true;
                  }
                });
                itemnotNull.push(nullVal);
              }
              else if (typeof reallocate_searchdata[key][val] !== 'object' && reallocate_searchdata[key][val] !== null){
                nullVal = true;
                itemnotNull.push(nullVal);
              }
            });
          }
        });
      }
      if(itemnotNull.some(x => x === true)){
        console.log('val changed');
        this.search = this.reallocateclaims_filter;
        sort_data = 'null';
        sort_type = 'null';
        sorting_name='null';
        search = this.search;
      }
      else{
        console.log('val not changed');
        this.search=null;
        sort_data = null;
        sort_type = null;
        sorting_name = null;
        sorting_method = null;
        search = this.search;
      }
      searchs = this.search;
      console.log(searchs);
      this.reallocate_pages = page;
      if (sorting_name == null && searchs == null) {
        this.Jarwis.reallocation_list(sort_data, page, page_count, sort_type, null, sorting_method, null, search).subscribe(
          data => this.reallocate_page_data(data),
          error => this.handleError(error)
        );
      } else if (searchs == 'search') {
        if (this.reallocateClaimsFind.value.dos.startDate !=null && this.reallocateClaimsFind.value.dos.endDate !=null) {
          console.log(this.reallocateClaimsFind.value);
          this.reallocateClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.dos.startDate), 'yyyy-MM-dd');
          this.reallocateClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.dos.endDate), 'yyyy-MM-dd');
        }
        if (this.reallocateClaimsFind.value.date?.[0] != null && this.reallocateClaimsFind.value.date.endDate != null) {
          console.log(this.reallocateClaimsFind.controls.date.value);
          this.reallocateClaimsFind.value.date?.[0] = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.date?.[0]._d), 'yyyy-MM-dd');
          this.reallocateClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.date.endDate._d), 'yyyy-MM-dd');
        }
        if (this.reallocateClaimsFind.value.bill_submit_date.startDate != null && this.reallocateClaimsFind.value.bill_submit_date.endDate != null) {
          // console.log(this.createClaimsFind.controls.bill_submit_date.value);
          this.reallocateClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.bill_submit_date.startDate._d), 'yyyy-MM-dd');
          this.reallocateClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.reallocateClaimsFind.value.bill_submit_date.endDate._d), 'yyyy-MM-dd');
        }

        this.Jarwis.reallocation_list(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, this.reallocateClaimsFind.value, this.search).subscribe(
          data => this.reallocate_page_data(data),
          error => this.handleError(error)
        );
      } else {
        this.Jarwis.reallocation_list(sort_data, page, page_count, sort_type, sorting_name,this.sortByAsc, null, this.search).subscribe(
          data => this.reallocate_page_data(data),
          error => this.handleError(error)
        );
      }
    } */
    else if (table == 'upload') {
      this.upload_page = page;
      console.log(this.upload_page);
      this.Jarwis.get_upload_table_page(page, page_count).subscribe(
        data => this.handleResponse(data),
        error => this.handleError(error)
      );
    }
    else if (table == 'all') {
      console.log(table);
      this.pages = page;

      if (sorting_name == 'null') {
        this.Jarwis.claim_status_data_fork(sort_data, page, page_count, sort_type, this.setus.getId(), sorting_name, sorting_method, createsearch, search).subscribe(
          data => {
            this.assign_page_data(data[0]),
              this.assign_status_codes(data[1])
          },
          error => this.handleError(error)
        );
      } else {
        this.Jarwis.claim_status_data_fork(sort_data, page, page_count, sort_type, this.setus.getId(), this.sortByAsc, this.sorting_name, createsearch, search).subscribe(
          data => {
            this.assign_page_data(data[0]),
              this.assign_status_codes(data[1])
          },
          error => this.handleError(error)
        );
      }


      this.upload_page = page;
      this.Jarwis.get_upload_table_page(page, page_count).subscribe(
        data => this.handleResponse(data),
        error => this.handleError(error)
      );

    }
    else if (table == 'uploadall') {
      this.upload_page = page;
      this.Jarwis.get_upload_table_page(page, page_count).subscribe(
        data => this.handleResponse(data),
        error => this.handleError(error)
      );
    }
  }
  selected_status_code: any = [];
  selected_sub_status_code: any = [];
  //Assign Status codes
  public assign_status_codes(data: any) {
    this.claim_status_codes = data.status;
    this.claim_sub_status_codes = data.sub_status;
  }

  //Change values of substatus
  public change_sub_status_code($event: any) {
    this.selected_status_code = $event.target.value;
    this.selected_sub_status_code = this.claim_sub_status_codes[$event.target.value];
  }

  selected_filter_type: any = [];
  //set filter type
  public claim_filter_type($event: any) {
    this.selected_filter_type = $event.target.value;

    this.claim_sort_filter();
  }


  //sort with filter
  public claim_sort_filter() {
    this.pageChange(1, 'all', 'null', 'null', 'null', 'null', 'null', 'null')
  }


  //Assign Table data and `total values
  current_total: any;
  skip: any;
  total_row: any;
  skip_row: any;
  current_row: any;
  selected_claim_data: any;
  cwo_total: any;
  GridData_CreateWorkOrders: any = [];
  GridData_WorkOrders: any = [];
  GridData_ClosedClaims: any = [];
  GridData_Import: any = [];
  GridData_ReImport: any = [];
  GridData_AllClaims: any = [];

  ReloadData: any = [];

  public assign_page_data(data: any) {
    console.log('New Data', data);
    if (data) {
      this.GridData_CreateWorkOrders = data.data;
      this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
    }
    else {
      this.myGrid_1.api?.setRowData([]);
    }


    this.table_datas = data.data;
    if(data){
      console.log('INNNN');
      this.GridData_AllClaims = data.data;
      this.myGrid_6.api?.setRowData(this.GridData_AllClaims);
    }
    this.selected_claim_data = data.selected_claim_data;
    this.cwo_total = data.total;
    this.current_total = data.current_total;
    this.skip = data.skip + 1;

    this.skip_row = this.skip;
    this.current_row = this.skip + this.current_total - 1;
    this.total_row = data.total;
  }

  //Reallocate Table data and `total values
  /* reallocate_table_datas = [];
  reallocate_current_total;
  reallocate_skip;
  reallocate_total_row;
  reallocate_skip_row;
  reallocate_current_row;
  reallocate_selected_claim_data;
  reallocate_cwo_total;
  public reallocate_page_data(data) {
    this.reallocate_table_datas = data.data;
    this.reallocate_selected_claim_data = data.selected_claim_data;
    this.reallocate_cwo_total = data.total;
    this.reallocate_current_total = data.current_total;
    this.reallocate_skip = data.skip + 1;

    this.reallocate_skip_row = this.reallocate_skip;
    this.reallocate_current_row = this.reallocate_skip + this.reallocate_current_total - 1;
    this.reallocate_total_row = data.total;
  } */

  searchData: string = '';
  //Search filter function
  public sort_data(data: any) {
    this.pageChange(1, 'claim', data, 'searchFilter', 'null', 'null', 'null', 'null');
    this.searchData = data;
    //To reset the checklist
    this.check_all[1] = false;
    this.selected_claim_nos = [];

  }

  public sort_wo_data(data: any) {
    // console.log(data);
    if (data == '') {
      this.get_workorder(null, null, null, 1, 1, null, null, 'null', 'null', null, null, null);
    }
    else {
      this.get_workorder('search', data, 0, 1, 1, null, null, 'null', 'null', null, null, null);
    }

  }

  public sort_table(data: any) {
    this.pageChange(1, 'claim', data, 'filters', 'null', 'null', 'null', 'null');
  }

  closed_sorting_name: any;

  closed_order_list(filter: any, from: any, to: any, type: any, sort_type: any, sort_data: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, search: any) {

    this.closed_sorting_name = sort_type;

    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.get_workorder(filter, from, to, type, this.closed_pges, sort_type, this.sortByAsc, sorting_name, sorting_method, closedsearch, workordersearch, search);
    } else {
      this.sortByAsc = true;
      this.get_workorder(filter, from, to, type, this.closed_pges, sort_type, this.sortByAsc, sorting_name, sorting_method, closedsearch, workordersearch, search);
    }

  }

  workorder_filter: any;
  workorder_search(filter: any, from: any, to: any, type: any, page: any, sort_type: any, sort_data: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, search: any) {
    this.workorder_filter = search;
    console.log('workorder_filter', this.workorder_filter);
    console.log(page);
    this.get_workorder(filter, from, to, type, page, sort_type, this.sortByAsc, sorting_name, sorting_method, null, this.workOrderFind.value, search);
  }



  wo_page_number: number = 1;
  work_order_data: any = [];
  closed_page_number: number = 1;
  closed_data: any = [];

  wo_sorting_name: any;
  work_order_list(sort_type: any, sorting_name: any, sorting_method: any, search: any) {
    console.log(sort_type);
    this.search = search;
    let searchs = this.search;

    this.wo_sorting_name = sort_type;

    if (searchs == 'search') {

      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.get_workorder(null, null, null, 1, this.pages, sort_type, this.sortByAsc, sorting_name, sorting_method, null, null, search);
      } else {
        this.sortByAsc = true;
        this.get_workorder(null, null, null, 1, this.pages, sort_type, this.sortByAsc, sorting_name, sorting_method, null, null, search);
      }
    } else {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.get_workorder(null, null, null, 1, this.pages, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, search);
      } else {
        this.sortByAsc = true;
        this.get_workorder(null, null, null, 1, this.pages, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, search);
      }
    }
  }


  type: any;
  closed_pges: any;
  searchValue: any;
  public get_workorder(filter: any, from: any, to: any, type: any, page: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, search: any) {

    this.search = search;
    let searchs = this.search;
    this.searchValue = this.search;

    console.log('', this.searchValue);

    let page_count = 15;

    this.type = filter;

    if (filter == null && from == null && to == null) {
      this.pages = page;
      this.search = this.workorder_filter;
      searchs = this.search;

      if (sorting_name == 'null' && searchs == null) {
        // this.Jarwis.get_workorder(0, 0, 0, 1, page, sort_type, sort_data, sorting_name, sorting_method, closedsearch, workordersearch, search).subscribe(
        //   data => this.form_wo_table(data, page),
        //   error => this.error_handler(error)
        // );
        this.Jarwis.get_workorder_new(0, 1, page, closedsearch, workordersearch).subscribe(
          data => this.form_wo_table(data, page),
          error => this.error_handler(error)
        );
      } else if (searchs == 'search') {
        console.log('workfindValues', this.workOrderFind.value);

        console.log('INN');
        console.log('created_at', this.workOrderFind.value.created_at);
        if (this.workOrderFind.value.created_at?.[0] != null && this.workOrderFind.value.created_at?.[1] != null) {
          this.workOrderFind.value.created_at['startDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.created_at?.[0]), 'yyyy-MM-dd');
          this.workOrderFind.value.created_at['endDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.created_at?.[1]), 'yyyy-MM-dd');
          this.workOrderFind.value.created_at.pop(this.workOrderFind.value.created_at[0]);
          this.workOrderFind.value.created_at.pop(this.workOrderFind.value.created_at[1]);
          const obj = { ... this.workOrderFind.controls['created_at'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.workOrderFind.value.created_at = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.workOrderFind.value.created_at);
        }
        else {
          this.workOrderFind.value.created_at = null;
          this.workOrderFind.value.created_at = null;
        }
        console.log('due_date', this.workOrderFind.value.due_date);
        if (this.workOrderFind.value.due_date?.[0] != null && this.workOrderFind.value.due_date?.[1] != null) {
          console.log('due_date', this.workOrderFind.controls['due_date'].value);
          this.workOrderFind.value.due_date['startDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.due_date?.[0]), 'yyyy-MM-dd');
          this.workOrderFind.value.due_date['endDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.due_date?.[1]), 'yyyy-MM-dd');
          this.workOrderFind.value.due_date.pop(this.workOrderFind.value.due_date[0]);
          this.workOrderFind.value.due_date.pop(this.workOrderFind.value.due_date[1]);
          const obj = { ... this.workOrderFind.controls['due_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.workOrderFind.value.due_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.workOrderFind.value.due_date);
        }
        else {
          this.workOrderFind.value.due_date = null;
          this.workOrderFind.value.due_date = null;
        }

        // this.Jarwis.get_table_page(sort_data, page, page_count, sort_type, sorting_name, this.sortByAsc, this.createClaimsFind.value, this.search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_workorder_new(0, 1, page, closedsearch, this.workOrderFind.value).subscribe(
          data => this.form_wo_table(data, page),
          error => this.error_handler(error)
        );
        // this.Jarwis.get_workorder(0, 0, 0, 1, page, sort_type, sort_data, this.wo_sorting_name, this.sortByAsc, null, this.workOrderFind.value, this.search).subscribe(
        //   data => this.form_wo_table(data, page),
        //   error => this.error_handler(error)
        // );
      }
      else {
        this.Jarwis.get_workorder(0, 0, 0, 1, page, sort_type, sort_data, this.wo_sorting_name, this.sortByAsc, null, workordersearch, this.search).subscribe(
          data => this.form_wo_table(data, page),
          error => this.error_handler(error)
        );
      }
    }
    else if (filter == 'search') {

      this.pages = page;

      this.Jarwis.get_workorder(filter, from, 0, 1, page, sort_type, sort_data, sorting_name, sorting_method, null, null, search).subscribe(
        data => this.form_wo_table(data, page),
        error => this.error_handler(error)
      );
    } else if (filter == 'closedClaims') {
      this.closed_pges = page;
      console.log(this.closedClaimsFind.value);

      let closedSearch_notNull: any = [];
      let nullVal: boolean = false;
      let closedClaims_searchValue: any = [this.closedClaimsFind.value];
      console.log(closedClaims_searchValue);
      if (typeof closedClaims_searchValue === 'object' && closedClaims_searchValue !== null) {
        Object.keys(closedClaims_searchValue).forEach(key => {
          if (typeof closedClaims_searchValue[key] === 'object' && closedClaims_searchValue[key] !== null) {
            Object.keys(closedClaims_searchValue[key]).forEach(val => {
              if (typeof closedClaims_searchValue[key][val] === 'object' && closedClaims_searchValue[key][val] !== null) {
                Object.keys(closedClaims_searchValue[key][val]).forEach(data => {
                  if (closedClaims_searchValue[key][val][data] === null) {
                    nullVal = false;
                  }
                  else {
                    nullVal = true;
                  }
                });
                closedSearch_notNull.push(nullVal);
              }
              else if (typeof closedClaims_searchValue[key][val] !== 'object' && closedClaims_searchValue[key][val] !== null && closedClaims_searchValue[key][val] != '') {
                nullVal = true;
                closedSearch_notNull.push(nullVal);
              }
              else if (typeof closedClaims_searchValue[key][val] !== 'object' && closedClaims_searchValue[key][val] !== null && closedClaims_searchValue[key][val] == '') {
                nullVal = false;
                closedSearch_notNull.push(nullVal);
              }
            });
          }
        });
      }
      if (closedSearch_notNull.some((x: any) => x === true)) {
        this.search = this.closedclaims_filter;
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

      if (sorting_name == 'null' && searchs == null) {
        // this.Jarwis.get_workorder(filter, 0, 0, 1, page, sort_type, sort_data, sorting_name, sorting_method, closedsearch, workordersearch, search).subscribe(
        //   data => this.form_closedClaims_table(data, page),
        //   error => this.error_handler(error)
        // );
        this.Jarwis.get_workorder_new(filter, 1, page, closedsearch,workordersearch).subscribe(
          data => this.form_closedClaims_table(data, page),
          error => this.error_handler(error)
        );
      } else if (searchs == 'search') {
        if (this.closedClaimsFind.value.dos?.[0] != null && this.closedClaimsFind.value.dos?.[1] != null) {
          console.log(this.closedClaimsFind.controls['dos'].value);
          this.closedClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.dos.pop(this.closedClaimsFind.value.dos[0]);
          this.closedClaimsFind.value.dos.pop(this.closedClaimsFind.value.dos[1]);
          const obj = { ... this.closedClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }
          this.closedClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.closedClaimsFind.value.dos);
        }
        if (this.closedClaimsFind.value.date?.[0] != null && this.closedClaimsFind.value.date.endDate != null) {
          console.log(this.closedClaimsFind.controls['date'].value);
          this.closedClaimsFind.value.date.startDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.date.pop(this.closedClaimsFind.value.date[0]);
          this.closedClaimsFind.value.date.pop(this.closedClaimsFind.value.date[1]);
          const obj = { ... this.closedClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }
          this.closedClaimsFind.value.date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.closedClaimsFind.value.date);
        }

        this.Jarwis.get_workorder(filter, 0, 0, 1, page, sort_type, sort_data, this.closed_sorting_name, this.sortByAsc, this.closedClaimsFind.value, null, this.search).subscribe(
          data => this.form_closedClaims_table(data, page),
          error => this.error_handler(error)
        );
        // this.Jarwis.get_workorder_new(filter, 1, page, this.closedClaimsFind.value,null ).subscribe(
        //   data => this.form_closedClaims_table(data, page),
        //   error => this.error_handler(error)
        // );
      }
      else {
        // this.Jarwis.get_workorder(filter, 0, 0, 1, page, sort_type, sort_data, this.closed_sorting_name, this.sortByAsc, closedsearch, null, this.search).subscribe(
        //   data => this.form_closedClaims_table(data, page),
        //   error => this.error_handler(error)
        // );
        this.Jarwis.get_workorder_new(filter, 1, page, closedsearch,workordersearch).subscribe(
          data => this.form_closedClaims_table(data, page),
          error => this.error_handler(error)
        );
      }
    }


  }


  search: any;
  closedclaims_filter: any;
  closedClaims_search(filter: any, from: any, to: any, type: number, sort_type: any, sort_data: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, searchdata: any) {
    this.closedclaims_filter = searchdata;
    this.get_workorder(filter, from, to, type, this.closed_pges, sort_type, sort_data, sorting_name, this.sortByAsc, closedsearch, null, searchdata);
  }





  wo_total: number = 0;
  closed_total: number = 0;
  closed_pages: number = 0;
  w_total: any;
  w_current_total: any;
  w_skip: any;
  w_current_row: any;
  w_skip_rows: any;
  w_total_row: any;
  public form_wo_table(data: any, page_no: any) {
    // console.log(data);
    // this.work_order_data = data.data;
    this.GridData_WorkOrders = [];

    if (data) {
      this.GridData_WorkOrders = data.data;
      this.myGrid_2.api?.setRowData(this.GridData_WorkOrders);
      console.log('GridData2', this.GridData_WorkOrders);


      // console.log('work_order_data',this.work_order_data);
      this.wo_total = data.count;
      this.wo_page_number = page_no;

      this.w_total = data.count;
      this.w_current_total = data.current_total;
      this.w_skip = data.skip + 1;

      this.w_skip_rows = this.w_skip;
      this.w_current_row = this.w_skip + this.w_current_total - 1;
      this.w_total_row = this.w_total;
    }
  }
  totals: any;
  current_totals: any;
  skips: any;
  skip_rows: any;
  current_rows: any;
  total_rows: any;
  closed_claim_data: any;
  public form_closedClaims_table(data: any, page_no: any) {

    this.GridData_ClosedClaims = [];
    this.closed_data = data.data;
    if(data)
    {
      this.GridData_ClosedClaims = data.data;
      this.myGrid_3.api.setRowData(this.GridData_ClosedClaims);
      console.log('GridRowData',this.GridData_ClosedClaims);

    }
    console.log('closed DAta', this.closed_data);
    this.closed_claim_data = data.closed_claim_data;
    this.closed_total = data.count;
    this.closed_page_number = page_no;

    this.current_totals = data.current_total;
    this.skips = data.skip + 1;

    this.skip_rows = this.skips;
    this.current_rows = this.skips + this.current_totals - 1;
    this.total_rows = data.count;
  }

  wo_details: any = [];
  wo_name: string = '';
  wo_created: string = '';
  public get_wo_details(id: any, name: any, assigned: any) {
    console.log('sssa', id, name, assigned);

    this.loading = true;
    this.wo_details = []
    this.wo_name = name;
    this.wo_created = assigned;
    this.Jarwis.get_workorder_details(id).subscribe(
      data => this.wo_details_table(data),
      error => this.error_handler(error)
    );
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
    if (table_name == 'Create_work_order_claims') {
      this.searchClaims = this.createClaimsFind.value;
    } else if (table_name == 'Closed_claims') {
      this.searchClaims = this.closedClaimsFind.value;
    } else if (table_name == 'work_orders') {
      this.workordersearch = this.workOrderFind.value;
    }
    else if(table_name == 'all_claims_list'){
      this.searchClaims = this.allClaimsFind.value;
    }

    if(table_name !='all_claims_list')
    {
    this.Jarwis.fetch_create_claims_export_data(this.setus.getId(), table_name, this.search, this.searchClaims, this.workordersearch).subscribe(
      data => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
    );
    }
    else if(table_name == 'all_claims_list'){
      this.Jarwis.fetch_all_claims_export_data(this.setus.getId(),table_name,this.search,this.searchClaims,this.workordersearch).subscribe(
        data => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
      )
    }
  }

  public export_pdf_files(type: any, table_name: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';

    this.Jarwis.fetch_create_claims_export_data_pdf(this.setus.getId(), table_name, this.search).subscribe(
      data => this.export_handler.sort_export_data(data, type, 'claim'),
      error => this.error_handler(error)
    );
  }


  public export_excel_wo_files(type: any, table_name: any) {
    console.log(this.searchValue);
    this.Jarwis.fetch_work_order_export_data(this.setus.getId(), table_name, this.searchValue, this.workOrderFind.value).subscribe(
      data => this.export_handler.create_wo_export_excel(data),
      error => this.error_handler(error)
    );
  }

  public export_pdf_wo_files(type: any, table_name: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';

    this.Jarwis.fetch_work_order_export_data_pdf(this.setus.getId(), table_name).subscribe(
      data => this.export_handler.sort_export_data(data, type, 'claim'),
      error => this.error_handler(error)
    );
  }

  export_Excel_handler() {

  }

  public wo_details_table(data: any) {
    this.loading = false;
    this.wo_details = data.data;

    console.log(this.wo_details);
  }


  public export_files(type: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';

    this.Jarwis.fetch_calim_export_data(filter, s_code, this.setus.getId()).subscribe(
      data => this.export_handler.sort_export_data(data, type, 'claim'),
      error => this.error_handler(error)
    );
  }


  public export_wo_files(type: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';
    let wo_type = 1;
    this.Jarwis.fetch_wo_export_data(filter, s_code, wo_type, this.setus.getId()).subscribe(
      data => this.export_handler.ready_wo_export(data, type),
      error => this.error_handler(error)
    );

  }


  public wo_export_function(type: any) {
    this.export_handler.sort_export_data(this.wo_details, type, 'wo_detail');
  }


  public get_line_items(claim: any) {
    let stat = 0;

    for (let i = 0; i < this.line_item_data.length; i++) {
      let array = this.line_item_data[i];
      let x = array.find((x: any) => x.claim_id == claim['claim_no']);

      if (x != undefined) {
        this.line_data = array;
        stat = 1;
      }
    }

    if (stat == 0) {
      this.Jarwis.get_line_items(claim).subscribe(
        data => this.assign_line_data(data),
        error => this.handleError(error)
      );
    }

    this.pageChange(1, 'claims', 'null', 'null', 'null', 'null', 'null', 'null');

  }

  line_item_data: any = [];
  assign_line_data(data: any) {
    this.line_item_data.push(data.data);
    this.line_data = data.data;

    console.log(this.line_data);
  }

  touch_count: number = 0;

  reload_data(page: any) {
    console.log('Yes');
    // this.gridApi_1.setRowData([]);
    this.pages = page;
    this.modalRef?.hide();
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

      let page_count = 15;

      this.Jarwis.get_table_page(null, this.pages, page_count, null, null, null, 'null', 'null').subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      this.Jarwis.all_claim_list_new('null').subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });

      this.formGroup.reset();

    }
  }
  reload_data_allClaims(page:any){
    this.pages = page;
    this.modalRef?.hide();
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

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });

      this.formGroup.reset();

    }
  }

  // rowData:any = [];
  // selva()
  // {
  //   let newSelva : any = [];
  //   console.log('syss');
  //   this.Jarwis.get_table_page(1, 'claim', 'null', 'null', 'null', 'null', 'null', 'null').subscribe((data: any) => {
  //     console.log('New ARRAY', data);
  //     newSelva = data.data;
  //     console.log('NewSelva',newSelva);
  //     this.rowData = newSelva;
  //     this.myGrid_1.api.refreshCells();
  //   });
  //   this.myGrid_1.api?.setRowData(newSelva);
  //   this.myGrid_1.api?.refreshCells({force : true});
  // }

  reload_datas(page: any) {

    this.pages = page;

    this.Jarwis.get_upload_table_page(page, 15).subscribe(
      data => this.handleResponse(data),
      error => this.handleError(error)
    );

    console.log(this.modalService.hasOpenModals());
    if (this.modalService.hasOpenModals() == false) {
      this.pageChange(this.pages, 'claim', null, null, 'null', 'null', null, 'null');

      // for (let i = 0; i < this.selected_claim_data.length; i++) {
      //   let claim = this.selected_claim_data[i]['claim_no'];
      //   let ind = this.selected_claim_nos.indexOf(claim);
      //   this.selected_claims.splice(ind, 1);
      //   this.selected_claim_nos.splice(ind, 1);

      // }

      let page_count = 15;

      this.Jarwis.get_table_page(null, this.pages, page_count, null, null, null, null, null).subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });

      this.formGroup.reset();

    }

  }
  load_reimport_data(page: any) {
    this.reimport_page = page;
    let page_count = 15;
    this.Jarwis.get_reimport_table_page(this.reimport_page, page_count).subscribe(
      data => this.handleResponse_reimport(data),
      error => this.handleError(error)
    );
  }


  public unCheck() {
    this.checkboxes.forEach((element) => {
      element.nativeElement.checked = false;
    });
  }


  public un_selected(event: any, claim: string, index: any) {
    console.log(this.selected_claim_nos);

    if (claim == 'all' && event.target.checked == false) {



      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if (event.target.checked == false) {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind, 1);
      this.selected_claim_nos.splice(ind, 1);

    }

  }






  // fetch_count()
  // {
  //  let x = this.notify_service.get_tl();
  //  console.log("Get count",x);

  // }


  // get_touch_limit()
  // {
  //   this.Jarwis.get_practice_stats().subscribe(
  //     data =>this.set_prac_settings(data)
  //     );
  // }

  //
  // set_prac_settings(data)
  // {
  //   let prac_data=data.data;
  //   this.touch_count=prac_data.touch_limit;

  //   console.log(this.touch_count);

  // }

  delete_file(id: any) {
    //console.log(id);
    this.Jarwis.delete_upload_file(id, this.setus.getId()).subscribe(
      data => {
        this.pageChange(this.upload_page, 'upload', 'null', 'null', 'null', 'null', 'null', 'null');
        this.deleteMessage(data)
      },
      error => this.error_handler(error)
    );
  }

  deleteMessage(data: any) {
    console.log(data);
    if (data.message == 'success') {
      this.toastr.successToastr('File Deleted');
    } else if (data.message == 'failure') {
      this.toastr.errorToastr('Unable to delete Processed file');
    }


  }

  error_handler(error: any) {
    //console.log(error);

    if (error.error.exception == 'Illuminate\Database\QueryException') {
      this.toastr.warningToastr('File Cannot Be Deleted', 'Foreign Key Constraint');
    }
    else {
      this.toastr.errorToastr(error.error.exception, 'Error!');
    }


  }


  process_uld_file(id: any) {
    console.log(id);

    this.Jarwis.process_upload_file(id, this.setus.getId()).subscribe(
      data => { this.handlemessage(data), this.pageChange(1, 'upload', 'null', 'null', 'null', 'null', 'null', 'null') },
      error => this.error_handler(error)
    );

  }
  public myOptions: any = {
    'placement': 'right',
    'hide-delay': 3000,
    'theme': 'light'
  }

  line: any;
  line2: any;
  public get_graph_stats() {
    this.Jarwis.get_graph_stats_fork(this.setus.getId()).subscribe(
      data => {
        this.assign_graph_values(data[0]),
          this.assign_table_values(data[1])
      },
      error => this.handleError(error)
    );

    // const isDisabled = (date: NgbDate, current: {month: number}) => date.day === 13;


    // this.Jarwis.get_claim_graph_stats(this.setus.getId()).subscribe(
    //   data  => ,
    //   error => console.log(error)
    //   );
  }

  // graph_data=[];
  // graph_data_year=[];
  insurance_table_data = [];
  insurance_total = [];
  insurance_per = [];

  status_data = [];
  status_total = [];
  status_perc = [];

  assoc_data = [];
  assoc_total = [];
  assoc_perc = [];

  assign_graph_values(data: any) {
    //console.log(data);
    let graph_data_year = [];
    let graph_data_flow = [];
    let graph_data = [];
    if (data.data.length == 0) {
      this.line = "";
    }
    else {
      graph_data_year = data.data['year'][0];
      graph_data_flow = data.data['data'];
      graph_data = data.daily;

      this.line = {
        "chart": {
          // "caption": "Store footfall vs Online visitors ",
          // "subCaption": "Last Year",
          "xAxisName": "Quarter",
          "yAxisName": "Claims",
          "base": "10",
          // "numberprefix": "",
          "theme": "fusion"
        },
        "categories": [
          {
            "category": [
              {
                "label": graph_data_year[0] + " Q1"
              },
              {
                "label": graph_data_year[1] + " Q2"
              },
              {
                "label": graph_data_year[2] + " Q3"
              },
              {
                "label": graph_data_year[3] + " Q4"
              },
              // {
              //     "label": "2019"
              // }

            ]
          }
        ],
        "dataset": [
          {
            "seriesname": "Assigned Claims",
            "data": [
              {
                "value": graph_data_flow[0][0]
              },
              {
                "value": graph_data_flow[1][0]
              },
              {
                "value": graph_data_flow[2][0]
              },
              {
                "value": graph_data_flow[3][0]
              }
            ]
          },
          {
            "seriesname": "Completed Claims",
            "data": [
              {
                "value": graph_data_flow[0][1]
              },
              {
                "value": graph_data_flow[1][1]
              },
              {
                "value": graph_data_flow[2][1]
              },
              {
                "value": graph_data_flow[3][1]
              }
            ]
          }
        ]
      }
    }


    // console.log("Ststus",this.status);

    if (data.daily['work'].length == 0) {
      this.line2 = [];
    }
    else {
      let value1 = [];
      let value2 = [];
      // console.log("Here");


      // console.log("Here222");
      // graph_data=[];
      value1 = [];
      value2 = [];
      let days = graph_data['dates'];
      let data_days = graph_data['days'];
      let data_data = graph_data['work'];
      // console.log("Chc",days,data_days,data_data)

      let graph_data2 = [];

      for (let i = 0; i < days.length; i++) {
        graph_data2.push({ "label": '' + days[i] + '' });

        let index = data_days.indexOf(days[i]);

        if (index >= 0) {
          value1.push({ "value": data_data[index][0] });
          value2.push({ "value": data_data[index][1] });
        }
        else {
          value1.push({ "value": '0' });
          value2.push({ "value": '0' });
        }

      }
      // console.log("Graph Check",graph_data2,value1,value2);

      // console.log("Here3333");
      this.line2 = {
        "chart": {
          // "caption": "Store footfall vs Online visitors ",
          // "subCaption": "Last Year",
          "xAxisName": "Date",
          "yAxisName": "Claims",
          "base": "10",
          "theme": "fusion"
        },
        "categories": [
          {
            "category": graph_data2

          }
        ],
        "dataset": [
          {
            "seriesname": "Assigned",
            "data": value1
          },
          {
            "seriesname": "Completed",
            "data": value2
          }
        ]
      }
    }


  }
  insurance_table_data_count: number = 0;
  status_data_count: number = 0;
  assoc_data_count: number = 0;

  assign_table_values(data: any) {
    //  console.log("Asign",data.insurance);
    if (data.insurance.ins_data != undefined && data.insurance.ins_data.length != 0) {

      this.insurance_table_data = data.insurance.ins_data;
      this.insurance_total = data.insurance.total_data;
      this.insurance_per = data.insurance.total_per;
      this.insurance_table_data_count = data.insurance.ins_data.length;
    }
    else if (data.insurance.ins_data == undefined || data.insurance.ins_data.length == 0) {
      this.insurance_table_data_count = 0;
    }
    if (data.status.ins_data != undefined && data.status.ins_data.length != 0) {
      this.status_data = data.status.ins_data;
      this.status_total = data.status.total_data;
      this.status_perc = data.status.total_per;
      this.status_data_count = data.status.ins_data.length;
    }
    else if (data.status.ins_data == undefined || data.status.ins_data.length == 0) {
      this.status_data_count = 0;
    }
    if (data.associate.ins_data != undefined && data.associate.ins_data != 0) {
      this.assoc_data = data.associate.ins_data;
      this.assoc_total = data.associate.total_data;
      this.assoc_perc = data.associate.total_per;
      this.assoc_data_count = data.associate.ins_data.length;
    }
    else if (data.associate.ins_data == undefined || data.associate.ins_data == 0) {
      this.assoc_data_count = 0;
    }


    // console.log("I/p",data);
  }
  detailed_claims: any = [];
  public get_detailed(data: any) {
    this.detailed_claims = [];
    this.week_count = [];
    this.assoc_target_data = [];
    this.assoc_ach_data = [];

    this.Jarwis.fork_user_month_det(this.setus.getId(), data.assoc_id).subscribe(
      data => {
        this.set_detailed(data[0]),
          this.weekly_data(data[1])
      }
    );


    // console.log(data);
    // this.detailed_claims=[];
    // this.Jarwis.get_detailed(data.assoc_id).subscribe(
    //   data  => this.set_detailed(data),
    //   error => this.handleError(error)
    // );
  }



  public set_detailed(data: any) {
    // this.detailed_claims=[];
    //console.log("Detailed",data.claims);

    this.detailed_claims = data.claims;

  }

  week_count = [];
  assoc_target_data = [];
  assoc_ach_data = [];
  weekly_data(data: any) {
    //console.log(data);
    this.week_count = data.weeks;
    this.assoc_ach_data = data.ach_per;
    this.assoc_target_data = data.target;
  }

  user_name: any;
  ngOnInit() {
    // this.auth.tokenValue.next(true);
    console.log("YESSSSSSSSSSSSSSSSS");
    // pageChange(1,'claim','null','null','null','null','null','null')
    // this.Jarwis.get_table_page(1, 'claim', 'null', 'null', 'null', 'null', 'null', 'null').subscribe((data: any) => {
    //   console.log('New ARRAY', data);
    //   this.GridData_CreateWorkOrders = data.data;
    // })

    // this.getclaims();

    this.getSearchResults();
    this.user_role_maintainer();
    this.formValidators();
    this.claimValidators();
    // this.pageChange(1, 'all', null, null, null, null, null, null); // removed...
    // this.formGroup = new FormGroup({
    //   report_date: new FormControl('', [
    //     Validators.required
    //   ]),
    //   file: new FormControl('', [
    //     Validators.required
    //   ]) ,
    //   notes: new FormControl('', [
    //     Validators.required
    //   ])
    // });

    this.reimport_formGroup = this.formBuilder.group({
      report_date: ['', Validators.required],
      file: ['', Validators.required],
      notes: ['', Validators.required]
    });

    this.closedClaimsFind = this.formBuilder.group({
      dos: [null],
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
      date: [null],
      status_code: [],
      sub_status_code: [],
      payer_name: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
    });


    this.createClaimsFind = this.formBuilder.group({
      file_id: [],
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
      date: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
      bill_submit_date: [],
      denial_code: []
    });

    /* this.reallocateClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter:[],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      responsibility: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      rendering_provider:[],
      payer_name:[],
      date:[],
      bill_submit_date: [],
      denial_code: []
    }); */

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


    this.reassignedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      responsibility: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      rendering_provider: [],
      date: [],
      status_code: [],
      sub_status_code: [],
      payer_name: [],
    });

    this.workOrderFind = this.formBuilder.group({
      created_at: [null],
      due_date: [null],
      work_order_name: [],
      priority: [],
    });

    this.changeExecutive = this.formBuilder.group({
      user_id: [null, Validators.required],

      new_user_id: [null],

      audit_status_claims: [null],
    });

    this.processNotes = new FormGroup({
      processnotes: new FormControl('', [
        Validators.required
      ])
    });

    this.claimNotes = new FormGroup({
      claim_notes: new FormControl('', [
        Validators.required
      ])
    });


    this.qcNotes = new FormGroup({
      qc_notes: new FormControl('', [
        Validators.required
      ]),
      root_cause: new FormControl('', [
        Validators.required
      ]),
      error_type: new FormControl('', [
        Validators.required
      ])
    });

    this.autoclose_claim = this.formBuilder.group({
      file: ['', Validators.required]
    });

    this.workOrder = new FormGroup({
      workorder_name: new FormControl('', [
        Validators.required
      ]),
      due_date: new FormControl('', [
        Validators.required
      ]),
      priority: new FormControl('', [
        Validators.required
      ]),
      wo_notes: new FormControl('', [
        Validators.required
      ])
    });
    // this.workOrder = new FormGroup({
    //   workorder_name: new FormControl('', [
    // Validators.required
    // ]),
    // due_date: new FormControl('', [
    //   Validators.required
    // ]),
    // priority: new FormControl('', [
    //   Validators.required
    // ]),
    // wo_notes: new FormControl('', [
    //   Validators.required
    // ])
    // });
    console.log(this.age_options);


    const debouncetime = pipe(debounceTime(700));
    // this.search_data.valueChanges.pipe(debouncetime)
    //   .subscribe(result => {
    //     console.log('RESULT', result);
    //     this.sort_data(result)
    //   });

    // this.wo_search_data.valueChanges.pipe(debouncetime)
    //   .subscribe(result => this.sort_wo_data(result)
    //   );

    // this.filter_option.valueChanges
    //   .subscribe(result => this.sort_table(result)
    //   );
    // this.fetch_count();
    this.subscription = this.notify_service.fetch_touch_limit().subscribe(message => {
      this.touch_count = message
    });
    this.user_name = this.setus.getname();
    console.log('User_Name', this.user_name);

    //this.get_graph_stats();
    this.file_count();

  }

  user_role: any;
  class_change: any = [];
  class_change_tab: any = [];
  user_role_maintainer() {
    let role_id = Number(this.setus.get_role_id());
    console.log(role_id);
    if (role_id == 5 || role_id == 3 || role_id == 2) {
      this.user_role = 2;
      this.class_change['tab1'] = 'active';
      this.class_change_tab['tab2'] = 'tab-pane active';
    }
    else if (role_id == 1) {
      this.user_role = 1;
    }
    else if (role_id == 16) {
      this.user_role = 16;
      // this.class_change['tab1'] = '';
      this.class_change['tab2'] = 'active';
      this.class_change_tab['tab1'] = 'tab-pane active';
      // this.class_change_tab['tab2'] = 'tab-pane';
      this.Jarwis.all_claim_list_new('null').subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );
    }
    else if (role_id == 11) {
      this.user_role = 16;
    }
  }

  file_count() {
    this.Jarwis.get_file_ready_count().subscribe(res => {
      this.handlesuccess(res);
    },
      error => this.notify(error)
    )
  }

  get f() { return this.formGroup.controls; }
  get auto_cc() { return this.autoclose_claim.controls; }
  get rf() { return this.reimport_formGroup.controls; }

  formValidators() {
    this.formGroup = this.formBuilder.group({
      report_date: ['', Validators.required],
      file: ['', Validators.required],
      notes: ['', Validators.required]
    });
  }
  get fe() { return this.workOrder.controls; }

  claimValidators() {
    this.workOrder = this.formBuilder.group({
      workorder_name: ['', Validators.required],
      due_date: ['', Validators.required],
      priority: ['', Validators.required],
      wo_notes: ['', Validators.required]
    });
  }
  onSubmit() {
    this.submitted = true;
    if (this.formGroup.invalid) {
      console.log('Error');
      return;
    }
  }
  onClaimSubmit() {
    this.submitted = true;
    // if (this.modalform.invalid) {
    //   console.log('Error');
    //   return;
    // }

    // this.processdata();
  }

  ngAfterViewInit() {
    this.get_initial_values();
    if (this.touch_count == undefined) {
      this.touch_count = this.notify_service.manual_touch_limit();
      console.log('touch_count', this.touch_count);
    }

    console.log('LAST IN CLAIM COMP');

    // this.auth.tokenValue.next(true);
    console.log('Token Value in Claims',this.auth.tokenValue.value);
    // let data = localStorage.getItem('token');
    // this.auth.login(data);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

  get_initial_values() {
    this.initial_allclaim_filter = this.allClaimsFind.value;
    this.initial_create_filter = this.createClaimsFind.value;
    this.initial_closed_filter = this.closedClaimsFind.value;
    this.initial_wo_filter = this.workOrderFind.value;
    console.log(this.initial_allclaim_filter);
    console.log(this.initial_create_filter);
    console.log(this.initial_closed_filter);
    console.log(this.initial_wo_filter);
  }


  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
    this.observalble.unsubscribe();
  }


  public sort_details(type: any) {

    if (this.sortByAsc == true) {
      this.sortByAsc = false;

      this.Jarwis.claims_order_list(type, this.setus.getId(), this.sortByAsc).subscribe(
        data => this.orderListResponse(data),
        error => this.notify(error)
      );

    } else {
      this.sortByAsc = true;

      this.Jarwis.claims_order_list(type, this.setus.getId(), this.sortByAsc).subscribe(
        data => this.orderListResponse(data),
        error => this.notify(error)
      );

    }


  }

  public orderListResponse(data: any) {

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

  /* public reallocate_status_code_changed(event:any)
  {
    if(event.value!=undefined)
    {
      let sub_status=this.sub_status_codes_data[event.value.id];
      let sub_status_option=[];
      console.log('sub_status_option');
      if(sub_status == undefined || sub_status =='' )
      {
        this.sub_options=[];
        this.reallocateClaimsFind.patchValue({
          sub_status_code: ''
        });
      }
      else {
        for(let i=0;i<sub_status.length;i++)
        {
          if(sub_status[i]['status']==1)
          {
            sub_status_option.push({id: sub_status[i]['id'], description: sub_status[i]['status_code'] +'-'+ sub_status[i]['description'] });
          }
          this.sub_options=sub_status_option;
          if(this.sub_options.length !=0)
          {
            this.reallocateClaimsFind.patchValue({
              sub_status_code: {id:this.sub_options[0]['id'],description:this.sub_options[0]['description']}
            });
          }
          else{
            this.reallocateClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  } */

  public closedClaims_status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status: any = this.sub_status_codes_data[event.value.id];
      let sub_status_option: any = [];
      console.log(sub_status);
      console.log(sub_status_option);
      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.closedClaimsFind.patchValue({
          sub_status_code: ''
        });
      }
      else {
        for (let i = 0; i < sub_status.length; i++) {
          if (sub_status[i]['status'] == 1) {
            sub_status_option.push({ id: sub_status[i]['id'], description: sub_status[i]['status_code'] + '-' + sub_status[i]['description'] });
          }
          this.sub_options = sub_status_option;
          console.log(this.sub_options);
          if (this.sub_options.length != 0) {
            this.closedClaimsFind.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.closedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  public reassignedClaims_status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status: any = this.sub_status_codes_data[event.value.id];
      let sub_status_option: any = [];
      console.log('sub_status_option');
      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.reassignedClaimsFind.patchValue({
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
            this.reassignedClaimsFind.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.reassignedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  public sort_claims(type: any) {
    if (type == 'acct_no') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.acct_no.localeCompare(b.acct_no));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.acct_no.localeCompare(a.acct_no));
      }
    }
    if (type == 'claim_no') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.claim_no.localeCompare(b.claim_no));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.claim_no.localeCompare(a.claim_no));
      }
    }
    if (type == 'patient_name') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.patient_name.localeCompare(b.patient_name));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.patient_name.localeCompare(a.patient_name));
      }
    }
    if (type == 'dos_date') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.dos.localeCompare(b.dos));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.dos.localeCompare(a.dos));
      }
    }
    if (type == 'prim_ins_name') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.prim_ins_name.localeCompare(b.prim_ins_name));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.prim_ins_name.localeCompare(a.prim_ins_name));
      }
    }
    if (type == 'total_charges') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.total_charges.localeCompare(b.total_charges));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.total_charges.localeCompare(a.total_charges));
      }
    }
    if (type == 'total_ar') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.total_ar.localeCompare(b.total_ar));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.total_ar.localeCompare(a.total_ar));
      }
    }
    if (type == 'claim_Status') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a: any, b: any) => a.claim_Status.localeCompare(b.claim_Status));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a: any, b: any) => b.claim_Status.localeCompare(a.claim_Status));
      }
    }
  }
  // tooltipOptions= {
  //   'placement': 'right',
  //   'show-delay': '200',
  //   'tooltip-class': 'new-tooltip-class',
  //   'background-color': '#9ad9e4'
  //   };

  getSearchResults(): void {
    this.Jarwis.get_payer_name().subscribe((sr: any) => {
      this.searchResults = sr['payer_names'];
    });
  }
  searchFromArray(arr: any, regex: any) {
    let matches = [], i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i].match(regex)) {
        matches.push(arr[i]);
      }
    }
    return matches;
  };
  //For CWO
  searchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.selected_val = null;
      this.isValueSelected = false;
    }
  }
  onselectvalue(value: any) {
    if (value != '' || value != null) {
      this.isValueSelected = true;
      this.selected_val = value;
    }
    else {
      this.selected_val = null;
      this.isValueSelected = false;
    }
  }

  //For ReAssignedClaim
  reassignedSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.reassigned_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.reassign_selected_val = null;
      this.reassignSelected = false;
    }
  }
  reassignedSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.reassignSelected = true;
      this.reassign_selected_val = value;
    }
    else {
      this.reassign_selected_val = null;
      this.reassignSelected = false;
    }
  }

  //For ClosedClaim
  closedSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.closed_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.closed_selected_val = null;
      this.closedSelected = false;
    }
  }
  closedSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.closedSelected = true;
      this.closed_selected_val = value;
    }
    else {
      this.closed_selected_val = null;
      this.closedSelected = false;
    }
  }

  //For AllClaim
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

  reimport_template() {
    this.Jarwis.reimport_template().subscribe((response: any) => {
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      FileSaver.saveAs(blob, 'reimport_template.xlsx');
    });
  }
  reimport_pageChange(page: any) {
    this.reimport_page = page;
  }
  //For ReallocateClaim
  /* reallocateclaimSearchOnKeyUp(event) {
    let input = event.target.value;
    if (input.length > 0) {
      this.reallocate_results = this.searchFromArray(this.searchResults, input);
    }
    else{
      this.reallocate_selected_val = null;
      this.reallocateSelected = false;
    }
  }
  reallocateclaimSelectvalue(value) {
    if(value !='' || value !=null){
      this.reallocateSelected = true;
    this.reallocate_selected_val = value;
    }
    else{
      this.reallocate_selected_val = null;
      this.reallocateSelected = false;
    }
  } */

  get_userlist() {
    this.Jarwis.getExecutiveList().subscribe((response: any) => {
      this.getUserList = response['user_list'];
    });
  }

  forms() {
    return this.changeExecutive.controls;
  }

  move_create_work_order() {
    this.submitUser = true;
    // stop here if form is invalid
    if (this.changeExecutive.invalid) {
      return;
    }
    console.log(this.changeExecutive.value);

    let user_id = this.changeExecutive.value.user_id;
    let audit_status_claims = this.changeExecutive.value.audit_status_claims;
    let new_user_id = this.changeExecutive.value.new_user_id;
    this.formdata.append('user_id', user_id);
    this.formdata.append('new_user_id', new_user_id);
    this.formdata.append('audit_status_claims', audit_status_claims);
    this.formdata.append('practice_dbid', localStorage.getItem('practice_id')!);
    this.Jarwis.move_create_work_orders(this.formdata).subscribe(
      (message: any) => {
        let data = message['reimport_msg'];
        if (message['status'] == 200) {
          this.notifysuccess(data);
        } else if (message['status'] == 204) {
          this.toastr.errorToastr(data);
        }
        this.changeExecutive.reset();
        this.userEnabled = false;
        this.auditClaimsEnabled = false;
      },
      error => this.notification(error)
    );
  }

  notification(error: any) {
    this.toastr.errorToastr('Error Change Executive.');
  }


  onSelectedOptionChange() {
    this.dependentUserOptions = [];
    this.checkAuditClaims = [];
    this.formdata.append('selected_u_id', this.selectedUserId);
    // this.formdata.append('audit_claims_check_box', this.checkboxAuditClaims);
    this.formdata.append('practice_dbid', localStorage.getItem('practice_id')!);

    //  EDITED.............
    // Make API call to retrieve dependent options
    // this.Jarwis.getReassignedUsers(this.formdata).subscribe(
    //   (userIds: any) => {
    //     this.dependentUserOptions = userIds['status'];
    //     if (userIds['status'] == 200) {
    //       this.userEnabled = true;
    //     } else {
    //       this.userEnabled = false;
    //     }

    //   },
    //   (error: any) => {
    //     console.error('Error retrieving dependent options:', error);
    //   }
    // );
    // this.Jarwis.audit_claims_found_user(this.formdata).subscribe(
    //   (claimId: any) => {
    //     this.checkAuditClaims = claimId['status'];
    //     console.log(claimId['status']);
    //     if (claimId['status'] == 200) {
    //       this.auditClaimsEnabled = true;
    //     } else {
    //       this.auditClaimsEnabled = false;
    //     }
    //   },
    //   (error: any) => {
    //     console.error('Error retrieving check box options:', error);
    //   }
    // );
  }

  public gridApi_1!: GridApi;
  public gridApi_2!: GridApi;
  public gridApi_3!: GridApi;
  public gridApi_4!: GridApi;
  public gridApi_5!: GridApi;
  public gridApi_6!: GridApi;





  cellrendered(headerName: any, params: any) {
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
      case 'prim_ins_name': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'sec_ins_name': {
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
        if (params.value) {
          let rowData = params.node.data;
          let assignedTo = rowData.dos;
          if (assignedTo == '11/30/1899') {
            return `${'01/01/1970'}`
          }
          else {
            let x = params.value;
            x = this.datePipe.transform(x, 'MM/dd/yyyy');
            return `${x}`;
          }
        }
        else {
          return '-Nil-';
        }

      }
      case 'claim_note': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'created_at': {
        let x: any;
        x = params.value.substring(0, 10);
        x = this.datePipe.transform(x, 'MM/dd/yyyy');
        x != null ? x : 'UA'
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo == null ? 'UA' : assignedTo} | ${x}`;
      }
    }
  }

  cellrendered_2(headername: any, params: any) {

    switch (headername) {
      case 'created': {
        let rowData = params.node.data;
        let assignedTo = rowData.created_at;
        assignedTo = assignedTo.substring(0, 10);
        assignedTo = this.datePipe.transform(assignedTo, 'MM/dd/yyyy')
        return ` ${params.value.charAt(0).toUpperCase() + params.value.slice(1)} | ${assignedTo}`;
      }
      case 'work_order_name': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'assigned_nos': {
        if (params.value) {
          return params.value
        }
        else
          return '-Nil-';
      }
      case 'due_date': {
        if (params.value) {
          let x: any;
          x = this.datePipe.transform(params.value, 'MM/dd/yyyy');
          return `${x}`;
        }
        else
          return '-Nil-';
      }
      case 'billed': {
        if (params.value)
          return params.value.toFixed(2);
        else
          return '-Nil-';
      }
      case 'ar_due': {
        if (params.value)
          return params.value.toFixed(2);
        else
          return '-Nil-';
      }
      case 'status': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'status': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'priority': {
        if (params.value) {
          if (params.value == 'low') {
            return `<i class="fa fa-arrow-down"
          title="Low"></i>`
          }
          if (params.value == 'medium') {
            return `<i class="fa fa-align-justify"
          title="Medium"></i>`
          }
          if (params.value == 'high') {
            return `<i class="fa fa-arrow-up"
          title="High"></i>`
          }
        }
        else {
          return '-Nil-';
        }
        break;
      }
      case 'work_notes': {
        return `<i title="${params.value}"
      class="fa fa-file-text"></i>`
      }
    }

  }

  cellrendered3(headerName: any, params: any) {
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
          return params.value;
        else
          return '-Nil-';
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

      case 'claim_note': {
        if (params.value == null || params.value)
          return `<i class="fa fa-info-circle" aria-hidden="true"
          title="${params.value}"></i>`
        else
          return '-Nil-';
      }
      case 'created_ats': {
        let x: any;
        x = this.datePipe.transform(x, 'MM/dd/yyyy');
        x != null ? x : 'UA'
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo == null ? 'UA' : assignedTo} | ${x == null ? 'UA' : x}`;
      }
    }
  }

  cellrendered4(headerName: any, params: any) {
    switch (headerName) {
      case 'date': {
        if (params.value) {
          return  params.value;
        }
        else
          return '-Nil-';
      }
      case 'file_name': {
        if (params.value) {
          return params.value;
        }
        else
          return '-Nil-';
      }
      case 'claims': {
        if (params.value) {
            return params.value;
          }
        else {
          return '-Nil-';
        }
      }
      case 'newclaims': {
        if (params.value)
            return params.value;
        else
          return '-Nil-';
      }
      case 'uploaded': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'notes': {
        return `<i title="${params.value}"
      class="fa fa-file-text  cur-pointer"></i>`
      }
      case 'download': {
      return `<i class="fa fa-download cur-pointer" style="color:#337ab7;width:20px;height:30px"
      title="Download File">`;
      }
      case 'delete': {
      return `<i class="fa fa-trash cur-pointer" style="color:#337ab7;width:20px;height:30px"
      title="Delete File"></i>`;
      }
      case 'settings': {
       return `<i class="fa fa-cog cur-pointer" style="color:#337ab7;width:20px;height:30px"
       title="Process File"></i>`;
      }
    }
  }

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


  rowValue_ID_1: any;
  rowValue_ID_2: any;
  rowValue_ID_3: any;
  rowValue_ID_4:any;
  rowValue_ID_5:any;
  rowValue_ID_6:any;
  selectedRowsFirstPage: any;
  currentPageData: any = [];
  resl_dta: any = [];
  selectedRows: any = [];
  cdtn: boolean = false;
  onSelectionChanged(event: any) {

    this.cdtn = !this.cdtn;

    console.log(this.cdtn);


    // const currentPage = params.api.paginationGetCurrentPage();
    this.currentPageData = [];
    this.selected_claim_nos = [];
    this.rowValue_ID_1 = this.gridApi_1.getSelectedRows();
    const selectedNodes = this.gridApi_1.getSelectedNodes();
    console.log('ID1', this.rowValue_ID_1);
    if (this.rowValue_ID_1 != '') {
      for (let i = 0; i < this.rowValue_ID_1.length; i++) {
        this.selected_claim_nos.push(this.rowValue_ID_1?.[i].claim_no);
      }
    }


    // this.selectedRows = selectedNodes.map(node => node.data);

    // const selectedRowCount = selectedNodes.length;
    // console.log('selectedRowCount',selectedRowCount);

    // if (selectedRowCount > 15) {
    //   // Deselect rows beyond the first 15
    //   selectedNodes.slice(15).forEach(node => node.setSelected(false));
    // }
    //  else if (selectedRowCount < 15) {
    //   // Select remaining rows within the first 15
    //   this.gridApi_1.forEachNode((node: any, index: number) => {
    //     if (index >= 15) {
    //       node.setSelected(false);
    //     }
    //   });
    // }


    // const currentPage = params.api.paginationGetCurrentPage();
    // const pageSize = params.api.paginationGetPageSize();
    // const startIndex = currentPage * pageSize;
    // const endIndex = startIndex + pageSize;
    // console.log(startIndex,endIndex);

    // params.api.forEachNodeAfterFilterAndSort((node: any) =>{
    //   this.currentPageData.push(node.data);
    // });

    // this.resl_dta = this.GridData_CreateWorkOrders.slice(startIndex,endIndex);
    // console.log('currentPageData',this.resl_dta);
  }

  onSelectionChanged_WorkOrders(params: any) {
    this.rowValue_ID_2 = this.gridApi_2.getSelectedRows();
    console.log('ID2', this.rowValue_ID_2);
  }

  onSelectionChanged_ClosedClaims(params:any){
    this.rowValue_ID_3 = this.gridApi_3.getSelectedRows();
    console.log('ID3', this.rowValue_ID_3);
  }
  onSelectionChanged_import(params:any){
    this.rowValue_ID_4 = this.gridApi_4.getSelectedRows();
    console.log('ID4', this.rowValue_ID_4);
  }
  onSelectionChanged_reImport(params:any){
    this.rowValue_ID_5 = this.gridApi_5.getSelectedRows();
    console.log('ID5', this.rowValue_ID_5);
  }
  onSelectionChanged_allClaims(params:any){
    this.rowValue_ID_6 = this.gridApi_6.getSelectedRows();
    console.log('ID6', this.rowValue_ID_6);
  }


  public defaultColDef: ColDef = {
    editable: false,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    sortable: true,
    resizable: false,
  };


  columnDefs1: ColDef[] = [
    {
      field: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 20,
    },
    {
      field:'touch',
      headerName: '',
      sortable: true, // Set the `sortable` property to a boolean value
      width: 45,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'touch'),

    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width: 90,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width: 100,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'dos'),
      onCellClicked: this.CellClicked.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 65,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'age'),
      onCellClicked: this.CellClicked.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 85,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      width: 208,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 164,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'rendering_prov'),
      onCellClicked: this.CellClicked.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 128,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'responsibility'),
      onCellClicked: this.CellClicked.bind(this, 'responsibility')
    },
    {
      field: 'prim_ins_name',
      headerName: 'Primary',
      sortable: true,
      width: 220,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'prim_ins_name'),
      onCellClicked: this.CellClicked.bind(this, 'prim_ins_name')
    },
    {
      field: 'sec_ins_name',
      headerName: 'Secondary',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'sec_ins_name'),
      onCellClicked: this.CellClicked.bind(this, 'sec_ins_name')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width: 123,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'total_charges'),
      onCellClicked: this.CellClicked.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 107,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'total_ar'),
      onCellClicked: this.CellClicked.bind(this, 'total_ar')
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 118,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_Status'),
      onCellClicked: this.CellClicked.bind(this, 'claim_Status')
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'denial_code'),
      onCellClicked: this.CellClicked.bind(this, 'denial_code')
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width: 125,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'billed_submit_date'),
      onCellClicked: this.CellClicked.bind(this, 'billed_submit_date')
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_note'),
      onCellClicked: this.CellClicked.bind(this, 'claim_note')
    },
    {
      field: 'created_at',
      headerName: 'Assigned To|Date',
      sortable: true,
      width: 140,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered.bind(this, 'created_at',),
      onCellClicked: this.CellClicked.bind(this, 'created_at')
    },

  ];

  columnDefs2: ColDef[] = [
    {
      field: 'created',
      headerName: 'Created | Date',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered_2.bind(this, 'created'),
      onCellClicked: this.CellClicked_2.bind(this, 'created'),
      headerClass: 'no-header-border',
    },
    {
      field: 'work_order_name',
      headerName: 'Work Order Name',
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important' };
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_2.bind(this, 'work_order_name'),
      onCellClicked: this.CellClicked_2.bind(this, 'work_order_name'),
      headerClass: 'no-header-border',
    },
    {
      field: 'assigned_nos',
      headerName: 'Claim Count',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered_2.bind(this, 'assigned_nos'),
      onCellClicked: this.CellClicked_2.bind(this, 'assigned_nos'),
      headerClass: 'no-header-border',
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered_2.bind(this, 'due_date'),
      onCellClicked: this.CellClicked_2.bind(this, 'due_date'),
      headerClass: 'no-header-border',
    },
    {
      field: 'billed',
      headerName: 'Billed',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered_2.bind(this, 'billed'),
      onCellClicked: this.CellClicked_2.bind(this, 'billed'),
      headerClass: 'no-header-border',
    },
    {
      field: 'ar_due',
      headerName: 'AR Due',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important' };
      },
      cellRenderer: this.cellrendered_2.bind(this, 'ar_due'),
      onCellClicked: this.CellClicked_2.bind(this, 'ar_due'),
      headerClass: 'no-header-border',
    },
    {
      field: 'status',
      headerName: 'WO Status',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important' };
      },
      cellRenderer: this.cellrendered_2.bind(this, 'status'),
      onCellClicked: this.CellClicked_2.bind(this, 'status'),
      headerClass: 'no-header-border',
    },
    {
      field: 'priority',
      headerName: 'Priority',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important' };
      },
      cellRenderer: this.cellrendered_2.bind(this, 'priority'),
      onCellClicked: this.CellClicked_2.bind(this, 'priority'),
      headerClass: 'no-header-border',
    },
    {
      field: 'work_notes',
      headerName: 'Wo Notes',
      sortable: true, // Set the `sortable` property to a boolean value
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
        'font-weight': '500',  'font-family': 'sans-serif',
        'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered_2.bind(this, 'work_notes'),
      onCellClicked: this.CellClicked_2.bind(this, 'work_notes'),
      headerClass: 'no-header-border',
    },
  ]

  columnDefs3: ColDef[] = [
    {
      field:'touch',
      headerName: '',
      sortable: true, // Set the `sortable` property to a boolean value
      width: 45,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered.bind(this, 'touch'),

    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked3.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'dos'),
      // onCellClicked: this.CellClicked3.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'age'),
      // onCellClicked: this.CellClicked3.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked3.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked3.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'rendering_prov'),
      // onCellClicked: this.CellClicked3.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'responsibility'),
      // onCellClicked: this.CellClicked3.bind(this, 'responsibility')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'total_charges'),
      // onCellClicked: this.CellClicked3.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'total_ar'),
      // onCellClicked: this.CellClicked3.bind(this, 'total_ar')
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'claim_note'),
      // onCellClicked: this.CellClicked3.bind(this, 'claim_note')
    },
    {
      field: 'created_ats',
      headerName: 'Assigned To|Date',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered3.bind(this, 'created_ats',),
      // onCellClicked: this.CellClicked3.bind(this, 'created_at')
    },

  ];

  columnDefs4: ColDef[] = [
    {
      field:'date',
      headerName: 'Date',
      width:250,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered4.bind(this, 'date'),

    },
    {
      field: 'file_name',
      headerName: 'File Name',
      width:500,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered4.bind(this, 'file_name'),
    },
    {
      field: 'claims',
      headerName: 'Claims',
      sortable: true,
      width:160,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'claims'),
    },
    {
      field: 'newclaims',
      headerName: 'New Claims',
      sortable: true,
      width:160,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'newclaims'),
    },
    {
      field: 'uploaded',
      headerName: 'Uploaded By',
      sortable: true,
      width:160,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'uploaded'),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'notes'),
    },

    {
      field: 'download',
      headerName: '',
      sortable: true,
      width:20,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'download'),
      onCellClicked: this.CellClicked4.bind(this, 'download')
    },
    {
      field: 'delete',
      headerName: '',
      sortable: true,
      width:20,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'delete'),
      onCellClicked: this.CellClicked4.bind(this, 'delete')
    },
    {
      field: 'settings',
      headerName: '',
      sortable: true,
      width:20,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'settings'),
      onCellClicked: this.CellClicked4.bind(this, 'settings')
    },
  ];

  columnDefs5: ColDef[] = [

    {
      field:'date',
      headerName: 'Date',
      width:250,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered4.bind(this, 'date'),

    },
    {
      field: 'file_name',
      headerName: 'File Name',
      width:500,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered4.bind(this, 'file_name'),
    },
    {
      field: 'claims',
      headerName: 'Claims',
      sortable: true,
      width:210,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'claims'),
    },
    {
      field: 'uploaded',
      headerName: 'Uploaded By',
      sortable: true,
      width:210,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'uploaded'),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      sortable: true,
      width:210,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered4.bind(this, 'notes'),
    },
  ];

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
      width: 100,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '15px !important'};
      },
      cellRenderer: this.cellrendered6.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked5.bind(this, 'claim_no')
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
      onCellClicked: this.CellClicked5.bind(this, 'dos')
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
      onCellClicked: this.CellClicked5.bind(this, 'age')
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
      onCellClicked: this.CellClicked5.bind(this, 'acct_no')
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
      onCellClicked: this.CellClicked5.bind(this, 'patient_name')
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



  gridOptions1: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 30,
    suppressHorizontalScroll: false,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };

  gridOptions4: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 40 ,
    suppressHorizontalScroll: true,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };

  gridOptions2: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };
  gridOptions3: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };
  gridOptions5: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 37,
    suppressHorizontalScroll: true,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };
  gridOptions6: GridOptions<gridData> = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 30,
    suppressHorizontalScroll: true,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: 15,
    // getRowStyle: params => {
    //   return { 'font-size': '11px', 'font-weight': '500' };
    // }
  };


  search_values_for_create_work: any;
  search_values_for_work_orders: any;
  search_values_for_closed_claims:any;
  search_values_for_all_claims:any;
  isCollapsed_CreateWorkOrders: boolean = true;
  isCollapsed_WorkOrdes:boolean = true;
  isCollapsed_ClosedClaims:boolean = true;
  isCollapsed_AllClaims : boolean = true;


  onGridReady_1(params: GridReadyEvent) {
    this.gridApi_1 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_CreateWorkOrders);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
    // }, 4000);
  }
  onGridReady_2(params: GridReadyEvent) {
    this.gridApi_2 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_WorkOrders);
    //   this.myGrid_2.api?.setRowData(this.GridData_WorkOrders);
    // }, 4000);
  }
  onGridReady_3(params: GridReadyEvent) {
    this.gridApi_3 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_WorkOrders);
    //   this.myGrid_2.api?.setRowData(this.GridData_WorkOrders);
    // }, 4000);
  }
  onGridReady_4(params: GridReadyEvent) {
    this.gridApi_4 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_CreateWorkOrders);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
    // }, 4000);
  }
  onGridReady_5(params: GridReadyEvent) {
    this.gridApi_5 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_CreateWorkOrders);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
    // }, 4000);
  }
  onGridReady_6(params: GridReadyEvent) {
    this.gridApi_6 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    // setTimeout(() => {
    //   console.log('444', this.GridData_CreateWorkOrders);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridData_CreateWorkOrders);
    // }, 4000);
  }


  @ViewChild('template') template!: TemplateRef<any>;
  @ViewChild('new_workorder') new_workorder!: ModalDirective;
  @ViewChild('work_order_details') work_order_details!: TemplateRef<any>;
  @ViewChild('closedclaimpage') closedclaimpage!: TemplateRef<any>;
  @ViewChild('associates') associates!: TemplateRef<any>;
  @ViewChild('associates_error') associates_error!: TemplateRef<any>;
  @ViewChild('page1') page1!: TemplateRef<any>;
  @ViewChild('page2') page2!: TemplateRef<any>;
  @ViewChild('newclaimmod') newclaimmod!: TemplateRef<any>;
  @ViewChild('duplicatemodel') duplicatemodel!: TemplateRef<any>;
  @ViewChild('mismatchmodel') mismatchmodel!: TemplateRef<any>;
  @ViewChild('claimpage') claimpage!: TemplateRef<any>;

  @ViewChild('myGrid_1') myGrid_1!: AgGridAngular;
  @ViewChild('myGrid_2') myGrid_2!: AgGridAngular;
  @ViewChild('myGrid_3') myGrid_3!: AgGridAngular;
  @ViewChild('myGrid_4') myGrid_4!: AgGridAngular;
  @ViewChild('myGrid_5') myGrid_5!: AgGridAngular;
  @ViewChild('myGrid_6') myGrid_6!: AgGridAngular;


  modalRef?: BsModalRef ;
  modalRef2?: BsModalRef;
  modalRef3?: BsModalRef;
  modalRef4?: BsModalRef;
  minDate = new Date();
  bsRangeValue!: Date[];
  maxDate = new Date();


  config: any = {
    backdrop: true,
    animated: true,
    keyboard: true,
    containerClass: 'theme-default'
  };



  bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true  });

  openModal(model_name: TemplateRef<any>) {

    console.log('IN');
    this.modalRef = this.modal.show(model_name, this.config);
  }

  openModal2(model_name: TemplateRef<any>) {

    console.log('IN');
    this.modalRef2 = this.modal.show(model_name, this.config);
  }

  openModal3(model_name: TemplateRef<any>) {

    console.log('IN');
    this.modalRef3 = this.modal.show(model_name, this.config);
  }

  openModal4(model_name: TemplateRef<any>) {

    console.log('IN');
    this.modalRef4 = this.modal.show(model_name, this.config);
  }


  CellClicked(headerName: any, params: any): any {
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'dos': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'age': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'acct_no': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'patient_name': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'rendering_prov': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'responsibility': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'prim_ins_name': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'sec_ins_name': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'total_charges': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'claim_Status': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'denial_code': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'billed_submit_date': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'claim_note': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'assigned_to': {
          this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
      }
    }
  }

  CellClicked_2(headerName: any, params: any): any {
    switch(headerName){
      case 'created': {
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'work_order_name':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'assigned_nos':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'due_date':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'billed':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'ar_due':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'status':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'priority':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }
      case 'work_notes':{
        this.openModal(this.work_order_details);
        this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
        break;
      }

    }
  }

  CellClicked3(headerName: any, params: any): any {
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.closedclaimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.reload_data(1);
          break;
        }
        case 'acct_no': {
          this.openModal(this.closedclaimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.reload_data(1);
          break;
        }
        case 'patient_name': {
          this.openModal(this.closedclaimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.reload_data(1);
          break;
        }

      }
    }
  }

  CellClicked4(headerName: any, params: any):any{
    switch (headerName) {
      case 'download': {
       this.getfile(this.rowValue_ID_4?.[0].path,this.rowValue_ID_4?.[0].file_name);
        break;
      }
      case 'delete': {
        this.delete_file(this.rowValue_ID_4?.[0].path);
        break;
      }
      case 'settings': {
       this.process_uld_file(this.rowValue_ID_4?.[0].path);
       this.openModal(this.page2);
        break;
      }
    }
  }

  CellClicked5(headerName: any, params: any):any{
    switch(headerName){
      case 'claim_no':{
        this.openModal(this.claimpage);
        this.claimslection(this.rowValue_ID_6?.[0]);
        break;
      }
      case 'dos':{
        this.openModal(this.claimpage);
        this.claimslection(this.rowValue_ID_6?.[0]);
        break;
      }
      case 'age':{
        this.openModal(this.claimpage);
        this.claimslection(this.rowValue_ID_6?.[0]);
        break;
      }
      case 'acct_no':{
        this.openModal(this.claimpage);
        this.claimslection(this.rowValue_ID_6?.[0]);
        break;
      }
      case 'patient_name':{
        this.openModal(this.claimpage);
        this.claimslection(this.rowValue_ID_6?.[0]);
        break;
      }
    }

  }
  onSearch() {
    this.myGrid_1.api?.setQuickFilter(this.search_values_for_create_work);
    this.myGrid_2.api?.setQuickFilter(this.search_values_for_work_orders);
    this.myGrid_3.api?.setQuickFilter(this.search_values_for_closed_claims);
    this.myGrid_6.api?.setQuickFilter(this.search_values_for_all_claims);
  }


  closeModal(modalId?: number){
    this.modal.hide(modalId);
  }

}
