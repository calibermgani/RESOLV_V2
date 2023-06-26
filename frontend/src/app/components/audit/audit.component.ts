import { Component, ViewChildren, ElementRef, QueryList, OnInit, ChangeDetectionStrategy, ViewEncapsulation, OnDestroy, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { FollowupService } from '../../Services/followup.service';
import { NotesHandlerService } from '../../Services/notes-handler.service';
import { Subscription } from 'rxjs';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ExportFunctionsService } from '../../Services/export-functions.service';
import { NotifyService } from '../../Services/notify.service';
import { debounceTime } from 'rxjs/operators';
import { pipe } from 'rxjs';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AuthService } from 'src/app/Services/auth.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AuditComponent implements OnInit, OnDestroy, AfterViewInit {

  createWork = "";
  assigned = "";
  closedWork = "";
  associateCount: any = '';

  mySelect = '';
  // ErrType:[] = [];
  selectedValue: any = {};
  selectedError: any;
  parentId: any;

  assigned_results: any[] = [];
  reassigned_results: any[] = [];
  closed_results: any[] = [];
  auditQueue_results: any[] = [];
  searchResults: Array<any> = [];
  assignedSelected: boolean = false;
  assigned_selected_val: any = null;
  reassignedSelected: boolean = false;
  reassigned_selected_val: any = null;
  closedSelected: boolean = false;
  closed_selected_val: any = null;
  auditQueueSelected: boolean = false;
  auditQueue_selected_val: any = null;

  @ViewChildren("checkboxes") checkboxes!: QueryList<ElementRef>;

  public status_codes_data: Array<any> = [];
  public sub_status_codes_data: any[] = [];
  public status_options: any;
  public sub_options: any;
  selected_err_codes: any;
  selecteds: any;
  select_date: any = null;
  assigned_select_date: any;
  closed_select_date: any;
  selectedAudit: any = null;
  selectedReAssigin: any;
  selectedAssigin: any;
  selectedClosed: any;
  selectedDueDate: any = null;
  selectedCreatedAt: any = null;
  alwaysShowCalendars: boolean;
  realloc_pages: number = 0;
  selectedAge = null;
  auditselectedAge = null;
  closedselectedAge = null;
  assigned_submit_date: any;
  audit_submit_date: any = null;
  closed_submit_date: any;
  reassigned_submit_date: any;
  age_options: any = [{ "from_age": 0, "to_age": 30 }, { "from_age": 31, "to_age": 60 }, { "from_age": 61, "to_age": 90 }, { "from_age": 91, "to_age": 120 }, { "from_age": 121, "to_age": 180 }, { "from_age": 181, "to_age": 365 }];
  decimal_pattern = "^\[0-9]+(\.[0-9][0-9])\-\[0-9]+(\.[0-9][0-9])?$";

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


  response_data: Subscription;
  observalble: Subscription;
  update_monitor: Subscription;
  isopend = true;
  subscription !: Subscription;
  sub_err_subscription !: Subscription;

  constructor(private Jarwis: JarwisService,
    private formBuilder: FormBuilder,
    private setus: SetUserService,
    private loadingBar: LoadingBarService,
    private modalService: NgbModal,
    private follow: FollowupService,
    private notes_hadler: NotesHandlerService,
    public toastr: ToastrManager,
    private export_handler: ExportFunctionsService,
    private notify_service: NotifyService,
    private datepipe: DatePipe,
    private modal: BsModalService,
    private auth : AuthService,
    public loader: NgxUiLoaderService
  ) {
    this.observalble = this.setus.update_edit_perm().subscribe(message => { this.check_edit_permission(message) });
    this.response_data = this.notes_hadler.get_response_data('audit').subscribe((message: any) => { this.collect_response(message) });
    this.update_monitor = this.notes_hadler.refresh_update().subscribe(message => {
      this.getclaim_details(this.pages, 'refresh', 'null', 'null', 'null', 'null', null, null, null, null, null);
      console.log(this.update_monitor);
    });
    this.alwaysShowCalendars = true;
  }

  public root_cause_list: any = [];
  public err_type_list: any = [];
  public audit_codes_list: any;
  public root_stats: any;
  public err_stats: any;

  public error_codes_list: any;
  public error_param_list: any = [];
  public fyi_param_list: any = [];
  public err_param_stats: any;
  public fyi_param_stats: any;

  public error_sub_codes_list: any;
  public error_sub_param_list: any = [];
  public fyi_sub_param_list: any = [];
  public err_sub_param_stats: any;

  public editnote_value = null;
  formdata = new FormData();
  processNotes!: FormGroup;
  search_data: FormControl = new FormControl();
  wo_search_data: FormControl = new FormControl();
  filter_option: FormControl = new FormControl();

  claimNotes!: FormGroup;
  qcNotes!: FormGroup;
  workOrder!: FormGroup;
  auditClaimsFind!: FormGroup;
  assignedClaimsFind!: FormGroup;
  closedClaimsFind!: FormGroup;
  workOrderFind!: FormGroup;

  qc_notes_data: Array<any> = [];
  qc_notes_data_list: Array<any> = [];
  tab_load: boolean = false;
  sortByAsc: boolean = true;
  claim_active: any;
  //Error Handling
  handleError(error: any) {
    console.log(error);
  }

  //Work Order Tab Functions*****
  table_fields: any = [];
  table_datas: any[] = [];
  claim_clicked: any = [];
  claim_related: any = [];
  process_notes: any = [];
  claim_notes: any = [];
  qc_notes: any = [];
  client_notes: any = [];
  closeResult: string = '';
  total_claims: number = 0;
  pages: number = 0;
  loading: boolean = false;

  completed_claims: any = [];
  total_completed_claims: number = 0;
  comp_pages: number = 0;


  allocated_claims: any[] = [];
  total_allocated: number = 0;
  alloc_pages: number = 0;
  current_claim_type: string = '';
  sorting_name: any;


  order_list(type: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    console.log(sorting_name);
    this.sorting_name = sort_type;

    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    } else {
      this.sortByAsc = true;
      this.getclaim_details(this.pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    }

  }

  assigned_sorting_name: any;
  assigned_order_list(type: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    this.assigned_sorting_name = sort_type;

    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.alloc_pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    } else {
      this.sortByAsc = true;
      this.getclaim_details(this.alloc_pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    }

  }

  closed_sorting_name: any;
  closed_order_list(type: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {

    this.closed_sorting_name = sort_type;
    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.comp_pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    } else {
      this.sortByAsc = true;
      this.getclaim_details(this.comp_pages, type, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, null, null, search);
    }
  }

  auditclaims_filter: any;
  public audit_claims_filter(page: any, type: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    this.auditclaims_filter = search;
    console.log(this.auditclaims_filter);
    this.getclaim_details(page, type, sort_data, sort_type, sorting_name, sorting_method, assign_claim_searh, reassign_claim_searh, closed_claim_searh, audit_claim_search, search);
  }

  assignedclaims_filter: any;
  public assigned_claims_filter(page: any, type: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    this.assignedclaims_filter = search;
    console.log(this.assignedclaims_filter);
    this.getclaim_details(page, type, sort_data, sort_type, sorting_name, sorting_method, assign_claim_searh, reassign_claim_searh, closed_claim_searh, audit_claim_search, search);
  }

  closedclaims_filter: any;
  public closed_claims_filter(page: any, type: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, searchdata: any) {
    this.closedclaims_filter = searchdata;
    console.log(this.closedclaims_filter);
    console.log(type);
    this.getclaim_details(page, type, sort_data, sort_type, sorting_name, sorting_method, assign_claim_searh, reassign_claim_searh, closed_claim_searh, audit_claim_search, searchdata);
  }


  //Get Claim Details to Display
  type: any;
  search: any;
  public getclaim_details(page: number, type: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    this.loader.start();
    this.search = search;
    console.log(assign_claim_searh);
    let page_count = 15;
    let form_type: any = null;
    let searchs = this.search;

    console.log(this.type);

    this.type = type;

    if (type == 'wo') {
      console.log(searchs);
      this.pages = page;
      this.current_claim_type = 'wo';

      let auditSearch_notNull: any = [];
      let nullVal: boolean = false;
      let auditClaims_searchValue: any = [this.auditClaimsFind.value];
      if (typeof auditClaims_searchValue === 'object' && auditClaims_searchValue !== null) {
        Object.keys(auditClaims_searchValue).forEach(key => {
          if (typeof auditClaims_searchValue[key] === 'object' && auditClaims_searchValue[key] !== null) {
            Object.keys(auditClaims_searchValue[key]).forEach(val => {
              if (typeof auditClaims_searchValue[key][val] === 'object' && auditClaims_searchValue[key][val] !== null) {
                Object.keys(auditClaims_searchValue[key][val]).forEach(data => {
                  if (auditClaims_searchValue[key][val][data] === null) {
                    nullVal = false;
                  }
                  else {
                    nullVal = true;
                  }
                });
                auditSearch_notNull.push(nullVal);
              }
              else if (typeof auditClaims_searchValue[key][val] !== 'object' && auditClaims_searchValue[key][val] !== null && auditClaims_searchValue[key][val] != '') {
                nullVal = true;
                auditSearch_notNull.push(nullVal);
              }
              else if (typeof auditClaims_searchValue[key][val] !== 'object' && auditClaims_searchValue[key][val] !== null && auditClaims_searchValue[key][val] == '') {
                nullVal = false;
                auditSearch_notNull.push(nullVal);
              }
            });
          }
        });
      }
      if (auditSearch_notNull.some((x: any) => x === true)) {
        this.search = this.auditclaims_filter;
        search = this.search;
        sort_data = null;
        sort_type = null;
        sorting_name = 'null';
        sorting_method = 'null';
      }
      else {
        this.search = null;
        sort_data = 'null';
        sort_type = 'null';
        sorting_name = 'null';
        sorting_method = 'null';
        search = this.search;
      }
      searchs = this.search;

      if (sorting_name == 'null' && searchs != 'search') {
        this.search = search;
        // this.Jarwis.get_audit_table_page(sort_data, page, page_count, sort_type, sorting_name, sorting_method, null, null, null, null, search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );

        this.Jarwis.get_audit_table_page_new(null, null, null, null, search).subscribe(
          data => this.assign_page_data(data),
          error => this.handleError(error)
        );
      } else if (searchs == 'search') {
        console.log(this.auditClaimsFind.value);
        console.log(this.sorting_name);

        if (this.auditClaimsFind.value.dos?.[0] != null && this.auditClaimsFind.value.dos?.[1] != null) {
          console.log(this.auditClaimsFind.controls['dos'].value);
          this.auditClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.dos.pop(this.auditClaimsFind.value.dos[0]);
          this.auditClaimsFind.value.dos.pop(this.auditClaimsFind.value.dos[1]);
          const obj = { ... this.auditClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.auditClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.auditClaimsFind.value.dos);
        }
        if (this.auditClaimsFind.value.date?.[0] != null && this.auditClaimsFind.value.date?.[1] != null) {
          console.log(this.auditClaimsFind.controls['date'].value);
          this.auditClaimsFind.value.date.startDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.date.pop(this.auditClaimsFind.value.date[0]);
          this.auditClaimsFind.value.date.pop(this.auditClaimsFind.value.date[1]);
          const obj = { ... this.auditClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.auditClaimsFind.value.date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.auditClaimsFind.value.date);
        }
        if (this.auditClaimsFind.value.bill_submit_date?.[0] != null && this.auditClaimsFind.value.bill_submit_date?.[1] != null) {
          this.auditClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.auditClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
          this.auditClaimsFind.value.bill_submit_date.pop(this.auditClaimsFind.value.bill_submit_date[0]);
          this.auditClaimsFind.value.bill_submit_date.pop(this.auditClaimsFind.value.bill_submit_date[1]);
          const obj = { ... this.auditClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.auditClaimsFind.value.bill_submit_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.auditClaimsFind.value.bill_submit_date);
        }
        // this.Jarwis.get_audit_table_page(sort_data, page, page_count, sort_type, this.sorting_name, this.sortByAsc, null, null, null, this.auditClaimsFind.value, this.search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_table_page_new(null, null, null, this.auditClaimsFind.value, this.search).subscribe(
          data => this.assign_page_data(data),
          error => this.handleError(error)
        );
      } else {
        this.search = search;
        // this.Jarwis.get_audit_table_page(sort_data, page, page_count, sort_type, this.sorting_name, this.sortByAsc, null, null, null, null, this.search).subscribe(
        //   data => this.assign_page_data(data),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_table_page_new(null, null, null, null, this.search).subscribe(
          data => this.assign_page_data(data),
          error => this.handleError(error)
        );
      }
    }
    else if (type == 'completed') {
      this.search = search;
      console.log(searchs);
      this.comp_pages = page;
      this.current_claim_type = 'completed';

      let closedSearch_notNull: any = [];
      let nullVal: boolean = false;
      let closedClaims_searchValue: any = [this.closedClaimsFind.value];
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
        sort_data = 'null';
        sort_type = 'null';
        sorting_name = 'null';
        sorting_method = 'null';
        search = this.search;
      }
      searchs = this.search;

      if (sorting_name == 'null' && searchs != 'search') {
        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, sorting_name, sorting_method, null, null, null, null, search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type,  null, null, null, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
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
        if (this.closedClaimsFind.value.date?.[0] != null && this.closedClaimsFind.value.date?.[1] != null) {
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
        if (this.closedClaimsFind.value.bill_submit_date?.[0] != null && this.closedClaimsFind.value.bill_submit_date?.[1] != null) {
          this.closedClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.closedClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
          this.closedClaimsFind.value.bill_submit_date.pop(this.closedClaimsFind.value.bill_submit_date[0]);
          this.closedClaimsFind.value.bill_submit_date.pop(this.closedClaimsFind.value.bill_submit_date[1]);
          const obj = { ... this.closedClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.closedClaimsFind.value.bill_submit_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.closedClaimsFind.value.bill_submit_date);
        }

        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, this.closed_sorting_name, this.sortByAsc, null, null, this.closedClaimsFind.value, null, this.search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type,null,null, this.closedClaimsFind.value, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
        );
      } else {
        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, this.closed_sorting_name, this.sortByAsc, null, null, null, null, this.search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type,  null, null, null, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
        );
      }
    }
    else if (type == 'allocated') {
      this.search = search;
      console.log(searchs);
      this.alloc_pages = page;
      this.current_claim_type = 'allocated';

      let assignedSearch_notNull: any = [];
      let nullVal: boolean = false;
      let assignedClaims_searchValue: any = [this.assignedClaimsFind.value];
      if (typeof assignedClaims_searchValue === 'object' && assignedClaims_searchValue !== null) {
        Object.keys(assignedClaims_searchValue).forEach(key => {
          if (typeof assignedClaims_searchValue[key] === 'object' && assignedClaims_searchValue[key] !== null) {
            Object.keys(assignedClaims_searchValue[key]).forEach(val => {
              if (typeof assignedClaims_searchValue[key][val] === 'object' && assignedClaims_searchValue[key][val] !== null) {
                Object.keys(assignedClaims_searchValue[key][val]).forEach(data => {
                  if (assignedClaims_searchValue[key][val][data] === null) {
                    nullVal = false;
                  }
                  else {
                    nullVal = true;
                  }
                });
                assignedSearch_notNull.push(nullVal);
              }
              else if (typeof assignedClaims_searchValue[key][val] !== 'object' && assignedClaims_searchValue[key][val] !== null && assignedClaims_searchValue[key][val] != '') {
                nullVal = true;
                assignedSearch_notNull.push(nullVal);
              }
              else if (typeof assignedClaims_searchValue[key][val] !== 'object' && assignedClaims_searchValue[key][val] !== null && assignedClaims_searchValue[key][val] == '') {
                nullVal = false;
                assignedSearch_notNull.push(nullVal);
              }
            });
          }
        });
      }
      if (assignedSearch_notNull.some((x: any) => x === true)) {
        this.search = this.assignedclaims_filter;
        search = this.search;
        sort_data = null;
        sort_type = null;
      }
      else {
        this.search = null;
        sort_data = 'null';
        sort_type = 'null';
        sorting_name = 'null';
        sorting_method = 'null';
        search = this.search;
      }

      searchs = this.search;

      if (sorting_name == 'null' && searchs != 'search') {
        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, sorting_name, sorting_method, null, null, null, null, search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type,  null, null, null, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
        );
      } else if (searchs == 'search') {
        console.log(this.assigned_sorting_name);

        if (this.assignedClaimsFind.value.dos?.[0] != null && this.assignedClaimsFind.value.dos?.[1] != null) {
          console.log(this.assignedClaimsFind.controls['dos'].value);
          this.assignedClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.dos.pop(this.assignedClaimsFind.value.dos[0]);
          this.assignedClaimsFind.value.dos.pop(this.assignedClaimsFind.value.dos[1]);
          const obj = { ... this.assignedClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.assignedClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.assignedClaimsFind.value.dos);
        }
        if (this.assignedClaimsFind.value.date?.[0] != null && this.assignedClaimsFind.value.date?.[1] != null) {
          console.log(this.assignedClaimsFind.controls['date'].value);
          this.assignedClaimsFind.value.date.startDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.date.pop(this.assignedClaimsFind.value.date[0]);
          this.assignedClaimsFind.value.date.pop(this.assignedClaimsFind.value.date[1]);
          const obj = { ... this.assignedClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.assignedClaimsFind.value.date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.assignedClaimsFind.value.date);
        }
        if (this.assignedClaimsFind.value.bill_submit_date?.[0] != null && this.assignedClaimsFind.value.bill_submit_date?.[1] != null) {
          this.assignedClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.assignedClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
          this.assignedClaimsFind.value.bill_submit_date.pop(this.assignedClaimsFind.value.bill_submit_date[0]);
          this.assignedClaimsFind.value.bill_submit_date.pop(this.assignedClaimsFind.value.bill_submit_date[1]);
          const obj = { ... this.assignedClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.assignedClaimsFind.value.bill_submit_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.assignedClaimsFind.value.bill_submit_date);
        }

        console.log('target');
        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, this.assigned_sorting_name, this.sortByAsc, this.assignedClaimsFind.value, null, null, null, this.search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type, this.assignedClaimsFind.value,null, null, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
        );
      } else {
        // this.Jarwis.get_audit_claim_details(this.setus.getId(), page, page_count, type, sort_data, sort_type, this.assigned_sorting_name, this.sortByAsc, null, null, null, null, this.search).subscribe(
        //   data => this.form_table(data, type, form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_audit_claim_details_new(this.setus.getId(),type,  null, null, null, null).subscribe(
          data => this.form_table(data, type, form_type),
          error => this.handleError(error)
        );
      }
    }
    else if (type == 'refresh') {

      if (type == 'refresh') {
        type = this.current_claim_type;
        form_type = 'refresh';

        if (type == 'wo') {
          page = this.pages;

        }
        else if (type == 'completed') {
          page = this.comp_pages;
        }
        else if (type == 'allocated') {
          page = this.alloc_pages;

          console.log(page);
        }

      }
    }

    this.tab_load = true;
    // this.Jarwis.get_audit_claim_details(this.setus.getId(),page,page_count,'allocated').subscribe(
    //   data  => this.form_table(data,type,form_type),
    //   error => this.handleError(error)
    // );
  }

  selected_filter_type = [];
  //set filter type
  public claim_filter_type($event: any) {
    this.selected_filter_type = $event.target.value;

    this.claim_sort_filter();
  }


  //sort with filter
  public claim_sort_filter() {
    this.getclaim_details(1, 'all', null, null, null, null, null, null, null, null, null)
  }

  current_total: any;
  skip: any;
  total_row: any;
  skip_row: any;
  current_row: any;
  total: any;

  total_claims_closed: any;
  current_totals: any;
  skips: any;
  total_rows: any;
  skip_rows: any;
  current_rows: any;
  totals: any;
  audit_claim_data: any = [];
  //Assign Table data and `total values
  public assign_page_data(data: any) {
    if (data) {
      this.GridrowData1 = data.data;
      console.log('GridData', this.GridrowData1);
      this.myGrid_1.api?.setRowData(this.GridrowData1);
      this.loader.stop();
    }
    if(data)
    {this.table_datas = data.data;
      this.audit_claim_data = data.audit_claim_data;
      this.total = data.total;

      this.totals = data.total;
      this.current_totals = data.current_total;
      this.skips = data.skip + 1;}


    this.skip_rows = this.skips;
    this.current_rows = this.skips + this.current_totals - 1;
    this.total_rows = this.total;

  }
  searchData: string = '';
  //Search filter function
  public sort_data(data: any) {
    this.getclaim_details(1, 'wo', data, 'searchFilter', 'null', 'null', null, null, null, null, null);
    this.searchData = data;
    //To reset the checklist
    this.check_all[1] = false;
    this.selected_claim_nos = [];

    //console.log(this.searchData);
  }

  public sort_wo_data(data: any) {
    // console.log(data);
    if (data == '') {
      this.get_workorder(null, null, null, 2, 1, null, null, null, null, null, null, null);
    }
    else {
      this.get_workorder('search', data, 0, 2, 1, null, null, null, null, null, null, null);
    }

  }
  public sort_table(data: any) {
    this.getclaim_details(1, 'wo', data, 'filters', 'null', 'null', null, null, null, null, null);
  }
  //Work Order table Formation

  wo_page_number: number = 1;
  work_order_data: any[] = [];
  wo_sorting_name: any[] = [];

  work_order_list(sort_type: any, sorting_name: any, sorting_method: any, search: any) {

    this.wo_sorting_name = sort_type;

    if (this.sortByAsc == true) {
      this.sortByAsc = false;
      this.get_workorder(null, null, null, 1, this.w_pages, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, search);
    } else {
      this.sortByAsc = true;
      this.get_workorder(null, null, null, 1, this.w_pages, this.sortByAsc, sort_type, sorting_name, sorting_method, null, null, search);
    }
  }

  workorder_search(filter: any, from: any, to: any, type: any, page: any, sort_type: any, sort_data: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, search: any) {
    this.search = search;
    console.log(this.search);
    this.get_workorder(filter, from, to, type, page, sort_type, this.sortByAsc, sorting_name, sorting_method, null, this.workOrderFind.value, search);
  }

  w_pages: any;

  public get_workorder(filter: any, from: any, to: any, type: any, page: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, closedsearch: any, workordersearch: any, search: any) {
    this.loader.start();
    let page_count = 15;
    this.tab_load = true;


    if (filter == null && from == null && to == null) {

      let searchs = this.search;

      this.w_pages = page;

      if (sorting_name == 'null' && searchs != 'search') {
        // this.Jarwis.get_workorder(0, 0, 0, 2, page, sort_type, sort_data, sorting_name, sorting_method, closedsearch, workordersearch, search).subscribe(
        //   data => this.form_wo_table(data, page),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_workorder_new(0,  2, page,closedsearch, workordersearch).subscribe(
          data => this.form_wo_table(data, page),
          error => this.handleError(error)
        );
      } else if (searchs == 'search') {
        if (this.workOrderFind.value.created_at?.[0] != null && this.workOrderFind.value.created_at?.[1] != null) {
          console.log(this.workOrderFind.value.created_at);
          this.workOrderFind.value.created_at['startDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.created_at?.[0]), 'yyyy-MM-dd');
          this.workOrderFind.value.created_at['endDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.created_at?.[1]), 'yyyy-MM-dd');
          this.workOrderFind.value.created_at.pop(this.workOrderFind.value.created_at[0]);
          this.workOrderFind.value.created_at.pop(this.workOrderFind.value.created_at[1]);
          const obj = { ... this.workOrderFind.controls['created_at'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.workOrderFind.value.created_at = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.workOrderFind.value.created_at);
        }
        if (this.workOrderFind.value.due_date?.[0] != null && this.workOrderFind.value.due_date?.[1] != null) {
          console.log(this.workOrderFind.controls['due_date'].value);
          this.workOrderFind.value.due_date['startDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.due_date?.[0]), 'yyyy-MM-dd');
          this.workOrderFind.value.due_date['endDate'] = this.datepipe.transform(new Date(this.workOrderFind.value.due_date?.[1]), 'yyyy-MM-dd');
          this.workOrderFind.value.due_date.pop(this.workOrderFind.value.due_date[0]);
          this.workOrderFind.value.due_date.pop(this.workOrderFind.value.due_date[1]);
          const obj = { ... this.workOrderFind.controls['due_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.workOrderFind.value.due_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.workOrderFind.value.due_date);
        }
        // this.Jarwis.get_workorder(0, 0, 0, 2, page, sort_type, sort_data, this.wo_sorting_name, this.sortByAsc, null, this.workOrderFind.value, this.search).subscribe(
        //   data => this.form_wo_table(data, page),
        //   error => this.error_handler(error)
        // );
        this.Jarwis.get_workorder_new(0,  2, page, null, this.workOrderFind.value,).subscribe(
          data => this.form_wo_table(data, page),
          error => this.handleError(error)
        );
      } else {
        // this.Jarwis.get_workorder(0, 0, 0, 2, page, sort_type, sort_data, this.wo_sorting_name, this.sortByAsc, null, workordersearch, this.search).subscribe(
        //   data => this.form_wo_table(data, page),
        //   error => this.handleError(error)
        // );
        this.Jarwis.get_workorder_new(0,  2, page,closedsearch, workordersearch).subscribe(
          data => this.form_wo_table(data, page),
          error => this.handleError(error)
        );
      }

    }
    else if (filter == 'search') {
      this.Jarwis.get_workorder(filter, from, 0, 2, page, sort_data, sort_type, sorting_name, sorting_method, null, null, null).subscribe(
        data => this.form_wo_table(data, page),
        error => this.handleError(error)
      )
    }

  }
  assigned_claim_data: any;
  closed_claim_data: any;
  //Form Claim Table
  public form_table(data: any, type: any, form_type: any) {
    //console.log("fom_datav ",data,type,form_type);
    if (form_type == null) {
      if (type == "wo") {
        this.table_fields = data.data.fields;
        this.table_datas = data.data.datas;
        this.total_claims = data.count;

        // this.total=data.total;
        // this.current_total= data.current_total - 1;
        // this.skip = data.skip;

        // this.skip_row = this.skip;
        // this.current_row = this.skip + this.current_total;
        // this.total_row = data.count;
      }
      else if (type == 'allocated') {
        // console.log(data);
        if(data){
          this.allocated_claims = data.data.datas;
          this.assigned_claim_data = data.selected_claim_data;
        this.total_allocated = data.count;
        this.total_row = data.count;

        this.current_total = data.current_total;
        this.skip = data.skip + 1;
        }
        if(this.allocated_claims)
        {
          this.GridrowData3 = this.allocated_claims;
          console.log('GridrowData3',this.GridrowData3);
          this.myGrid_3.api.setRowData(this.GridrowData3);
          this.loader.stop();
        }


        this.skip_row = this.skip;
        this.current_row = this.skip + this.current_total - 1;

        console.log(this.allocated_claims);
        this.sortallocated();
      }
      else if (type == 'completed') {
        if(data){
          this.completed_claims = data.data.datas;
          this.closed_claim_data = data.selected_claim_data;
          this.total_completed_claims = data.count;
          //this.total=data.total;
          this.current_total = data.current_total;
          this.skip = data.skip + 1;
          this.total_row = data.count;
        }

        if(this.completed_claims)
        {
          this.GridrowData4 = this.completed_claims;
          console.log('GridrowData3',this.GridrowData4);
          this.myGrid_4.api.setRowData(this.GridrowData4);
          this.loader.stop();
        }


        this.skip_row = this.skip;
        this.current_row = this.skip + this.current_total - 1;

      }

    }
    else if (form_type == 'refresh') {
      let new_claim;

      if (type == "wo") {
        this.table_fields = data.data.fields;
        this.table_datas = data.data.datas;
        this.total_claims = data.count;
        if (this.claim_active != undefined) {
          new_claim = this.table_datas.find((x: any) => x.claim_no == this.claim_active['claim_no']);
        }

      }
      else if (type == 'allocated') {
        // console.log(data);
        this.allocated_claims = data.data.datas;
        this.total_allocated = data.count;
        if (this.claim_active != undefined) {
          new_claim = this.allocated_claims.find((x: any) => x.claim_no == this.claim_active['claim_no']);
        }
      }
      else if (type == 'completed') {
        this.completed_claims = data.data.datas;
        this.total_completed_claims = data.count;
        if (this.claim_active != undefined) {
          new_claim = this.completed_claims.find((x: any) => x.claim_no == this.claim_active['claim_no']);
        }
      }
      if (this.claim_active != undefined) {
        if (this.main_tab == true) {
          this.getnotes(this.claim_active);

          this.claimslection(new_claim);
        }
        else {
          this.Jarwis.getnotes(this.claim_active).subscribe(
            (data: any) => {
              let prcs_data = { data: data['data']['process'] };
              let refer_data = { data: data['data']['claim'] };
              let qc_data = { data: data['data']['qc'] };
              this.update_refer_notes(prcs_data, 'processnotes', this.claim_active.claim_no);
              this.update_refer_notes(refer_data, 'claimnotes', this.claim_active.claim_no);
              this.update_refer_notes(qc_data, 'qcnotes', this.claim_active.claim_no);
            },
            error => this.handleError(error)
          );

          // console.log("Goos sdhfb",this.refer_claim_notes,this.refer_process_notes,this.refer_qc_notes,this.refer_client_notes);

          this.referclaim(this.claim_active);
        }
      }
      this.tab_load = false;
    }

  }

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
    // console.log("Here",claim);
    this.claim_no = claim.claim_no;
    this.get_line_items(claim);
    this.check_reassign_alloc(claim);
    //Clear Previous Claims
    this.clear_refer();
    this.claim_clicked = claim;
    console.log(this.claim_clicked);
    let length = this.table_datas.length;
    this.claim_related = [];
    this.get_related(claim);
    // for(let i=0;i<this.table_datas.length;i++)
    // {
    //   let related_length=this.claim_related.length;
    //   length= length-1;
    //   if(related_length<3)
    //   {
    //     if(this.table_datas[length]['acct_no'] == claim.acct_no && this.table_datas[length]['claim_no'] != claim.claim_no )
    //     {
    //     this.claim_related.push(this.table_datas[length]);
    //     }
    //   }
    // }
    this.send_calim_det('footer_data');
    this.loading = true;
    this.getnotes(this.claim_clicked);
    // this.process_notes_delete(this.claim_no);
  }


  get_related(claim: any) {
    this.Jarwis.get_related_calims(claim, 'followup', this.setus.getId()).subscribe(
      data => this.list_related(data),
      error => this.handleError(error)
    );
  }

  list_related(claims: any) {
    this.claim_related = claims.data;
    //console.log(this.claim_related);
  }

  //Refer Claim Clicked Action
  refer_claim_det: Array<any> = [];
  refer_claim_no: any = [];
  refer_claim_notes: any = [];
  refer_process_notes: any = [];
  refer_qc_notes: any = [];
  main_tab: boolean = true;
  active_tab = [];
  active_refer_claim: any = [];
  active_refer_process: any = [];
  active_refer_qc: any = [];
  active_claim: any = [];
  refer_claim_notes_nos: any = [];
  refer_process_notes_nos: any = [];
  refer_qc_notes_nos: any = [];
  refer_client_notes_nos: any = [];
  refer_client_notes: any = [];
  active_refer_client: any = [];
  refer_claim_editable = 'false';
  claim_status: any;
  claim_nos: any;

  //Refer Claim
  public referclaim(claim: any) {

    // (claim.editable == false) ? (this.refer_claim_editable = false) : (this.refer_claim_editable = true);
    claim = claim.claim;

    this.claim_nos = claim.claim_no;

    console.log(this.type);

    this.claim_status = claim.claim_Status;
    this.Jarwis.get_audit_claimno(this.claim_nos, this.setus.getId(), this.claim_status, this.type).subscribe(
      data => this.handleClaimNo(data),
      error => this.handleError(error)
    );


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
    this.send_calim_det('footer_data');
  }


  assigned_datas: any;

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
    this.send_calim_det('footer_data');
  }

  //Update Notes in Related Claims
  public update_refer_notes(data: any, type: any, claimno: any) {
    let index_up_qc = this.refer_qc_notes_nos.indexOf(claimno);
    let index_up_process = this.refer_process_notes_nos.indexOf(claimno);
    let index_up_claim = this.refer_claim_notes_nos.indexOf(claimno);
    if (type == 'processnotes') {
      if (index_up_process == undefined) {
        this.refer_process_notes_nos.push(claimno);
        this.refer_process_notes.push(data.data);
        index_up_process = this.refer_process_notes_nos.indexOf(claimno);
      }
      else {
        this.refer_process_notes[index_up_process] = data.data;
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
      this.active_claim = claimno;
    }
    this.send_calim_det('footer_data');
  }

  //Close Refer Tab
  public close_tab(claim_no: any) {
    let index = this.refer_claim_det.indexOf(claim_no);
    let list_index = this.refer_claim_no.indexOf(claim_no.claim_no)
    this.refer_claim_det.splice(index, 1);
    this.refer_claim_no.splice(list_index, 1);
    this.main_tab = true;
    this.active_claim = [];
    this.send_calim_det('footer_data');
    this.get_line_items(this.claim_clicked);
    this.check_reassign_alloc(this.claim_clicked);
  }

  //Clear Tabs Details
  public clear_refer() {
    this.main_tab = true;
    this.active_claim = [];
    this.refer_claim_det = [];
    this.refer_claim_no = [];
  }
  submitted = false;
  get f() { return this.processNotes.controls; }
  get v() { return this.qcNotes.controls; }
  get c() { return this.claimNotes.controls; }




  //Update Displayed Notes
  public display_notes(data: any, type: any) {
    console.log(data);
    console.log(type);
    if (this.active_claim != undefined) {
      if (this.active_claim.length != 0) {
        this.update_refer_notes(data, type, this.active_claim)
      }
      else {
        if (type == 'processnotes') {
          this.process_notes = data.data;
        }
        else if (type == 'claimnotes') {
          this.claim_notes = data.data;
        }
        else if (type == 'qcnotes') {
          this.qc_notes = data.data;
        }
        else if (type == 'All') {
          this.process_notes = data.data.process;
          this.claim_notes = data.data.claim;
          this.qc_notes = data.data.qc;
          this.client_notes = data.data.client;
        }
      }
      this.loading = false;
      this.processNotes.reset();
      this.claimNotes.reset();
      this.qcNotes.reset();
    }

  }


  public process_display_notes(data: any, type: any) {
    console.log(data);
    console.log(type);
    if (this.active_claim != undefined) {
      if (this.active_claim.length != 0) {
        this.update_refer_notes(data, type, this.active_claim)
      }
      else {
        if (type == 'processnotes') {
          this.process_notes = data.data;
        }
        else if (type == 'claimnotes') {
          this.claim_notes = data.data;
        }
        else if (type == 'qcnotes') {
          this.qc_notes = data.data;
        }
        else if (type == 'All') {
          this.process_notes = data.data.process;
          this.claim_notes = data.data.claim;
          this.qc_notes = data.data.qc;
          this.client_notes = data.data.client;
        }
      }
      this.loading = false;
      this.processNotes.reset();
      this.claimNotes.reset();
      this.qcNotes.reset();
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

  //Get Status codes from Backend
  public get_statuscodes() {
    this.Jarwis.get_status_codes(this.setus.getId(), 'all').subscribe(
      data => this.process_codes(data)
    );
  }

  public process_codes(data: any) {
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

  public status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status = this.sub_status_codes_data[event.value.id];
      let sub_status_option = [];
      console.log('sub_status_option');
      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.auditClaimsFind.patchValue({
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
            this.auditClaimsFind.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.auditClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  public assign_status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status = this.sub_status_codes_data[event.value.id];
      let sub_status_option = [];
      console.log('sub_status_option');
      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.assignedClaimsFind.patchValue({
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
            this.assignedClaimsFind.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.assignedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  public closed_status_code_changed(event: any) {
    if (event.value != undefined) {
      let sub_status = this.sub_status_codes_data[event.value.id];
      let sub_status_option = [];
      console.log('sub_status_option');
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

  get_audit_codes() {
    this.Jarwis.get_audit_codes(this.setus.getId()).subscribe(
      data => this.assign_audit_codes(data),
      error => this.handleError(error)
    );
  }
  assign_audit_codes(data: any) {
    console.log("hello2")
    console.log(data);
    this.root_stats = data.root_states;
    console.log(this.root_stats);
    this.err_stats = data.err_types;
    console.log(this.err_stats);

    this.audit_codes_list = { root: this.root_stats, error: this.err_stats };

    let root_states = [];
    //console.log(root_states);

    let error_states = [];
    for (let j = 0; j < this.err_stats.length; j++) {
      if (this.err_stats[j]['status'] == '1') {
        error_states.push({ id: this.err_stats[j]['id'], description: this.err_stats[j]['name'] });
      }
    }
    this.err_type_list = error_states;
    console.log(this.err_type_list);

    for (let i = 0; i < this.root_stats.length; i++) {
      if (this.root_stats[i].status == '1') {
        root_states.push({ id: this.root_stats[i]['id'], description: this.root_stats[i]['name'] });
      }
    }
    this.root_cause_list = root_states;
    // console.log("err",this.err_type_list,this.root_cause_list);
    // sub_status_option.push({id: sub_status[i]['id'], description: sub_status[i]['status_code'] +'-'+ sub_status[i]['description'] });
  }

  get_error_param_codes() {
    this.Jarwis.get_error_param_codes(this.setus.getId()).subscribe(
      data => this.assign_error_codes(data),
      error => this.handleError(error)
    );
  }

  assign_error_codes(data: any) {
    console.log(data);
    this.err_param_stats = data.err_param_types;
    this.fyi_param_stats = data.fyi_param_types;

    console.log(this.err_param_stats);

    let error_params = [];
    for (let k = 0; k < this.err_param_stats.length; k++) {
      if (this.err_param_stats[k].status == '1') {
        error_params.push({ id: this.err_param_stats[k]['id'], description: this.err_param_stats[k]['err_params'] });
      }
    }
    console.log(error_params);
    //console.log(error_params['id']);
    this.error_param_list = error_params;

    let fyi_params = [];
    for (let m = 0; m < this.fyi_param_stats.length; m++) {
      if (this.fyi_param_stats[m].status == '1') {

        fyi_params.push({ id: this.fyi_param_stats[m]['id'], description: this.fyi_param_stats[m]['err_params'] });
      }
    }
    console.log(fyi_params);
    this.fyi_param_list = fyi_params;
  }

  get_error_sub_param_codes() {
    this.Jarwis.get_error_sub_param_codes(this.setus.getId(), this.parentId).subscribe(
      data => {
        console.log(data),
          this.assign_sub_error_codes(data)
      },
      error => this.handleError(error)
    );
  }

  assign_sub_error_codes(data: any) {
    console.log(data);
    this.err_sub_param_stats = data.sub_param_datas;

    // let fyi_sub_param_stats = data.fyi_sub_param_types;

    this.error_sub_codes_list = { errorsubparam: this.err_sub_param_stats }

    console.log(this.err_sub_param_stats);

    let error_sub_params = [];
    for (let n = 0; n < this.err_sub_param_stats.length; n++) {
      if (this.err_sub_param_stats[n].status == '1') {
        error_sub_params.push({ id: this.err_sub_param_stats[n]['id'], description: this.err_sub_param_stats[n]['sub_parameter'] });
      }
    }
    console.log(error_sub_params);
    this.error_sub_param_list = error_sub_params;
    return error_sub_params;
  }




  //Edit Notes
  edit_noteid: any;
  initial_edit: boolean = false;
  proess_initial_edit: any;
  public editnotes(type: any, value: any, id: any) {
    if (type == 'qc_notes_init') {
      let qc_data = this.qc_notes_data.find(x => x.id == id['claim_no']);
      console.log(qc_data);
      this.editnote_value = qc_data.notes;
      this.edit_noteid = id;
      this.initial_edit = true;
    } else if (type == 'process_notes_init') {
      let process_data: any = this.process_notes_data.find(x => x.id == id['claim_no']);
      this.editnote_value = process_data.notes;
      this.edit_noteid = id;
      this.proess_initial_edit = true;
    }
    else {
      this.editnote_value = value.content;
      this.edit_noteid = id;
      this.qcNotes.patchValue({
        qc_notes: this.editnote_value
      })

      if (type == 'qcnote') {
        let root_cause = value.root_cause;
        let error_type = value.error_type;
        let error_parameter = value['error_parameter'];
        let error_sub_parameter = value['error_sub_parameter'];
        console.log(error_sub_parameter);
        this.selected_err_codes = value['error_sub_parameter'];

        let root_det: Array<any> = this.root_stats;
        let selecetd_root: any = [];

        if (root_cause != null) {
          root_cause.forEach(function (value: any) {
            let rootkeys = value;
            console.log(rootkeys);
            let rootval = root_det.find(x => x.id == rootkeys['id']);
            selecetd_root.push({ id: rootkeys['id'], description: rootval['name'] });
          });
          this.root_cause_list = selecetd_root;
        }
        else {
          selecetd_root.push({ id: null, description: null });
          this.root_cause_list = selecetd_root;
        }

        // console.log(this.audit_codes_list);
        console.log(this.err_stats);
        let error_det: any[] = this.err_stats;
        let selected_err: Array<any> = [];
        let error_param_det = this.err_param_stats;
        let fyi_param_det = this.fyi_param_stats;

        let keys: any;
        let error: any;


        // console.log("ERR_tyoe",error_type);
        error_type.forEach(function (value: any) {
          keys = value;
          console.log(keys);
          console.log(keys.id);
          console.log(keys['id']);
          console.log(error_det);

          error = error_det.find(x => x.id == keys['id']);
          console.log(error);
          console.log(error['name']);
          //this.selected_err_codes = {id:keys['id'],description:error['name']};
          //console.log(this.selected_err_codes);
          selected_err.push({ id: keys['id'], description: error['name'] });
          console.log(selected_err);
        });
        this.qcNotes.patchValue({
          error_type: { id: keys['id'], description: error['name'] }
        });
        this.selectedError = error['name'];

        //this.err_type_list = this.selecetd_err;
        console.log(error_param_det);
        let selecetd_err_parameter = [];
        let err_param_keys = error_parameter;
        console.log(err_param_keys);
        let error_param = error_param_det.find((x: any) => x.id == err_param_keys);
        console.log(error_param);
        selecetd_err_parameter.push({ id: err_param_keys, description: error_param['err_params'] });
        this.qcNotes.patchValue({
          error_parameter: { id: err_param_keys, description: error_param['err_params'] },
        });
        this.parentId = err_param_keys;


        this.Jarwis.get_error_sub_param_codes(this.setus.getId(), err_param_keys).subscribe(
          data => this.set_sub_err_code(data)
        );

        this.qcNotes.patchValue({
          qc_notes: this.editnote_value,
          root_cause: selecetd_root
        });
      }

      this.initial_edit = false;
    }

  }

  set_sub_err_code(data: any) {
    console.log(data);
    this.err_sub_param_stats = data.sub_param_datas;
    let error_sub_param_det: any = this.err_sub_param_stats;
    console.log(error_sub_param_det);
    let selecetd_err_sub_parameter = [];
    let err_sub_param_keys = this.selected_err_codes;
    console.log(err_sub_param_keys);
    let error_sub_param: any = error_sub_param_det.find((x: any) => x.id == err_sub_param_keys);
    console.log(error_sub_param);
    selecetd_err_sub_parameter.push({ id: err_sub_param_keys, description: error_sub_param['sub_parameter'] });
    this.qcNotes.patchValue({
      error_sub_parameter: { id: err_sub_param_keys, description: error_sub_param['sub_parameter'] },
    });
  }

  rc_et_data: any;

  //Handle Rootcause and Error Type
  public handle_notes_opt() {
    console.log("QC", this.qcNotes.value);

    let error_type = this.qcNotes.value['error_type'];
    let root_cause = this.qcNotes.value['root_cause'];
    let error_parameter = this.qcNotes.value['error_parameter'];
    let error_sub_parameter = this.qcNotes.value['error_sub_parameter'];
    let fyi_parameter = this.qcNotes.value['fyi_parameter'];
    let fyi_sub_parameter = this.qcNotes.value['fyi_sub_parameter'];

    console.log(error_type);
    console.log(error_parameter);
    console.log(error_sub_parameter);
    console.log(fyi_parameter);
    console.log(fyi_sub_parameter);
    console.log(this.selectedError);
    console.log(this.parentId);

    let error_types_ids = [];
    /* error_type.forEach(ertype => {
    let keys = ertype;
    console.log(keys);
    error_types_ids.push(keys.id);
    console.log(error_types_ids);
    }); */
    let keys = error_type;
    console.log(keys);
    error_types_ids.push(keys.id);
    console.log(error_types_ids);

    let error_parameter_ids;
    let error_sub_parameter_ids;
    let fyi_parameter_ids;
    let fyi_sub_parameter_ids;

    if (this.selectedError != "No Error" || this.selectedError != "Clarification") {
      if (error_parameter != null && error_sub_parameter != null) {
        console.log(error_parameter);
        error_parameter_ids = error_parameter.id;
        console.log(error_parameter_ids);

        console.log(error_sub_parameter);
        error_sub_parameter_ids = error_sub_parameter.id;
        console.log(error_sub_parameter_ids);
      }
      else {
        error_parameter_ids = null;
        error_sub_parameter_ids = null;
      }

      if (fyi_parameter != null && fyi_sub_parameter != null) {
        console.log(fyi_parameter);
        fyi_parameter_ids = fyi_parameter.id;
        console.log(fyi_parameter_ids);

        console.log(fyi_parameter);
        fyi_sub_parameter_ids = fyi_sub_parameter.id;
        console.log(fyi_sub_parameter_ids);
      }
      else {
        fyi_parameter_ids = null;
        fyi_sub_parameter_ids = null;
      }
    }
    else {
      error_parameter_ids = null;
      error_sub_parameter_ids = null;
      fyi_parameter_ids = null;
      fyi_sub_parameter_ids = null;
    }
    this.rc_et_data = { root_cause: null, error_types: error_types_ids, error_parameter: error_parameter_ids, error_sub_parameter: error_sub_parameter_ids, fyi_parameter: fyi_parameter_ids, fyi_sub_parameter: fyi_sub_parameter_ids }
  }

  //Save Notes
  public process_notes_data_list: any = [];
  public process_notes_data: Array<any> = [];
  request_monitor: number = 0;

  note_refresh() {
    this.process_notes_data_list = [];
    this.qc_notes_data_list = [];
  }

  public savenotes(type: any) {
    let claim_id = [];
    if (this.active_claim.length != 0) {
      let index = this.refer_claim_no.indexOf(this.active_claim);
      claim_id = this.refer_claim_det[index];
    }
    else {
      claim_id = this.claim_clicked;
      console.log(this.claim_clicked);
    }
    if (type == 'processnotes') {
      this.Jarwis.process_note(this.setus.getId(), this.processNotes.value['processnotes'], claim_id, 'processcreate', 'followup').subscribe(
        data => this.display_notes(data, type),
        error => this.handleError(error)
      );
      // this.request_monitor=0;
      // this.process_notes_data.push({notes:this.processNotes.value['processnotes'],id:claim_id['claim_no']});
      // this.process_notes_data_list.push(claim_id['claim_no']);
      // this.notes_hadler.set_notesest(this.setus.getId(),this.processNotes.value['processnotes'],claim_id,'process_create');
      // this.send_calim_det('footer_data');
    }
    else if (type == 'claimnotes') {
      this.Jarwis.claim_note(this.setus.getId(), this.claimNotes.value['claim_notes'], claim_id, 'claim_create').subscribe(
        data => this.display_notes(data, type),
        error => this.handleError(error)
      );
    }
    else if (type == 'qcnotes') {
      //console.log(this.qcNotes.value['qc_notes']);
      console.log('claaim id  :' + claim_id);

      this.submitted = true;

      this.handle_notes_opt();
      console.log("QC", this.rc_et_data);
      this.qc_notes_data.push({ notes: this.qcNotes.value['qc_notes'], id: claim_id['claim_no'], notes_opt: this.rc_et_data });
      this.qc_notes_data_list.push(claim_id['claim_no']);
      let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };

      // this.Jarwis.qc_note(this.setus.getId(),notes_det,claim_id,'create_qcnotes').subscribe(
      //   data  => this.display_notes(data,type),
      //   error => this.handleError(error)
      //   );

      this.notes_hadler.set_notes(this.setus.getId(), notes_det, claim_id, 'create_qcnotes');
      this.send_calim_det('footer_data');
    }
  }

  //Update Notes
  public updatenotes(type: any) {
    if (this.initial_edit == true) {
      this.handle_notes_opt();
      // console.log("QC",this.rc_et_data);
      let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };
      this.notes_hadler.set_notes(this.setus.getId(), notes_det, this.edit_noteid, 'create_qcnotes');

      // this.qc_notes_data[this.edit_noteid['claim_no']]=this.qcNotes.value['qc_notes'];

      this.qc_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes = this.qcNotes.value['qc_notes'];


      this.initial_edit = false;
      this.send_calim_det('footer_data');
    }
    // else if(this.proess_initial_edit==true){
    //   this.notes_hadler.set_notesest(this.setus.getId(),this.processNotes.value['processnotes'],this.edit_noteid,'claim_create');
    //   this.process_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes=this.processNotes.value['processnotes'];
    //   this.initial_edit=false;
    //   this.send_calim_det('footer_data');
    // }
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
        let claim_id: any = [];
        console.log(this.edit_noteid);

        if (this.main_tab == true) {
          claim_active = this.claim_clicked;
          claim_id = this.claim_clicked;
          console.log(claim_active);
        }
        else {
          claim_active = this.refer_claim_det.find(x => x.claim_no == this.active_claim);
          console.log(claim_active);
          claim_id = this.claim_clicked;
        }
        this.Jarwis.check_edit_val(claim_active, 'audit').subscribe(
          data => {
            this.set_note_edit_validity(data);
            if (this.note_edit_val != undefined) {
              this.handle_notes_opt();
              console.log(this.qcNotes.value['qc_notes']);
              //this.qc_notes_data.push({notes:this.qcNotes.value['qc_notes'],id:claim_active['claim_no'],notes_opt:this.rc_et_data});
              let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };

              this.Jarwis.qc_note(this.setus.getId(), notes_det, claim_id, 'qcupdate').subscribe(
                data => this.display_notes(data, type),
                error => this.handleError(error)
              );
              //this.qc_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes=this.qcNotes.value['qc_notes'];
              this.notes_hadler.set_notes(this.setus.getId(), notes_det, claim_id, 'qcupdate');
              this.send_calim_det('footer_data');
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

  public closedupdatenotes(type: any) {
    if (this.initial_edit == true) {
      this.handle_notes_opt();
      // console.log("QC",this.rc_et_data);
      let notes_det = { notes: this.qcNotes.value['qc_notes'], notes_opt: this.rc_et_data };
      this.notes_hadler.set_notes(this.setus.getId(), notes_det, this.edit_noteid, 'create_qcnotes');
      // this.qc_notes_data[this.edit_noteid['claim_no']]=this.qcNotes.value['qc_notes'];
      this.qc_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes = this.qcNotes.value['qc_notes'];
      this.initial_edit = false;
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
          claim_active = this.refer_claim_det.find(x => x.claim_no == this.active_claim);
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
  //Clear ProcessNote
  public clear_notes() {
    this.editnote_value = null;
    this.processNotes.reset();
  }
  //Open Pop-up
  open(content: any) {
    this.openModal(content);
    this.getDismissReason();
    // this.modalService.open(content, { centered: true, windowClass: 'dark-modal' }).result.then((result) => {
    //   this.closeResult = `${result}`;
    // }, (reason) => {
    //   this.closeResult = `${this.getDismissReason()}`;
    // });
  }
  //Modal Dismiss on Clicking Outside the Modal
  private getDismissReason() {
    this.clear_notes();
  }
  //Send Claim Value to Followup-Template Component on Opening Template
  public send_calim_det(type: any) {
    if (this.main_tab == true) {
      console.log('main');
      if (type == 'followup') {
        this.follow.setvalue(this.claim_clicked['claim_no']);
      }
      else {
        this.notes_hadler.selected_tab(this.claim_clicked['claim_no']);
        this.notes_hadler.set_claim_details(this.claim_clicked);
        this.claim_active = this.claim_clicked;
      }
    }
    else {
      console.log('Not main')
      if (type == 'followup') {
        this.follow.setvalue(this.active_claim);
      }
      else {
        this.notes_hadler.selected_tab(this.active_claim);
        let claim_detials = this.refer_claim_det.find(x => x.claim_no == this.active_claim);
        console.log(claim_detials);
        this.notes_hadler.set_claim_details(claim_detials);
        this.claim_active = claim_detials;
      }
    }
  }

  //Collect Response Forom Footer Component after Claim processing
  public collect_response(data: any) {
    //console.log(data);
    if (this.main_tab == true) {
      this.check_note_edit_validity(this.claim_clicked);
    }
    else {
      let claim_detials = this.refer_claim_det.find(x => x.claim_no == this.active_claim);
      this.check_note_edit_validity(claim_detials);
    }

    // this.check_note_edit_validity(this.active_claim)
    this.display_notes(data, 'qcnotes');
    this.getclaim_details(1, 'allocated', 'null', 'null', 'null', 'null', null, null, null, null, null);
    this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);
    this.getclaim_details(1, 'completed', 'null', 'null', 'null', 'null', null, null, null, null, null);
    let index = this.qc_notes_data_list.indexOf(this.active_claim);
    this.qc_notes_data_list.splice(index, 1);
    // console.log(this.qc_notes_data_list);
    let index1 = this.process_notes_data_list.indexOf(this.active_claim);
    this.process_notes_data_list.splice(index1, 1);
  }

  //Get Auditor details
  auditors_detail: Array<any> = [];
  public get_auditors() {
    this.Jarwis.get_auditors(this.setus.getId()).subscribe(
      data => this.assign_auditors(data),
      error => this.handleError(error)
    );
  }

  //Assign and List auditor details
  public assign_auditors(data: any) {
    //console.log(data);
    this.auditors_detail = data.data;
  }

  //Check All function
  public check_all: Array<any> = [];
  public selected_claims: Array<any> = [];
  public selected_claim_nos: Array<any> = [];
  public check_all_assign(page: any, event: any) {
    if (event.target.checked == true) {
      this.check_all[page] = true;
    }
    else {
      this.check_all[page] = false;
    }
  }

  //Manage Selected claims
  assigned_claim_nos: number = 0;
  public selected(event: any, claim: any, index: any) {
    if (claim == 'all' && event == true) {
      let audit_claim_data = this.audit_claim_data;
      let claim_nos: any = this.selected_claim_nos;
      let claim_data: any = this.selected_claims;
      audit_claim_data.forEach(function (value: any) {
        let keys: any = value;
        if (!claim_nos.includes(keys['claim_no'])) {
          claim_nos.push(keys['claim_no']);
          claim_data.push(keys);
        }
      });
      this.selected_claim_nos = claim_nos;
      this.selected_claims = claim_data;
    }
    else if (claim == 'all' && event == false) {
      for (let i = 0; i < this.audit_claim_data.length; i++) {
        let claim = this.audit_claim_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);
      }
    }
    else if (event == true) {
      this.selected_claims.push(this.audit_claim_data[index]);
      this.selected_claim_nos.push(claim);
      console.log(this.selected_claim_nos);
    }
    else if (event == false) {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind, 1);
      this.selected_claim_nos.splice(ind, 1);
    }
  }

  public assigned_selected(event: any, claim: any, index: any) {
    if (claim == 'all' && event.target.checked == true) {
      let assigned_claim_data = this.assigned_claim_data;
      let claim_nos = this.selected_claim_nos;
      let claim_data = this.selected_claims;
      assigned_claim_data.forEach(function (value: any) {
        let keys = value;
        if (!claim_nos.includes(keys['claim_no'])) {
          claim_nos.push(keys['claim_no']);
          claim_data.push(keys);
        }
      });
      this.selected_claim_nos = claim_nos;
      this.selected_claims = claim_data;
    }
    else if (claim == 'all' && event.target.checked == false) {
      for (let i = 0; i < this.assigned_claim_data.length; i++) {
        let claim = this.assigned_claim_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);
      }
    }
    else if (event.target.checked == true) {
      this.selected_claims.push(this.assigned_claim_data[index]);
      this.selected_claim_nos.push(claim);
    }
    else if (event.target.checked == false) {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind, 1);
      this.selected_claim_nos.splice(ind, 1);
    }
  }


  public closed_selected(event: any, claim: any, index: any) {
    if (claim == 'all' && event.target.checked == true) {
      let assigned_claim_data = this.closed_claim_data;
      let claim_nos = this.selected_claim_nos;
      let claim_data = this.selected_claims;
      assigned_claim_data.forEach(function (value: any) {
        let keys = value;
        if (!claim_nos.includes(keys['claim_no'])) {
          claim_nos.push(keys['claim_no']);
          claim_data.push(keys);
        }
      });
      this.selected_claim_nos = claim_nos;
      this.selected_claims = claim_data;
    }
    else if (claim == 'all' && event.target.checked == false) {
      for (let i = 0; i < this.closed_claim_data.length; i++) {
        let claim = this.closed_claim_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);
      }
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

  public assigned_claims_details: Array<any> = [];
  claim_assign_type: any;
  selected_associates: any = [];
  //Select Associates for Work Order
  public select_associates(event: any, id: any) {
    if (event.target.checked == true) {
      this.selected_associates.push(id);

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
    }
  }

  //Manual or Automatic Assign
  public assign_type(type: any) {
    if (this.selected_associates.length == 0) {
      this.toastr.errorToastr("Please select Associate")
    }
    else {
      this.claim_assign_type = type;
    }
  }

  public associate_error: string = '';
  public associate_error_handler: any = [];
  //Manual Assign Function
  public manual_assign(event: any, id: any) {
    let check = this.assigned_claims_details.some(function (value) {
      return value.id === id;
    });
    if (event.target.value != 0) {
      if (!check) {
        this.assigned_claims_details.push({ id: id, value: event.target.value });
      }
      else {
        this.assigned_claims_details.find(v => v.id == id).value = event.target.value;
      }
    }
    this.calculate_assigned();
    // this.check_limit();
    this.proceed_stats();
  }
  assigned_claim_status: boolean = false;
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

  claim_proceed: boolean = true;
  proceed_stats() {
    // selected_claim_nos.length==0 || selected_claim_nos.length < assigned_claim_nos
    // console.log(this.selected_claim_nos.length ,',', this.assigned_claim_nos, this.selected_claim_nos.length,this.limit_exceeds  )
    // console.log(this.selected_associates.length, this.selected_claim_nos.length , this.assigned_claim_nos , this.claim_assign_type , this.assigned_claims_details.length )


    if (this.selected_associates.length == 0 || this.selected_claim_nos.length < this.assigned_claim_nos) {
      // console.log("P_Stats  -> True")
      this.claim_proceed = true;
    }
    else {
      // console.log("P_Stats  -> False")
      this.claim_proceed = false;
    }
    // console.log(this.claim_proceed)

  }

  limit_clearance: boolean = false;
  limit_exceeds: any = [];
  //Monitor Limit of Associates
  check_limit() {
    // console.log("Here",this.assigned_claims_details)

    for (let i = 0; i < this.assigned_claims_details.length; i++) {
      let associate = this.auditors_detail.find(x => x['id'] == this.assigned_claims_details[i]['id']);

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




  public assigned_claim_details: any = [];
  //Assign Claims to Create Work Order
  public assign_claims() {
    let selected_claims = this.selected_claim_nos;
    console.log(selected_claims);
    let assigned_details: any = [];
    let init_value = 0;

    this.assigned_claims_details.forEach(function (value) {
      let keys = value;
      let id = keys['id'];
      let value_data = keys['value'];

      let claims_assigned = selected_claims.slice(init_value, Number(init_value) + Number(value_data));
      console.log(claims_assigned);
      init_value = value_data;
      assigned_details.push({ assigned_to: id, claim_nos: value_data, claims: claims_assigned });
    });

    this.assigned_claim_details = assigned_details;
    console.log("O*/p", this.assigned_claim_details);
    this.assigned_claim_status = true;
  }




  public auto_assign_claims() {

    //alert("Auto");

    //console.log("Auto",this.selected_claim_nos,this.auditors_detail,this.selected_associates);

    let assignable_aud = [];
    console.log(this.selected_associates.length);
    if (this.selected_associates.length == 0) {
      this.auditors_detail.forEach(element => {
        assignable_aud.push(element.id);
      });
      console.log(this.auditors_detail);
    }
    else {
      assignable_aud = this.selected_associates;
      console.log(assignable_aud);
      this.modalService.dismissAll()
    }

    let selected_claims = this.selected_claim_nos;
    console.log(selected_claims);
    let init_value = 0;
    let auditors = this.auditors_detail;
    console.log(auditors);
    let assigned_details: any = [];


    let assign_value = 0;
    console.log(assignable_aud);
    assignable_aud.forEach(function (value: any) {
      let keys = value;
      let auditor_det = auditors.find(x => x['id'] == keys);
      console.log(auditor_det);
      //Check Assignable Numbers
      console.log(auditor_det['assign_limit']);
      console.log(auditor_det['assigned_nos']);
      let assign_limit = Number(auditor_det['assigned_nos']) - Number(auditor_det['assign_limit']);
      console.log(assign_limit);
      // Check assignable claims nos
      if ((selected_claims.length - Number(assign_value)) < assign_limit) {
        assign_limit = selected_claims.length;
        console.log(assign_limit);
      }

      console.log('this' + selected_claims.length, assign_value);
      console.log(assign_limit);
      if (/*assign_limit >0 && */(selected_claims.length - Number(assign_value)) != 0) {
        assign_value = Number(init_value) + Number(assign_limit);
        console.log(init_value);
        console.log(assign_value);
        let claims_assigned = selected_claims.slice(init_value, Number(init_value) + Number(assign_limit));
        init_value = Number(init_value) + Number(assign_limit);
        assigned_details.push({ assigned_to: auditor_det['id'], claim_nos: assign_limit, claims: selected_claims });
        console.log(assigned_details);
      }
    });

    this.assigned_claim_details = assigned_details;
    console.log("o/p", this.assigned_claim_details);
    this.assigned_claim_status = true;

    this.create_workorder();
  }



  public create_workorder() {
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
    this.Jarwis.create_workorder(this.setus.getId(), this.workOrder.value, this.assigned_claim_details, 'audit').subscribe(
      data => this.handle_workorder_creation(data),
      error => this.handleError(error)
    );
  }

  //Aftermath Work Order creation Handling
  public handle_workorder_creation(data: any) {
    this.toastr.successToastr('Work Order Created')
    this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);
    this.claim_assign_type = null;
    this.workOrder.reset();
    this.selected_claim_nos = [];
    this.selected_claims = [];
    this.check_all = [];
    this.assigned_claim_details = [];
    this.assigned_data = [];
    this.selected_claim_nos = [];

  }

  wo_total: any = 0;
  w_total: any;
  w_current_total: any;
  w_skip: any;
  w_skip_rows: any;
  w_current_row: any;
  w_total_row: any;
  public form_wo_table(data: any, page_no: any) {
    //  console.log(data);
    if (data) {
      this.GridrowData2 = data.data;
      this.myGrid_2.api?.setRowData(this.GridrowData2);
      console.log('GridrowData_Work Orders',this.GridrowData2);
      this.loader.stop();

    }
    this.work_order_data = data.data;
    this.wo_total = data.count;
    this.wo_page_number = page_no;
    this.tab_load = false;

    this.w_total = data.count;
    this.w_current_total = data.current_total;
    this.w_skip = data.skip + 1;

    this.w_skip_rows = this.w_skip;
    this.w_current_row = this.w_skip + this.w_current_total - 1;
    this.w_total_row = this.w_total;
  }

  wo_details: any[] = [];
  wo_name: string = '';
  wo_created: string = '';


  public export_files(type: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';

    this.Jarwis.fetch_audit_export_data(filter, s_code, this.setus.getId()).subscribe(
      data => this.export_handler.sort_export_data(data, type, 'claim'),
      error => this.handleError(error)
    );
  }


  public export_wo_files(type: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';
    let wo_type = 2;
    this.Jarwis.fetch_wo_export_data(filter, s_code, wo_type, this.setus.getId()).subscribe(
      data => this.export_handler.ready_wo_export(data, type),
      error => this.handleError(error)
    );

  }

  public wo_export_function(type: any) {
    this.export_handler.sort_export_data(this.wo_details, type, 'wo_detail');
  }

  //Work Order details fetch
  public get_wo_details(id: any, name: any, assigned: any) {
    this.loading = true;
    this.wo_details = []
    this.wo_name = name;
    this.wo_created = assigned;
    this.Jarwis.get_workorder_details(id).subscribe(
      data => this.wo_details_table(data),
      error => this.handleError(error)
    );
  }


  public wo_details_table(data: any) {
    this.loading = false;
    this.wo_details = data.data;

  }



  line_data: any = [];

  public get_line_items(claim: any) {
    this.check_note_edit_validity(claim);
    let stat = 0;

    for (let i = 0; i < this.line_item_data.length; i++) {
      let array: any[] = this.line_item_data[i];
      let x = array.find(x => x.claim_id == claim['claim_no']);
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



  }

  line_item_data: any = [];
  assign_line_data(data: any) {
    this.line_item_data.push(data.data);
    this.line_data = data.data;
  }


  edit_permission: boolean = false;
  check_edit_permission(data: any) {
    if (data.includes('audit')) {
      console.log(data);
      this.edit_permission = true;
    }
    else {
      this.edit_permission = false;
    }
    //console.log(this.edit_permission);
  }


  confirmation_type: string = '';
  reassign_claim: any = [];
  curr_reassigned_claims: any = [];

  confirm_reassign(claim: any) {
    this.confirmation_type = 'Reassign';
    this.reassign_claim = claim;
  }

  confirm_action(type: any) {
    if (type == 'Reassign') {
      let mod_type = 'audit';
      this.Jarwis.reassign_calim(this.reassign_claim, this.setus.getId(), mod_type).subscribe(
        data => this.after_reassign(data, this.reassign_claim['claim_no']),
        error => this.handleError(error)
      );

    }
  }

  reassign_allocation: boolean = true;
  after_reassign(data: any, claim: any) {
    this.curr_reassigned_claims.push(claim);
    // this.getclaim_details(this.alloc_pages,'allocated');
    this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);
    this.reassign_allocation = false;
  }

  check_reassign_alloc(claim: any) {
    console.log("ROle", this.setus.get_role(), claim['audit_work_order']);
    //console.log(this.setus.get_role_id());

    if (this.setus.get_role_id() == '4' && this.setus.get_role_id() == '3' && claim['audit_work_order'] != null) {
      let already_re = this.curr_reassigned_claims.indexOf(claim.claim_no);
      // console.log("Here REassign",claim,already_re);
      if (already_re < 0) {
        this.reassign_allocation = true;
      }
      else {
        this.reassign_allocation = false;
      }

    }
    else {
      this.reassign_allocation = false;
    }

  }

  check_note_edit_validity(claim: any) {
    this.Jarwis.check_edit_val(claim, 'audit').subscribe(
      data => this.set_note_edit_validity(data),
      error => this.handleError(error)
    );

  }

  note_edit_val: any;
  set_note_edit_validity(data: any) {
    console.log(data);
    if (data.edit_val == true) {
      this.note_edit_val = data.note_id['id'];
    }
    else {
      this.note_edit_val = undefined;
    }
  }


  reload_data(page: any) {
    if (this.modalService.hasOpenModals() == false) {
      // this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);
      this.Jarwis.get_audit_table_page_new(null, null, null, null, null).subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      // for (let i = 0; i < this.audit_claim_data.length; i++) {
      //   let claim = this.audit_claim_data[i]['claim_no'];
      //   let ind = this.selected_claim_nos.indexOf(claim);
      //   this.selected_claims.splice(ind, 1);
      //   this.selected_claim_nos.splice(ind, 1);
      // }

      let page_count = 15;

      this.pages = page;
      // this.Jarwis.get_audit_table_page('null', this.pages, page_count, 'null', 'null', 'null', null, null, null, null, null).subscribe(
      //   data => this.assign_page_data(data),
      //   error => this.handleError(error)
      // );

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });
    }
  }


  reload_datas(page: any) {
    if (this.modalService.hasOpenModals() == false) {
      this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);

      for (let i = 0; i < this.audit_claim_data.length; i++) {
        let claim = this.audit_claim_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind, 1);
        this.selected_claim_nos.splice(ind, 1);
      }

      let page_count = 15;

      this.pages = page;
      this.Jarwis.get_audit_table_page('null', this.pages, page_count, 'null', 'null', 'null', null, null, null, null, null).subscribe(
        data => this.assign_page_data(data),
        error => this.handleError(error)
      );

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });
    }
  }



  //Configuration of Dropdown Search
  public config: any = {
    displayKey: "description",
    search: true,
    limitTo: 1000,
    result: 'single'
  }

  //isChecked;
  auto_select_claims(event: any) {

    //console.log("checked",this.selected_claim_nos,event.target.checked);
    // if(!this.isChecked)
    // {
    this.Jarwis.auto_assign_claims(this.setus.getId()).subscribe(
      data => this.assign_auto_select(data),
      error => this.handleError(error)
    );

    // }

  }

  assigntype_reset: any;

  removeTextbox() {
    //this.assign_type(this.type).reset(this.type);
    this.assigntype_reset = this.assign_type(this.type);
    this.assigntype_reset = '';
    this.associateCount = '';
  }

  isCheck = true;
  checkedEvnt(val: any) {
    for (let i = 0; i < this.auditors_detail.length; i++) {
      this.auditors_detail[i].isCheck = val;
    }
    this.associateCount = '';
  }

  assign_auto_select(data: any) {

    this.selected_claim_nos = [];
    let work_claims = data.data;
    let assignable = [];

    for (let i = 0; i < work_claims.length; i++) {
      assignable = work_claims[i]['work_claims'];

      for (let j = 0; j < assignable.length; j++) {
        this.selected_claim_nos.push(assignable[j]);
      }


    }

    console.log("AA_Op", this.selected_claim_nos);

  }


  //  get_touch_limit()
  //  {
  //    this.Jarwis.get_practice_stats().subscribe(
  //      data =>this.set_prac_settings(data)
  //      );
  //  }

  touch_count: number = 0;
  //  set_prac_settings(data)
  //  {
  //    let prac_data=data.data;
  //    this.touch_count=prac_data.touch_limit;

  //   //  console.log(this.touch_count);

  //  }

  dataSource = {
    "chart": {
      "caption": "Average Sales",
      "subCaption": "Previous week vs current week",
      "xAxisName": "Day",
      "yAxisName": "Sales (In USD)",
      "numberPrefix": "$",
      "plotFillAlpha": "60",
      "theme": "fusion"
    },
    "categories": [
      {
        "category": [
          {
            "label": "Mon"
          },
          {
            "label": "Tue"
          },
          {
            "label": "Wed"
          },
          {
            "label": "Thu"
          },
          {
            "label": "Fri"
          },
          {
            "label": "Sat"
          },
          {
            "label": "Sun"
          }
        ]
      }
    ],
    "dataset": [
      {
        "seriesname": "Previous Week",
        "data": [
          {
            "value": "13000"
          },
          {
            "value": "14500"
          },
          {
            "value": "13500"
          },
          {
            "value": "15000"
          },
          {
            "value": "15500"
          },
          {
            "value": "17650"
          },
          {
            "value": "19500"
          }
        ]
      },
      {
        "seriesname": "Current Week",
        "data": [
          {
            "value": "8400"
          },
          {
            "value": "9800"
          },
          {
            "value": "11800"
          },
          {
            "value": "14400"
          },
          {
            "value": "18800"
          },
          {
            "value": "24800"
          },
          {
            "value": "30800"
          }
        ]
      }
    ]
  }
  dataSource2 = {
    "chart": {
      "caption": "Average Page Load Time (hsm.com)",
      "subCaption": "Last Week",
      "showBorder": "0",
      "xAxisName": "Day",
      "yAxisName": "Time (In Sec)",
      "numberSuffix": "s",
      "theme": "fusion"
    },
    "categories": [
      {
        "category": [
          {
            "label": "Mon"
          },
          {
            "label": "Tue"
          },
          {
            "label": "Wed"
          },
          {
            "label": "Thu"
          },
          {
            "label": "Fri"
          },
          {
            "label": "Sat"
          },
          {
            "label": "Sun"
          }
        ]
      }
    ],
    "dataset": [
      {
        "seriesname": "Loading Time",
        "allowDrag": "0",
        "data": [
          {
            "value": "6"
          },
          {
            "value": "5.8"
          },
          {
            "value": "5"
          },
          {
            "value": "4.3"
          },
          {
            "value": "4.1"
          },
          {
            "value": "3.8"
          },
          {
            "value": "3.2"
          }
        ]
      }
    ]
  }

  public myOptions: any = {
    'placement': 'right',
    'hide-delay': 3000,
    'theme': 'light'
  }

  user_role: Number = 0;
  class_change: any = [];
  class_change_tab: any = [];
  user_role_maintainer() {
    let role_id = Number(this.setus.get_role_id());

    if (role_id == 5 || role_id == 3 || role_id == 2) {
      this.user_role = 2;
      this.class_change['tab1'] = '';
      this.class_change['tab2'] = 'active';

      this.class_change_tab['tab1'] = 'tab-pane';
      this.class_change_tab['tab2'] = 'tab-pane active'




    }
    else if (role_id == 4) {
      this.user_role = 1;

      this.class_change['tab1'] = 'active';
      this.class_change['tab2'] = '';

      this.class_change_tab['tab1'] = 'tab-pane active';
      this.class_change_tab['tab2'] = 'tab-pane'
    }
    else if(role_id == 16){
      this.user_role = 16;
      this.class_change['tab1'] = 'active';
      this.class_change_tab['tab1'] = 'tab-pane active';
      this.class_change_tab['tab2'] = 'tab-pane';
    }



  }

  graphStatus() {
    let role_id = Number(this.setus.get_role_id());
    var exclusion = [2, 4, 5];

    if (!exclusion.includes(role_id)) {
      this.Jarwis.get_audit_graph(this.setus.getId()).subscribe(
        data => { console.log(data) },
        error => this.handleError(error)
      );
    }

  }

  // order_list(type){
  //   if(this.sortByAsc == true) {
  //     this.sortByAsc = false;
  //     this.getclaim_details(1,'wo',this.sortByAsc,type);
  //   } else {
  //     this.sortByAsc = true;
  //     this.getclaim_details(1,'wo',this.sortByAsc,type);
  //   }
  // }



  ngOnInit() {
    // this.auth.tokenValue.next(false);
    this.user_role_maintainer();
    this.get_statuscodes();
    this.auditClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      total_ar: new FormControl(null, [Validators.required, Validators.pattern(this.decimal_pattern),]),
      status_code: [],
      sub_status_code: [],
      rendering_provider: [],
      responsibility: [],
      date: [],
      payer_name: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
      bill_submit_date: [],
      denial_code: [],
    });

    this.assignedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      total_ar: new FormControl(null, [Validators.required, Validators.pattern(this.decimal_pattern),]),
      status_code: [],
      sub_status_code: [],
      rendering_provider: [],
      responsibility: [],
      date: [],
      payer_name: [],
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


    this.closedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      total_ar: new FormControl(null, [Validators.required, Validators.pattern(this.decimal_pattern),]),
      status_code: [],
      sub_status_code: [],
      rendering_provider: [],
      responsibility: [],
      date: [],
      payer_name: [],
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

    this.workOrderFind = this.formBuilder.group({
      created_at: [null],
      due_date: [null],
      work_order_name: [null],
      priority:[null]
    });

    this.processNotes = new FormGroup({
      processnotes: new FormControl('', [Validators.required])
    });
    this.claimNotes = new FormGroup({
      claim_notes: new FormControl('', [Validators.required])
    });
    this.qcNotes = new FormGroup({
      qc_notes: new FormControl('', [Validators.required]),
      root_cause: new FormControl(null),
      error_type: new FormControl('', [Validators.required]),
      error_parameter: new FormControl('', [Validators.required]),
      error_sub_parameter: new FormControl('', [Validators.required]),
      fyi_parameter: new FormControl('', [Validators.required]),
      fyi_sub_parameter: new FormControl('', [Validators.required])
    });


    this.workOrder = new FormGroup({
      workorder_name: new FormControl('', [Validators.required]),
      due_date: new FormControl('', [Validators.required]),
      priority: new FormControl('', [Validators.required]),
      wo_notes: new FormControl('', [Validators.required])
    });

    const debouncetime = pipe(debounceTime(700));
    this.search_data.valueChanges.pipe(debouncetime)
      .subscribe(result => this.sort_data(result)
      );
    this.wo_search_data.valueChanges.pipe(debouncetime)
      .subscribe(result => this.sort_wo_data(result)
      );
    this.filter_option.valueChanges
      .subscribe(result => this.sort_table(result)
      );
    this.subscription = this.notify_service.fetch_touch_limit().subscribe(message => {
      this.touch_count = message
    });
    //this.graphStatus();
  }

  ngAfterViewInit() {
    // this.get_statuscodes(); CALLED TWO TIMES
    this.get_audit_codes();
    this.get_error_param_codes();
    this.get_error_sub_param_codes();
    this.Jarwis.get_audit_table_page('null', 1, 15, 'null', 'null', 'null', null, null, null, null, null).subscribe(
      data => this.assign_page_data(data),
      error => this.handleError(error)
    );
    // this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);

    //this.sortallocated();
    if (this.touch_count == undefined) {
      this.touch_count = this.notify_service.manual_touch_limit();
    }
    console.log('LAST IN AUDIT COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
    this.response_data.unsubscribe();
    this.observalble.unsubscribe();
    this.update_monitor.unsubscribe();
    //this.sub_err_subscription.unsubscribe();
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

  public reassign(content: any) {
    if (this.selected_claim_nos.length == 0) {
      this.toastr.errorToastr('Please select Claims');
    }
    else {
      this.modalService.open(content, { centered: true, windowClass: 'custom-class' }).result.then((result) => {
        this.closeResult = `${result}`;
      }, (reason) => {
        this.closeResult = `${this.getDismissReason()}`;
      });
    }
  }

  selectChange(event: any) {
    /* event.forEach(element => {
     this.selectedError = element.description;
    }); */
    this.selectedError = event.description;
    console.log(this.selectedValue);
    console.log(this.selectedError);
    if (event.description == 'No Error' || event.description == 'Clarification') {
      this.qcNotes.controls['error_parameter'].clearValidators();
      this.qcNotes.controls['error_parameter'].setValidators(null);
      this.qcNotes.controls['error_parameter'].updateValueAndValidity();

      this.qcNotes.controls['error_sub_parameter'].clearValidators();
      this.qcNotes.controls['error_sub_parameter'].setValidators(null);
      this.qcNotes.controls['error_sub_parameter'].updateValueAndValidity();

      this.qcNotes.controls['fyi_parameter'].clearValidators();
      this.qcNotes.controls['fyi_parameter'].setValidators(null);
      this.qcNotes.controls['fyi_parameter'].updateValueAndValidity();

      this.qcNotes.controls['fyi_sub_parameter'].clearValidators();
      this.qcNotes.controls['fyi_sub_parameter'].setValidators(null);
      this.qcNotes.controls['fyi_sub_parameter'].updateValueAndValidity();

      this.qcNotes.valid;
    }
    else if (event.description == 'FYI') {
      this.qcNotes.controls['error_parameter'].clearValidators();
      this.qcNotes.controls['error_parameter'].setValidators(null);
      this.qcNotes.controls['error_parameter'].updateValueAndValidity();

      this.qcNotes.controls['error_sub_parameter'].clearValidators();
      this.qcNotes.controls['error_sub_parameter'].setValidators(null);
      this.qcNotes.controls['error_sub_parameter'].updateValueAndValidity();
    }
    else {
      this.qcNotes.controls['fyi_parameter'].clearValidators();
      this.qcNotes.controls['fyi_parameter'].setValidators(null);
      this.qcNotes.controls['fyi_parameter'].updateValueAndValidity();

      this.qcNotes.controls['fyi_sub_parameter'].clearValidators();
      this.qcNotes.controls['fyi_sub_parameter'].setValidators(null);
      this.qcNotes.controls['fyi_sub_parameter'].updateValueAndValidity();
    }
    console.log(this.qcNotes.value);
    this.get_error_param_codes();
  }

  selectSubChange(value: any) {
    console.log(value);
    this.parentId = value.id;
    console.log(this.parentId);
    if (this.parentId != '') {
      this.get_error_sub_param_codes();
    }
  }

  confirm_box() {
    this.Jarwis.get_closed_claims(this.selected_claim_nos, this.setus.getId()).subscribe(
      data => this.reassigned_claims(data),
      error => this.handleError(error)
    );
  }

  reassigned_claims(data: any) {
    console.log(data);
    if (this.selected_claim_nos.length == 0) {
      this.toastr.errorToastr('please select Claims');
    }

    if (data.status == 'success') {

      let type = 'allocated';
      this.getclaim_details(1, 'allocated', 'null', 'null', 'null', 'null', null, null, null, null, null);

      this.toastr.successToastr('Claim move to closed.');
    }
  }


  confirm_boxes(reassign: any) {
    this.Jarwis.getdata(this.selected_claim_nos, this.setus.getId(), reassign).subscribe(
      data => this.reassigned_claims_datas(data),
      error => this.handleError(error)

    );
  }
  reassigned_claims_datas(data: any) {
    if (this.selected_claim_nos.length == 0) {
      this.toastr.errorToastr('please select Claims');
    }
    for (let i = 0; i < this.selected_claim_nos.length; i++) {
      var assigned_to = this.selected_claim_nos[i]['assigned_to'];
      var assigned_by = this.selected_claim_nos[i]['assigned_by'];
    }
    if (data.assigned_to == data.assigned_by) {
      this.toastr.errorToastr('Unable to Reassign');
      this.selected_claim_nos = [];

    }
    else {
      let page_count = 15;
      // console.log("ip",type);
      let form_type: any = null;
      let type = 'reallocated';
      let page = this.realloc_pages;
      this.tab_load = true;
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,null,null,'null','null',null,null,null,null).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );

      this.Jarwis.getclaim_details(this.setus.getId(), page, page_count, type, null, null, null, null, null, null, null, null).subscribe(
        data => this.form_table(data, type, form_type),
        error => this.handleError(error)
      );
      this.toastr.successToastr('Reassigned Successfully');
    }
  }

  cancel_claims() {
    this.selected_claim_nos = [];
  }

  public select_claims(content: any) {
    console.log('selected_claim_no', this.selected_claim_nos);
    if (this.selected_claim_nos.length == 0) {
      this.toastr.errorToastr('Please Select Claims.');
    }
    else {
      this.openModal(content);
      this.getDismissReason();
      // this.modalService.open(content, { centered: true, windowClass: 'dark-modal' }).result.then((result) => {
      //   console.log('result',result);

      //   this.closeResult = `${result}`;
      // }, (reason) => {
      //   this.closeResult = `${this.getDismissReason()}`;
      // });
    }
  }
  public clear_fields() {
    this.assigned_claims_details = [];
    this.workOrder.reset();
  }
  public sort_details(type: any) {
    if (type == 'id') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.acct_no.localeCompare(b.acct_no));
        this.work_order_data.sort((a, b) => a.created.localeCompare(b.created));
        this.allocated_claims.sort((a, b) => a.acct_no.localeCompare(b.acct_no));
      } else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.acct_no.localeCompare(a.acct_no));
        this.work_order_data.sort((a, b) => b.created.localeCompare(a.created));
        this.allocated_claims.sort((a, b) => b.acct_no.localeCompare(a.acct_no));
      }
    }
    else if (type == 'claims') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.claim_no.localeCompare(b.claim_no));
        this.allocated_claims.sort((a, b) => a.claim_no.localeCompare(b.claim_no));
      } else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.claim_no.localeCompare(a.claim_no));
        this.allocated_claims.sort((a, b) => b.claim_no.localeCompare(a.claim_no));
      }
    }
    else if (type == 'patient') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.allocated_claims.sort((a, b) => a.patient_name.localeCompare(b.patient_name));
        this.table_datas.sort((a, b) => a.patient_name.localeCompare(b.patient_name));
        this.work_order_data.sort((a, b) => a.work_order_name.localeCompare(b.work_order_name));

      }
      else {
        this.sortByAsc = true;
        this.allocated_claims.sort((a, b) => b.patient_name.localeCompare(a.patient_name));
        this.table_datas.sort((a, b) => b.patient_name.localeCompare(a.patient_name));
        this.work_order_data.sort((a, b) => b.work_order_name.localeCompare(a.work_order_name));

      }
    }
    else if (type == 'insurance') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.prim_ins_name.localeCompare(b.prim_ins_name));
        this.allocated_claims.sort((a, b) => a.prim_ins_name.localeCompare(b.prim_ins_name));
      }
      else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.prim_ins_name.localeCompare(a.prim_ins_name));
        this.allocated_claims.sort((a, b) => b.prim_ins_name.localeCompare(a.prim_ins_name));
      }
    }
    else if (type == 'bill') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.total_charges.localeCompare(b.total_charges));
        this.allocated_claims.sort((a, b) => a.total_charges.localeCompare(b.total_charges));
      }
      else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.total_charges.localeCompare(a.total_charges));
        this.allocated_claims.sort((a, b) => b.total_charges.localeCompare(a.total_charges));
      }
    }
    else if (type == 'due') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.total_ar.localeCompare(b.total_ar));
        this.work_order_data.sort((a, b) => a.due_date.localeCompare(b.due_date));
        this.allocated_claims.sort((a, b) => a.total_ar.localeCompare(b.total_ar));
      }
      else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.total_ar.localeCompare(a.total_ar));
        this.work_order_data.sort((a, b) => b.due_date.localeCompare(a.due_date));
        this.allocated_claims.sort((a, b) => b.total_ar.localeCompare(a.total_ar));
      }
    }
    else if (type == 'status') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.claim_Status.localeCompare(b.claim_Status));
        this.work_order_data.sort((a, b) => a.status.localeCompare(b.status));
        this.allocated_claims.sort((a, b) => a.claim_Status.localeCompare(b.claim_Status));
      }
      else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => a.claim_Status.localeCompare(b.claim_Status));
        this.work_order_data.sort((a, b) => b.status.localeCompare(a.status));
        this.allocated_claims.sort((a, b) => a.claim_Status.localeCompare(b.claim_Status));
      }
    }
    else if (type == 'dos') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.table_datas.sort((a, b) => a.dos.localeCompare(b.dos));
        this.allocated_claims.sort((a, b) => a.dos.localeCompare(b.dos));
      }
      else {
        this.sortByAsc = true;
        this.table_datas.sort((a, b) => b.dos.localeCompare(a.dos));
        this.allocated_claims.sort((a, b) => b.dos.localeCompare(a.dos));
      }
    }
  }
  public sort_claims(type: any) {
    if (type == 'acct_no') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.acct_no.localeCompare(b.acct_no));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.acct_no.localeCompare(a.acct_no));
      }
    }
    if (type == 'claim_no') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.claim_no.localeCompare(b.claim_no));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.claim_no.localeCompare(a.claim_no));
      }
    }
    if (type == 'patient_name') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.patient_name.localeCompare(b.patient_name));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.patient_name.localeCompare(a.patient_name));
      }
    }
    if (type == 'dos_date') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.dos.localeCompare(b.dos));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.dos.localeCompare(a.dos));
      }
    }
    if (type == 'prim_ins_name') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.prim_ins_name.localeCompare(b.prim_ins_name));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.prim_ins_name.localeCompare(a.prim_ins_name));
      }
    }
    if (type == 'total_charges') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.total_charges.localeCompare(b.total_charges));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.total_charges.localeCompare(a.total_charges));
      }
    }
    if (type == 'total_ar') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.total_ar.localeCompare(b.total_ar));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.total_ar.localeCompare(a.total_ar));
      }
    }
    if (type == 'claim_Status') {
      if (this.sortByAsc == true) {
        this.sortByAsc = false;
        this.wo_details.sort((a, b) => a.claim_Status.localeCompare(b.claim_Status));
      } else {
        this.sortByAsc = true;
        this.wo_details.sort((a, b) => b.claim_Status.localeCompare(a.claim_Status));
      }
    }
  }
  public togglecollapse() {
    // alert("hi")
    this.isopend = !this.isopend;

  }

  public searchClaims: any;

  public export_excel_files(type: any, table_name: any) {
    console.log(table_name);

    if (table_name == 'Audit_que_claims') {
      this.searchClaims = this.auditClaimsFind.value;
    } else if (table_name == 'Assigned_claims') {
      this.searchClaims = this.assignedClaimsFind.value;
    } else if (table_name == 'Closed_claims') {
      this.searchClaims = this.closedClaimsFind.value;
    }

    this.Jarwis.fetch_audit_claims_export_data(this.setus.getId(), table_name, this.search, this.searchClaims).subscribe(
      data => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
    );
  }

  public export_pdf_files(type: any, table_name: any) {
    let filter = 'all claims';
    let s_code = 'adjustment';

    this.Jarwis.fetch_audit_claims_export_data_pdf(this.setus.getId(), table_name).subscribe(
      data => this.export_handler.sort_export_data(data, type, 'claim'),
      error => this.error_handler(error)
    );
  }


  public auto_assigned() {

    console.log(this.selected_claim_nos);
    //this.setus.getId(),this.workOrder.value,this.assigned_claim_details,'audit'
    this.Jarwis.auto_assigned(this.setus.getId(), this.selected_claim_nos, this.workOrder.value, this.assigned_claim_details, 'audit').subscribe(
      data => this.auto_assigned_data(data),
      error => this.error_handler(error)
    );
  }

  public auto_assigned_data(data: any) {
    this.getclaim_details(1, 'wo', 'null', 'null', 'null', 'null', null, null, null, null, null);
    this.modalService.dismissAll();
    this.clear_notes();
    this.workOrder.reset();
    this.selected_claim_nos = [];

    this.checkboxes.forEach((element) => {
      element.nativeElement.checked = false;
    });


  }

  public export_excel_wo_files(type: any, table_name: any) {
    this.Jarwis.fetch_work_order_export_data(this.setus.getId(), table_name, this.search, this.workOrderFind.value).subscribe(
      data => this.export_handler.create_wo_export_excel(data),
      error => this.error_handler(error)
    );
  }

  error_handler(error: any) {

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
  // tooltipOptions= {
  //     'placement': 'right',
  //     'show-delay': '200',
  //     'tooltip-class': 'new-tooltip-class',
  //     'background-color': '#9ad9e4'
  //   };

  // public clear_auditor()
  // {
  // this.assigned_claims_details=[];
  // this.assign_claims.reset();
  //}


  getSearchResults(): void {
    this.Jarwis.get_payer_name().subscribe((sr: any) => {
      this.searchResults = sr['payer_names'];
    });
  }
  searchFromArray(arr: any[], regex: any) {
    let matches = [], i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i].match(regex)) {
        matches.push(arr[i]);
      }
    }
    return matches;
  };
  //For AuditQueue
  auditQueueSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.auditQueue_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.auditQueue_selected_val = null;
      this.auditQueueSelected = false;
    }
  }
  auditQueueSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.auditQueueSelected = true;
      this.auditQueue_selected_val = value;
    }
    else {
      this.auditQueue_selected_val = null;
      this.auditQueueSelected = false;
    }
  }

  //For AssignedClaim
  assignedSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.assigned_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.assigned_selected_val = null;
      this.assignedSelected = false;
    }
  }
  assignedSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.assignedSelected = true;
      this.assigned_selected_val = value;
    }
    else {
      this.assigned_selected_val = null;
      this.assignedSelected = false;
    }
  }

  //For ReAssignedClaim
  reassignedSearchOnKeyUp(event: any) {
    let input = event.target.value;
    if (input.length > 0) {
      this.reassigned_results = this.searchFromArray(this.searchResults, input);
    }
    else {
      this.reassigned_selected_val = null;
      this.reassignedSelected = false;
    }
  }
  reassignedSelectvalue(value: any) {
    if (value != '' || value != null) {
      this.reassignedSelected = true;
      this.reassigned_selected_val = value;
    }
    else {
      this.reassigned_selected_val = null;
      this.reassignedSelected = false;
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
  sortallocated() {
    this.allocated_claims.sort((a, b) => {
      if (a.error_type === '[4]') {
        console.log(this.allocated_claims);
        console.log('sorted');
        return -1;
      } else if (a.error_type === null) {
        return 1;
      } else if (b.error_type === null) {
        return -1;
      } else {
        return 0;
      }
    });
  }


  bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true  });
  selectedAssign: any;
  rowValue_ID_1: any;
  rowValue_ID_2: any;
  rowValue_ID_3: any;
  rowValue_ID_4: any;
  cdtn: boolean = false;
  isCollapsed_audit_que_grid:boolean = false;
  isCollapsed_audit_que_filters:boolean = true;
  isCollapsed_assigned_claims_filters:boolean = true;
  isCollapsed_assigned_claims_grid:boolean = false;
  isCollapsed_closed_claims:boolean = false;
  isCollapsed_closed_claims_filters:boolean = true;

  public defaultColDef: ColDef = {
    editable: false,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    sortable: true,
    resizable: true,
  };

  public gridApi_1!: GridApi;
  public gridApi_2!: GridApi;
  public gridApi_3!: GridApi;
  public gridApi_4!: GridApi;
  page:any = null;
  GridrowData1: any = [];
  GridrowData2: any = [];
  GridrowData3: any = [];
  GridrowData4: any = [];
  modalRef?: BsModalRef;
  modalRef2?: BsModalRef;
  modalRef3?: BsModalRef;
  search_value: any;
  search_value_assignedClaims:any;
  @ViewChild('myGrid_1') myGrid_1!: AgGridAngular;
  @ViewChild('myGrid_2') myGrid_2!: AgGridAngular;
  @ViewChild('myGrid_3') myGrid_3!: AgGridAngular;
  @ViewChild('myGrid_4') myGrid_4!: AgGridAngular;
  @ViewChild('claimpage') claimpage!: TemplateRef<any>;
  @ViewChild('work_order_details') work_order_details!: TemplateRef<any>;

  new_cdtn:boolean = false;
  currentPageData: any = [];
  resl_dta: any = [];

  onGridReady_1(params: GridReadyEvent) {
    this.gridApi_1 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    this.myGrid_1.api.setRowData([]);
    const header = document.querySelectorAll('.ag-checkbox-input');
    header.forEach(v => {
      v.addEventListener('click', (event) =>{
        let startIndex = 0;
        let endIndex = 0;
        this.new_cdtn =!  this.new_cdtn;
        console.log('New_cdtn',this.new_cdtn);
        const currentPage = params.api.paginationGetCurrentPage();
        const pageSize = params.api.paginationGetPageSize();
        startIndex = currentPage * pageSize;
        endIndex = startIndex + pageSize;
        console.log(startIndex,endIndex);

    params.api.forEachNodeAfterFilterAndSort((node: any) =>{
      this.currentPageData.push(node.data);
    });

    this.resl_dta = this.GridrowData1.slice(startIndex,endIndex);
    console.log('currentPageData',this.resl_dta);
    const selectedNodes:any[] = this.gridApi_1.getSelectedNodes();
    // for(let i=0;i<selectedNodes.length;i++)
    // console.log('selectedNodes',selectedNodes?.[i].data);
      let  x= this.gridApi_1.paginationGetRowCount();
      console.log('Total Row Count',x);

let totalPages = this.gridApi_1.paginationGetTotalPages();
let currentPage1 = this.gridApi_1.paginationGetCurrentPage();
console.log("Current page:", currentPage1);
console.log("Total page:", totalPages);
    if(this.new_cdtn){
      //  if (selectedRowCount< startIndex && selectedRowCount >endIndex ) {
     // Deselect rows beyond the first 15
     if(startIndex>0 && totalPages-1 !=currentPage1){
      console.log('IN1');
      selectedNodes.splice(endIndex,x).forEach(node => node.setSelected(false));
      selectedNodes.splice(0,startIndex).forEach(node => node.setSelected(false));
     }
     else if(startIndex > 0 && totalPages-1 == currentPage1){
      console.log('IN2');
      selectedNodes.splice(0,startIndex).forEach(node => node.setSelected(false));
     }
     else if(endIndex>0){
      console.log('IN3');
      console.log('EndIndex+1',endIndex+1);console.log('X',x);console.log('X - EndIndex',x-(endIndex));
      selectedNodes.splice(endIndex,x-(endIndex)).forEach(node => node.setSelected(false));
    }

        // }
    }
    else
    {
      selectedNodes.forEach(node => node.setSelected(false));
    }

      })
    });
  }
  onGridReady_2(params: GridReadyEvent) {
    this.gridApi_2 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    this.myGrid_2.api.setRowData([]);
    // setTimeout(() => {
    //   console.log('444', this.GridrowData1);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridrowData1);
    // }, 4000);
  }
  onGridReady_3(params: GridReadyEvent) {
    this.gridApi_3 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    this.myGrid_3.api.setRowData([]);
    // setTimeout(() => {
    //   console.log('444', this.GridrowData1);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridrowData1);
    // }, 4000);
  }
  onGridReady_4(params: GridReadyEvent) {
    this.gridApi_4 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    this.myGrid_4.api.setRowData([]);
    // setTimeout(() => {
    //   console.log('444', this.GridrowData1);
    //   this.cdtn = true;
    //   this.myGrid_1.api?.setRowData(this.GridrowData1);
    // }, 4000);
  }

  onSelectionChanged(params: any) {
    this.cdtn = !this.cdtn;
    this.selected_claim_nos = [];
    console.log('cdtn', this.cdtn);
    console.log('params', params);
    this.rowValue_ID_1 = this.gridApi_1.getSelectedRows();
    console.log('ID1', this.rowValue_ID_1);
    if (this.rowValue_ID_1 != '') {
      for (let i = 0; i < this.rowValue_ID_1.length; i++) {
        this.selected_claim_nos.push(this.rowValue_ID_1?.[i].claim_no);
      }
    }
    // this.rowValue_ID_1 .forEach((rowNode: any) => {
    //   rowIndex = rowNode.rowIndex;
    //   console.log('Row Index:', rowIndex);
    //   // this.selected(this.cdtn,this.rowValue_ID_1.claim_no,this.rowValue_ID_1.rowIndex);
    // });
  }

  onSelectionChanged_forWorkOrders(params: any) {
    this.selected_claim_nos = [];
    this.rowValue_ID_2 = this.gridApi_2.getSelectedRows();
    console.log('ID2', this.rowValue_ID_2);
    if (this.rowValue_ID_2 != '') {
      for (let i = 0; i < this.rowValue_ID_2.length; i++) {
        this.selected_claim_nos.push(this.rowValue_ID_2?.[i].claim_no);
      }
    }
  }
  onSelectionChanged_assignedClaims(params:any){
    this.rowValue_ID_3 = this.gridApi_3.getSelectedRows();
    console.log('ID3', this.rowValue_ID_3);
  }

  onSelectionChanged_ClosedClaims(params:any){
    this.rowValue_ID_4 = this.gridApi_4.getSelectedRows();
    console.log('ID3', this.rowValue_ID_4);
  }


  gridOptions1: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    pagination: true,
    paginationPageSize: 15,
    getRowStyle: params => {
      return { 'font-size': '11px', 'font-weight': '500' };
    }
  };
  gridOptions2: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    pagination: true,
    paginationPageSize: 15,
    getRowStyle: params => {
      return { 'font-size': '11px', 'font-weight': '500' };
    }
  };
  gridOptions3: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    pagination: true,
    paginationPageSize: 15,
    getRowStyle: params => {
      return { 'font-size': '11px', 'font-weight': '500' };
    }
  };
  gridOptions4: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: true,
    pagination: true,
    paginationPageSize: 15,
    getRowStyle: params => {
      return { 'font-size': '11px', 'font-weight': '500' };
    }
  };

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

  columnDefs1: ColDef[] = [
    {
      field: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 20,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
    },
    {
      field: 'touch',
      headerName: '',
      width: 63,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_auditQue.bind(this, 'touch'),

    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width: 140,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked_AuditQue.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width: 152,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'dos'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 93,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'age'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 120,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked_AuditQue.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      width:190,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked_AuditQue.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 230,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'rendering_prov'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 183,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'responsibility'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'responsibility')
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width:196,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'billed_submit_date'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'billed_submit_date')
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 165,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'denial_code'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'denial_code')
    },
    {
      field: 'statuscode',
      headerName: 'Status Code',
      sortable: true,
      width: 238,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'statuscode'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'statuscode')
    },
    {
      field: 'substatus_code',
      headerName: 'Sub Status Code',
      sortable: true,
      width: 205,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'substatus_code'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'substatus_code')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width: 175,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'total_charges'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'total_ar'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'total_ar')
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 165,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'claim_Status'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'claim_Status')
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width: 155,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'claim_note'),
      // onCellClicked: this.CellClicked_AuditQue.bind(this, 'claim_note')
    },
    {
      field: 'created_ats',
      headerName: 'User | Date',
      sortable: true,
      width: 220,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_auditQue.bind(this, 'created_ats',),
      // // onCellClicked: this.CellClicked_AuditQue.bind(this, 'created_ats')
    },

  ];

  columnDefs2: ColDef[] = [
    {
      field: 'created',
      headerName: 'Created By|Date',
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'created'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'created')

    },
    {
      field: 'work_order_name',
      headerName: 'Work Order Name',
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'work_order_name'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'work_order_name')
    },
    {
      field: 'assigned_nos',
      headerName: 'Claim Count',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'assigned_nos'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'assigned_nos')
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'due_date'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'due_date')
    },
    {
      field: 'billed',
      headerName: 'Billed',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'billed'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'billed')
    },
    {
      field: 'ar_due',
      headerName: 'AR Due',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'ar_due'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'ar_due')
    },
    {
      field: 'status',
      headerName: 'WO Status',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'status'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'status')
    },
    {
      field: 'priority',
      headerName: 'Priority',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'priority'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'priority')
    },
    {
      field: 'work_notes',
      headerName: 'WO Notes',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_WorkOrders.bind(this, 'work_notes'),
      onCellClicked: this.CellClicked_WorkOrders.bind(this, 'work_notes')
    },
  ];

  columnDefs3: ColDef[] = [
    // {
    //   field: '',
    //   checkboxSelection: true,
    //   headerCheckboxSelection: true,
    //   width: 20,
    //   cellStyle:(params:any):any=>{
    //     let x = params.node.data;
    //     let result = x.error_type;
    //     console.log('error_type',result);
    //     if(result ==='[4]'){
    //       return { 'background-color': '#ffcaca','font-size':'12px' };
    //     }
    //     else
    //     {
    //       return {'font-size':'12px' };
    //     }
    //   },
    // },
    {
      field: 'touch',
      headerName: '',
      width: 45,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {  'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px' };
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'touch'),

    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width: 90,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return { 'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px' };
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked_assignedClaims.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width: 102,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'dos'),
      onCellClicked: this.CellClicked_assignedClaims.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 60,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return { 'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'age'),
      onCellClicked: this.CellClicked_assignedClaims.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 80,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked_assignedClaims.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      width:150,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }

      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked_assignedClaims.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 147,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'responsibility')
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width:125,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'billed_submit_date')
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'denial_code')
    },
    {
      field: 'statuscode',
      headerName: 'Status Code',
      sortable: true,
      width: 103,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'statuscode')
    },
    {
      field: 'substatuscode',
      headerName: 'Sub Status Code',
      sortable: true,
      width: 128,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){``
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'substatuscode')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 90,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'total_ar')
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 106,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'claim_Status')
    },
    {
      field: 'claims_notes',
      headerName: 'Claim Note',
      sortable: true,
      width: 100,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'claims_notes')
    },
    {
      field: 'executive_work_date',
      headerName: 'Executive w.Date',
      sortable: true,
      width: 133,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return {'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'executive_work_date')
    },
    {
      field: 'assigned_to',
      headerName: 'User | Date',
      sortable: true,
      width: 130,
      cellStyle:(params:any):any=>{
        let x = params.node.data;
        let result = x.error_type;
        if(result ==='[4]'){
          return { 'background-color': '#ffcaca','color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
        else
        {
          return {'color': '#363636',
          'font-weight': '500',  'font-family': 'sans-serif',
          'font-size': '12px'};
        }
      },
      cellRenderer: this.cellrendered_assignedClaims.bind(this, 'assigned_to',)
    },

  ];

  columnDefs4: ColDef[] = [
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
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked_ClosedClaims.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width: 106,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'dos'),
      onCellClicked: this.CellClicked_ClosedClaims.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 70,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'age'),
      onCellClicked: this.CellClicked_ClosedClaims.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 80,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked_ClosedClaims.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      width:160,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked_ClosedClaims.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 150,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'rendering_prov'),
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 125,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'responsibility'),
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width:128,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'billed_submit_date'),
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 110,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'denial_code'),
    },
    {
      field: 'statuscode',
      headerName: 'Status Code',
      sortable: true,
      width: 155,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'statuscode'),
    },
    {
      field: 'substatuscode',
      headerName: 'Sub Status Code',
      sortable: true,
      width: 130,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'substatuscode'),
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'total_charges'),
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 100,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px'};
      },
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'total_ar'),
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 110,
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'claim_Status'),
    },
    {
      field: 'claims_notes',
      headerName: 'Claim Note',
      sortable: true,
      width: 100,
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'claims_notes'),
    },
    {
      field: 'created_ats',
      headerName: 'User | Date',
      sortable: true,
      width: 150,
      cellRenderer: this.cellrendered_ClosedClaims.bind(this, 'created_ats',),
    },

  ];

  cellrendered_auditQue(headerName: any, params: any) {
    switch (headerName) {
      case 'touch': {
        if (params.value >= this.touch_count || params.value < this.touch_count) {
          return params.value;
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
        if (params.value != '01/01/1970') {
          let x = params.value;
          x = this.datepipe.transform(x, 'MM/dd/yyyy');
          return `${x}`;
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
      case 'billed_submit_date': {
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
      case 'statuscode': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'substatus_code': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
        break;
      }
      case 'total_charges': {
        if (params.value) {
          if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); }
        }
        else
          return '-Nil-';
        break;
      }
      case 'total_ar': {
        if (params.value) { if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); } }
        else
          return '-Nil-';
        break;
      }
      case 'claim_Status': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
      }
      case 'claim_note': {
        if (params.value)
          return `<i class="fa fa-info-circle" aria-hidden="true" title="${params.value}"></i>`;
        else
          return '-Nil-';
      }
      case 'created_ats': {
        let x: any;
        x = params.value.substring(0, 10);
        x = this.datepipe.transform(x, 'MM/dd/yyyy');
        x != null ? x : 'UA'
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo == null ? 'UA' : assignedTo} | ${x}`;
      }

    }
  }

  cellrendered_ClosedClaims(headerName:any,params:any){
    switch (headerName) {
      case 'touch': {
        if (params.value >= this.touch_count || params.value < this.touch_count) {
          return params.value;
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
        if (params.value != '01/01/1970') {
          let x = params.value;
          x = this.datepipe.transform(x, 'MM/dd/yyyy');
          return `${x}`;
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
      case 'billed_submit_date': {
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
      case 'statuscode': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'substatuscode': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
      }
      case 'total_charges': {
        if (params.value) {
          if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); }
        }
        else
          return '-Nil-';
        break;
      }
      case 'total_ar': {
        if (params.value) { if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); } }
        else
          return '-Nil-';
        break;
      }
      case 'claim_Status': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
      }
      case 'claims_notes': {
        if (params.value)
          return `<i  style="width:30px" class="fa fa-info-circle" aria-hidden="true" title="${params.value}"></i>`;
        else
          return '-Nil-';
      }
      case 'created_ats': {
        let x: any;
        x = params.value.substring(0, 10);
        x = this.datepipe.transform(x, 'MM/dd/yyyy');
        x != null ? x : 'UA'
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo == null ? 'UA' : assignedTo} | ${x}`;
      }

    }
  }

  cellrendered_assignedClaims(headerName: any, params: any){
    switch(headerName){
      case 'touch': {
          if (params.value >= this.touch_count || params.value < this.touch_count) {
            return params.value;
          }
          else
            return '-Nil-';
      }
      case 'claim_no':{
          if(params.value || params.value !='')
          return params.value;
          else
          return '-Nil-';
      }
      case 'dos':{
        if(params.value){
          let x = params.value;
          x = this.datepipe.transform(x, 'MM/dd/yyyy');
          return `${x}`;
        }
        else {
          return '-Nil-';
        }
      }
      case 'age':{
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
      case 'billed_submit_date': {
        if (params.value || params.value !='')
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
      case 'statuscode': {
        if (params.value)
          return params.value;
        else
          return '-Nil-';
      }
      case 'substatuscode': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
        break;
      }
      case 'total_charges': {
        if (params.value) {
          if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); }
        }
        else
          return '-Nil-';
        break;
      }
      case 'total_ar': {
        if (params.value) { if (typeof (params.value) == 'string') { let x = parseInt(params.value); return x.toFixed(2); } }
        else
          return '-Nil-';
        break;
      }
      case 'claim_Status': {
        if (params.value) {
          return params.value;
        }
        else {
          return '-Nil-';
        }
      }
      case 'claims_notes': {
        if (params.value)
          return `<i class="fa fa-info-circle" aria-hidden="true" title="${params.value}"></i>`;
        else
          return '-Nil-';
      }
      case 'executive_work_date':{
        if(params.value){
          let x = params.value;
          x = this.datepipe.transform(x, 'MM/dd/yyyy');
          return `${x}`;
        }
        else {
          return '-Nil-';
        }
      }
      case 'assigned_to':{
        let x = params.value;
        const rowData = params.node.data;
        const created_ats = rowData.created_ats;
        const date = new Date(created_ats);
        let result = date.toLocaleDateString('en-US');
        return `${x!=null ? x : 'UA'} | ${result!=null ? result : 'UA'}`
      }
      }
    }

  cellrendered_WorkOrders(headerName: any, params: any) {
      switch (headerName) {
        case 'created': {
          let rowData = params.node.data;
          let assignedTo = rowData.created_at;
          assignedTo = assignedTo.substring(0, 10);
          assignedTo = this.datepipe.transform(assignedTo, 'MM/dd/yyyy');
          return `${params.value} | ${assignedTo}`
        }
        case 'work_order_name': {
          if (params.value)
            return params.value
          else
            return '-Nil';
        }
        case 'assigned_nos': {
          if (params.value)
            return params.value
          else
            return '-Nil';
        }
        case 'due_date': {
          if (params.value) {
            let x = params.value;
            x = this.datepipe.transform(x, 'MM/dd/yyyy');
            return `${x}`;
          }
          else
            return '-Nil';
        }
        case 'billed': {
          if (params.value)
            return params.value.toFixed(2);
          else
            return '-Nil';
        }
        case 'ar_due': {
          if (params.value || params.value == 0)
            return params.value.toFixed(2);
          else
            return '-Nil';
        }
        case 'status': {
          if (params.value)
            return params.value;
          else
            return '-Nil';
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
          if (params.value) {
            return `<i title="${params.value}"
            class="fa fa-file-text"></i>`
          }
        }
      }
    }

  CellClicked_AuditQue(headerName: any, params: any) {
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'dos': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'age': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'acct_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'patient_name': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'rendering_prov': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'responsibility': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'prim_ins_name': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'sec_ins_name': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'total_charges': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'claim_Status': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'denial_code': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'billed_submit_date': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'claim_note': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
        case 'assigned_to': {
          // this.openModal(this.template);
          this.claimslection(this.rowValue_ID_1?.[0]);
          break;
        }
      }
    }
  }

  CellClicked_ClosedClaims(headerName:any,params:any){
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_4?.[0]);
          this.note_refresh();
          break;
        }
        case 'dos': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_4?.[0]);
          this.note_refresh();
          break;
        }
        case 'age': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_4?.[0]);
          this.note_refresh();
          break;
        }
        case 'acct_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_4?.[0]);
          this.note_refresh();
          break;
        }
        case 'patient_name': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_4?.[0]);
          this.note_refresh();
          break;
        }
      }
    }
  }

  CellClicked_WorkOrders(headerName: any, params: any) {
    switch (headerName) {
      case 'created':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'work_order_name':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'assigned_nos':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'due_date':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'billed':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'ar_due':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'status':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'priority':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }
      case 'work_notes':
        {
          this.open(this.work_order_details);
          this.get_wo_details(this.rowValue_ID_2?.[0].id, this.rowValue_ID_2?.[0].work_order_name, this.rowValue_ID_2?.[0].created);
          break;
        }

    }
  }

  CellClicked_assignedClaims(headerName: any, params: any){
    switch(headerName){
      case 'claim_no':{
        this.openModal(this.claimpage);
        this.note_refresh();
        this.claimslection(this.rowValue_ID_3?.[0]);
        this.check_reassign_alloc(this.rowValue_ID_3?.[0]);
        break;
      }
      case 'dos':{
        this.openModal(this.claimpage);
        this.note_refresh();
        this.claimslection(this.rowValue_ID_3?.[0]);
        this.check_reassign_alloc(this.rowValue_ID_3?.[0]);
        break;
      }
      case 'age':{
        this.openModal(this.claimpage);
        this.note_refresh();
        this.claimslection(this.rowValue_ID_3?.[0]);
        this.check_reassign_alloc(this.rowValue_ID_3?.[0]);
        break;
      }

      case 'acct_no':{
        this.openModal(this.claimpage);
        this.note_refresh();
        this.claimslection(this.rowValue_ID_3?.[0]);
        this.check_reassign_alloc(this.rowValue_ID_3?.[0]);
        break;
      }

      case 'patient_name':{
        this.openModal(this.claimpage);
        this.note_refresh();
        this.claimslection(this.rowValue_ID_3?.[0]);
        this.check_reassign_alloc(this.rowValue_ID_3?.[0]);
        break;
      }
    }
  }

  onSearch() {
    this.myGrid_1.api.setQuickFilter(this.search_value);
    this.myGrid_3.api.setQuickFilter(this.search_value_assignedClaims);
  }

}

