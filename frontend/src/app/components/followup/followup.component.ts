import { Component,ViewChildren,QueryList,ElementRef, OnInit,Input,ChangeDetectionStrategy,HostListener,ViewEncapsulation, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { FollowupService } from '../../Services/followup.service';
import { NotesHandlerService } from '../../Services/notes-handler.service';
import { Subscription, never, Subject } from 'rxjs';
import { ExportFunctionsService } from '../../Services/export-functions.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { NotifyService } from '../../Services/notify.service';
import { debounceTime } from 'rxjs/operators';
import { pipe } from 'rxjs';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { ColDef, GridApi, GridOptions, GridReadyEvent, RowClassRules, RowNodeTransaction, SideBarDef, ToolPanelDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AuthService } from 'src/app/Services/auth.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import "ag-grid-enterprise";

@Component({
  selector: 'app-followup',
  templateUrl: './followup.component.html',
  styleUrls: ['./followup.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FollowupComponent implements OnInit, OnDestroy {


  assigned = "";
  reAssigned = "";
  closedWork = "";
  isCollapsed: boolean = true;
  search_value:any;

  assignedSelected:boolean = false;
  reassignedSelected:boolean = false;
  closedSelected:boolean = false;
  assigned_results: any[] = [];
  reassigned_results: any[] = [];
  closed_results: any[] = [];
  searchResults: any[] = [];
  assigned_selected_val:any = null;
  reassigned_selected_val:any = null;
  closed_selected_val:any = null;

  @ViewChildren("checkboxes") checkboxes!: QueryList<ElementRef>;

  public status_codes_data:Array<any> =[];
  public sub_status_codes_data:string[] = [];
  public status_options:any;
  public sub_options:any;
  decimal_pattern = "^\[0-9]+(\.[0-9][0-9])\-\[0-9]+(\.[0-9][0-9])?$";
  selecteds: any;
  selectedReAssigin: any;
  selectedClosed: any;
  alwaysShowCalendars: boolean;
  selectedAge = null;
  reassignedSelectedAge = null;
  closedSelectedAge = null;
  assigned_select_date: any;
  reassigned_select_date: any;
  closed_select_date: any;
  age_options:any = [{ "from_age": 0, "to_age": 30 },{ "from_age": 31, "to_age": 60 },{ "from_age": 61, "to_age": 90 },{ "from_age": 91, "to_age": 120 },{ "from_age": 121, "to_age": 180 },{ "from_age": 181, "to_age": 365 }];
  ranges: any = {
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

  response_data: Subscription;
  update_monitor: Subscription;
  subscription!: Subscription;
  total: number = 0;
  total_reallocated: number = 0;
  constructor(
    private formBuilder: FormBuilder,
    private Jarwis: JarwisService,
    public setus: SetUserService,
    private loadingBar: LoadingBarService,
    private modalService: NgbModal,
    private follow: FollowupService,
    private notes_hadler:NotesHandlerService,
    private export_handler:ExportFunctionsService,
    public toastr: ToastrManager,
    private notify_service:NotifyService,
    private datepipe: DatePipe,
    private modal: BsModalService,
    private auth : AuthService,
    private loader : NgxUiLoaderService
  ) {
    this.response_data=this.notes_hadler.get_response_data('followup').subscribe((message:any) => { this.collect_response(message) });
    this.update_monitor=this.notes_hadler.refresh_update().subscribe(message => {

      if(this.request_monitor <1)
      {
        this.getclaim_details(this.pages,'refresh','null','null','null','null',null,null,null,null);
        this.request_monitor++;
      }
    });
    this.alwaysShowCalendars = true;
  }
    request_monitor:number=0;
    public table_fields : string[] = [];
    public workorder_table:any =[];
    // public total_assigned:number=0;
    public claim_notes_data_list:any =[];
    current_claim_type:string = '';
    closeResult : string = '';
    total_claims:number = 0;
    pages:number = 0;
    claim_notes_data :Array<any> =[];
    completed_claims:any=[];
    total_completed_claims:number = 0;
    comp_pages:number = 0;
    tab_load:boolean=false;
    claim_active:any;
    allocated_claims:any=[];
    reallocated_claims:any=[];
    total_allocated:number = 0 ;
    total_realPlocated:number = 0;
    alloc_pages:number = 0;
    realloc_pages:number = 0;
    loading:boolean = true;
    sortByAsc: boolean = true;


    formdata = new FormData();
    processNotes!: FormGroup;
    claimNotes!: FormGroup;
    assignedClaimsFind!: FormGroup;
    reassignedClaimsFind!: FormGroup;
    closedClaimsFind!: FormGroup;
    search_data: FormControl = new FormControl();
    wo_search_data: FormControl = new FormControl();
    filter_option: FormControl = new FormControl();



    //Red Alerrt Box
private _opened: boolean = false;
private isOpen: boolean = false;
private _positionNum: number = 0;
private _modeNum: number = 1;
table_datas : string[]=[];


private _MODES: Array<string> = ['push'];
private _POSITIONS: Array<string> = ['right'];

private redalert() {
 this._opened = !this._opened;
}

private mynotes(){
    this.isOpen=!this.isOpen;
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

current_total:any;
skip:any;
total_row:any;
skip_row:any;
current_row:any;
assigned_claims:any;
reassigned_claims_data:any;
completed_claims_data:any;
reallocate_total_row:any;

//Assign Work Order Table Data
    public form_table(data:any,type:any,form_type:any)
    {
      if(form_type==null)
      {
      if(type=="wo")
      {
        if(data)
        {this.table_fields=data.data.fields;
          this.workorder_table=data.data.datas;
          this.total_claims=data.count;}
        // this.total_assigned=6;
      }
      else if(type=='completed'){
        console.log('INNN333');
        if(data){
          this.completed_claims=data.data.datas;
          this.GridrowData3 = this.completed_claims;
          this.myGrid_3.api.setRowData(this.GridrowData3);
          this.gridApi_3.closeToolPanel();
          this.myGrid_3.api?.sizeColumnsToFit();
          this.loader.stop();
          this.completed_claims_data = data.data.datas;
          this.total_completed_claims=data.count;

          this.total=data.total;
          this.current_total= data.current_total;
          this.skip = data.skip + 1;
          this.total_row = data.count;
          // this.setus.change_status.next(false);
        }
        else
        {
          this.GridrowData3=[];
          this.myGrid_3.api.setRowData(this.GridrowData3);
          this.gridApi_3.closeToolPanel();
          this.loader.stop();
        }
        // this.completed_claims_data = data.selected_claim_data;


        this.skip_row = this.skip;
        this.current_row = this.skip + this.current_total - 1;

      }
      else if(type=='allocated')
      {
        console.log('INNN11');
        if(data){
          this.allocated_claims=data.data.datas;
          this.GridrowData1 = this.allocated_claims;
          this.myGrid_1.api.setRowData(this.GridrowData1);
          this.gridApi_1.closeToolPanel();
          this.myGrid_1.api?.sizeColumnsToFit();
          this.loader.stop();
          this.assigned_claims = data.data.datas;
          this.total_allocated=data.count;
          this.total=data.total;
          this.current_total= data.current_total;
          this.skip = data.skip + 1;
          this.total_row = data.count;
        }
        else
        {
          this.GridrowData1=[];
          this.myGrid_1.api.setRowData(this.GridrowData1);
          this.gridApi_1.closeToolPanel();
          this.loader.stop();
        }



        console.log('allocated_claims',this.allocated_claims);
        // this.assigned_claims = data.selected_claim_data;


        this.skip_row = this.skip;
        this.current_row = this.skip + this.current_total - 1;


      }
	  else if(type=='reallocated')
      {

        console.log('INNN22');
        if(data){
          this.reallocated_claims=data.data.datas;
          this.GridrowData2 = this.reallocated_claims;
          // this.myGrid_2.api.setRowData(this.GridrowData2);
          // this.gridApi_2.closeToolPanel();
          this.loader.stop();
          this.reassigned_claims_data = data.data.datas;
          this.total_reallocated=data.count;

          this.total=data.total;
          this.current_total= data.current_total;
          this.skip = data.skip + 1;
          this.reallocate_total_row = data.current_total;
        }
        else
        {
          this.GridrowData2 = [];
          // this.myGrid_2.api.setRowData(this.GridrowData2);
          // this.gridApi_2.closeToolPanel();
          this.loader.stop();
        }
        console.log('reallocated_claims',this.reallocated_claims);
        // this.reassigned_claims_data = data.selected_claim_data;


        this.skip_row = this.skip;
        this.current_row = this.skip + this.current_total - 1;


      }
      this.tab_load=false;
    }
    else if(form_type == 'refresh')
    {
      let new_claim;

      if(type=="wo")
      {
        this.table_fields=data.data.fields;
        this.workorder_table=data.data.datas;
        this.total_claims=data.count;
        //console.log("In WO",this.claim_active,this.workorder_table )
        if(this.claim_active != undefined)
        {
          new_claim=this.workorder_table.find((x:any) => x.claim_no == this.claim_active['claim_no']);
        }

        if(new_claim == undefined)
        {
          new_claim=this.claim_active;
        }

      }
      else if(type=='allocated')
      {
    // console.log(data);
        this.allocated_claims=data.data.datas;
        // this.assigned_claims = data.selected_claim_data;
        this.assigned_claims = data.data.datas;
        console.log(this.assigned_claims);
        this.total_allocated=data.count;
        if(this.claim_active != undefined)
        {
        new_claim=this.allocated_claims.find((x:any) => x.claim_no == this.claim_active['claim_no']);
        }
      }
	   else if(type=='reallocated')
      {
        // console.log(data);
        this.reallocated_claims=data.data.datas;
        // this.reassigned_claims_data = data.selected_claim_data;
        this.reassigned_claims_data = data.data.datas;
        this.total_reallocated=data.count;
        if(this.claim_active != undefined)
        {
        new_claim=this.reallocated_claims.find((x:any) => x.claim_no == this.claim_active['claim_no']);
        }
      }
      else if(type=='completed'){
        this.completed_claims=data.data.datas;
        // this.completed_claims_data = data.selected_claim_data;
        this.completed_claims_data = data.data.datas;
        this.total_completed_claims=data.count;
        if(this.claim_active != undefined)
        {
        new_claim=this.completed_claims.find((x:any) => x.claim_no == this.claim_active['claim_no']);
        }
      }
      if(this.claim_active != undefined)
      {


        //console.log("Here",this.main_tab);
      if(this.main_tab==true)
      {
        //console.log("Main",this.claim_active);
        this.getnotes(this.claim_active);
      //console.log("NewClaims",new_claim)
        this.claimslection(new_claim);
      }
      else{


        let claim_active:any=this.refer_claim_det.find((x:any) => x.claim_no == this.active_claim);
        // console.log('ref',claim_active);

        this.Jarwis.getnotes(claim_active).subscribe(
          (data:any)  =>{
            let prcs_data={data:data['data']['process']};
            let refer_data ={data:data['data']['claim']};
            let qc_data = {data:data['data']['qc']};
            this.update_refer_notes(prcs_data,'processnotes',claim_active.claim_no);
            this.update_refer_notes(refer_data,'claimnotes',claim_active.claim_no);
            this.update_refer_notes(qc_data,'qcnotes',claim_active.claim_no);
          } ,
          error =>console.log("THeis1",error)
        );

        // console.log("Goos sdhfb",this.refer_claim_notes,this.refer_process_notes,this.refer_qc_notes,this.refer_client_notes);

        this.referclaim(claim_active);
    }
    }
    this.tab_load=false;
  }

  // console.log('Deploy Trie');
    }

sorting_name:any;


order_list(type:any, sort_type:any,sorting_name:any,sorting_method: string,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any)
{
  this.sorting_name = sort_type;

  if(this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.alloc_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  } else {
      this.sortByAsc = true;
      this.getclaim_details(this.alloc_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  }

}

closed_sorting_name:any;

completed_order_list(type: any, sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any)
{
  this.closed_sorting_name = sort_type;

  if(this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.comp_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  } else {
      this.sortByAsc = true;
      this.getclaim_details(this.comp_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  }

}

reassigned_sorting_name:any;

reassigned_order_list(type: any, sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any)
{
  this.reassigned_sorting_name = sort_type;

  if(this.sortByAsc == true) {
      this.sortByAsc = false;
      this.getclaim_details(this.realloc_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  } else {
      this.sortByAsc = true;
      this.getclaim_details(this.realloc_pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,null,null,search);
  }

}

search:any;
assignedclaims_filter:any;
reassignedclaims_filter:any;
closedclaims_filter:any;
public assigned_claims_filter(page: number,type: any,sort_data: any,sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any){
  this.assignedclaims_filter = search;
  this.getclaim_details(page,type,sort_data,sort_type,sorting_name,sorting_method,assign_claim_searh,reassign_claim_searh,closed_claim_searh,search);
}

public reassigned_claims_filter(page: number,type: any,sort_data: any,sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any){
  this.reassignedclaims_filter = search;
  this.getclaim_details(page,type,sort_data,sort_type,sorting_name,sorting_method,assign_claim_searh,reassign_claim_searh,closed_claim_searh,search);
}

public closed_claims_filter(page: number,type: any,sort_data: any,sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any){
  this.closedclaims_filter = search;
  this.getclaim_details(page,type,sort_data,sort_type,sorting_name,sorting_method,assign_claim_searh,reassign_claim_searh,closed_claim_searh,search);
}

claim_status_codes:any=[];
claim_sub_status_codes:any=[];
//Get Work Order Table Data
type:any;
types:any;
  public getclaim_details(page:number,type: any,sort_data:any,sort_type: any,sorting_name: any,sorting_method: any,assign_claim_searh: any,reassign_claim_searh: any,closed_claim_searh: any,search: any)
{
  this.loader.start()
  this.search = search;
  this.type = type;
  let page_count=15;
  console.log("ip",type);
  let form_type:any=null;
  let searchs = this.search;
  console.log(searchs);

  if(type=='wo')
  {
    this.types='wo';
    this.pages=page;
    this.current_claim_type='wo';
    this.Jarwis.get_table_page(this.setus.getId(),page,page_count,type,sort_data,sort_type,null,null).subscribe(
      data  => this.assign_page_data(data),
      error => this.handleError(error)
      );
  }
  else if(type=='completed'){
    this.setus.change_status.next(false);
    this.comp_pages=page;
    this.current_claim_type='completed';
    this.types='completed';

    let closedSearch_notNull:any = [];
    let nullVal:boolean = false;
    let closedClaims_searchValue:any = [this.closedClaimsFind.value];
    if (typeof closedClaims_searchValue === 'object' && closedClaims_searchValue !== null) {
      Object.keys(closedClaims_searchValue).forEach(key => {
        if (typeof closedClaims_searchValue[key] === 'object' && closedClaims_searchValue[key] !== null) {
          Object.keys(closedClaims_searchValue[key]).forEach(val => {
            if(typeof closedClaims_searchValue[key][val] === 'object' && closedClaims_searchValue[key][val] !== null) {
              Object.keys(closedClaims_searchValue[key][val]).forEach(data => {
                if(closedClaims_searchValue[key][val][data] === null){
                  nullVal = false;
                }
                else{
                  nullVal = true;
                }
              });
              closedSearch_notNull.push(nullVal);
            }
            else if (typeof closedClaims_searchValue[key][val] !== 'object' && closedClaims_searchValue[key][val] !== null && closedClaims_searchValue[key][val] != ''){
              nullVal = true;
              closedSearch_notNull.push(nullVal);
            }
            else if (typeof closedClaims_searchValue[key][val] !== 'object' && closedClaims_searchValue[key][val] !== null && closedClaims_searchValue[key][val] == ''){
              nullVal = false;
              closedSearch_notNull.push(nullVal);
            }
          });
        }
      });
    }
    if(closedSearch_notNull.some((x: any) => x === true)){
      this.search = this.closedclaims_filter;
      search = this.search;
    }
    else{
      this.search=null;
      sort_data = 'null';
      sort_type = 'null';
      sorting_name = 'null';
      sorting_method = 'null';
      search = this.search;
    }

    searchs = this.search;
    if(sorting_name == 'null' && searchs != 'search'){
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }else if(searchs == 'search'){
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

      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.closed_sorting_name,this.sortByAsc,null,null,this.closedClaimsFind.value,this.search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,this.closedClaimsFind.value).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }else{
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.closed_sorting_name,this.sortByAsc,null,null,null,this.search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }
  }
  else if(type=='allocated')
  {
    this.alloc_pages=page;
    this.types='allocated';
    this.current_claim_type='allocated';

    let assignedSearch_notNull:any = [];
    let nullVal:boolean = false;
	  let assignedClaims_searchValue:any = [this.assignedClaimsFind.value];
      if (typeof assignedClaims_searchValue === 'object' && assignedClaims_searchValue !== null) {
        Object.keys(assignedClaims_searchValue).forEach(key => {
          if (typeof assignedClaims_searchValue[key] === 'object' && assignedClaims_searchValue[key] !== null) {
            Object.keys(assignedClaims_searchValue[key]).forEach(val => {
              if(typeof assignedClaims_searchValue[key][val] === 'object' && assignedClaims_searchValue[key][val] !== null) {
                Object.keys(assignedClaims_searchValue[key][val]).forEach(data => {
                  if(assignedClaims_searchValue[key][val][data] === null){
                    nullVal = false;
                  }
                  else{
                    nullVal = true;
                  }
                });
                assignedSearch_notNull.push(nullVal);
              }
              else if (typeof assignedClaims_searchValue[key][val] !== 'object' && assignedClaims_searchValue[key][val] !== null && assignedClaims_searchValue[key][val] != ''){
                nullVal = true;
                assignedSearch_notNull.push(nullVal);
              }
              else if (typeof assignedClaims_searchValue[key][val] !== 'object' && assignedClaims_searchValue[key][val] !== null && assignedClaims_searchValue[key][val] == ''){
                nullVal = false;
                assignedSearch_notNull.push(nullVal);
              }
            });
          }
        });
      }
      if(assignedSearch_notNull.some((x: boolean) => x === true)){
        this.search = this.assignedclaims_filter;
        search = this.search;
        sort_data = null;
        sort_type = null;
      }
      else{
        this.search=null;
		    sort_data = 'null';
        sort_type = 'null';
		    sorting_name = 'null';
        sorting_method = 'null';
        search = this.search;
      }

    searchs = this.search;
    if(sorting_name == 'null' && searchs != 'search'){
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );

      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )

    }else if(searchs == 'search'){
      if (this.assignedClaimsFind.value.dos?.[0] != null && this.assignedClaimsFind.value.dos?.[1] != null) {
        console.log(this.assignedClaimsFind.controls['dos'].value);
        this.assignedClaimsFind.value.dos['startDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.dos['endDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.dos.pop(this.assignedClaimsFind.value.dos[0]);
          this.assignedClaimsFind.value.dos.pop(this.assignedClaimsFind.value.dos[1]);
          const obj = { ... this.assignedClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.assignedClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.assignedClaimsFind.value.dos);
      }
      if (this.assignedClaimsFind.value.date?.[0] != null && this.assignedClaimsFind.value.date?.[1] != null) {
        console.log(this.assignedClaimsFind.controls['date'].value);
        this.assignedClaimsFind.value.date['startDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.date['endDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.date.pop(this.assignedClaimsFind.value.date[0]);
        this.assignedClaimsFind.value.date.pop(this.assignedClaimsFind.value.date[1]);
        const obj = { ... this.assignedClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

        this.assignedClaimsFind.value.date = obj;
        console.log('OBJ', obj);

        console.log('Updated claims', this.assignedClaimsFind.value.date);
      }
      if (this.assignedClaimsFind.value.bill_submit_date?.[0] != null && this.assignedClaimsFind.value.bill_submit_date?.[1] != null) {
        this.assignedClaimsFind.value.bill_submit_date['startDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.bill_submit_date['endDate'] = this.datepipe.transform(new Date(this.assignedClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
        this.assignedClaimsFind.value.bill_submit_date.pop(this.assignedClaimsFind.value.bill_submit_date[0]);
        this.assignedClaimsFind.value.bill_submit_date.pop(this.assignedClaimsFind.value.bill_submit_date[1]);
        const obj = { ... this.assignedClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

        this.assignedClaimsFind.value.bill_submit_date = obj;
        console.log('OBJ', obj);

        console.log('Updated claims', this.assignedClaimsFind.value.bill_submit_date);
      }

      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.sorting_name,this.sortByAsc,this.assignedClaimsFind.value,null,null,this.search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );

      this.Jarwis.getclaim_details_new(this.setus.getId(),type,this.assignedClaimsFind.value,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }else{
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.sorting_name,this.sortByAsc,null,null,null,this.search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,this.assignedClaimsFind.value,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }
  }
  else if(type=='reallocated')
  {
    this.realloc_pages=page;
    this.types='reallocated';
    this.current_claim_type='reallocated';

    let reassignedSearch_notNull:any = [];
    let nullVal:boolean = false;
	  let reassignedClaims_searchValue:any = [this.reassignedClaimsFind.value];
      if (typeof reassignedClaims_searchValue === 'object' && reassignedClaims_searchValue !== null) {
        Object.keys(reassignedClaims_searchValue).forEach(key => {
          if (typeof reassignedClaims_searchValue[key] === 'object' && reassignedClaims_searchValue[key] !== null) {
            Object.keys(reassignedClaims_searchValue[key]).forEach(val => {
              if(typeof reassignedClaims_searchValue[key][val] === 'object' && reassignedClaims_searchValue[key][val] !== null) {
                Object.keys(reassignedClaims_searchValue[key][val]).forEach(data => {
                  if(reassignedClaims_searchValue[key][val][data] === null){
                    nullVal = false;
                  }
                  else{
                    nullVal = true;
                  }
                });
                reassignedSearch_notNull.push(nullVal);
              }
              else if (typeof reassignedClaims_searchValue[key][val] !== 'object' && reassignedClaims_searchValue[key][val] !== null && reassignedClaims_searchValue[key][val] != ''){
                nullVal = true;
                reassignedSearch_notNull.push(nullVal);
              }
              else if (typeof reassignedClaims_searchValue[key][val] !== 'object' && reassignedClaims_searchValue[key][val] !== null && reassignedClaims_searchValue[key][val] == ''){
                nullVal = false;
                reassignedSearch_notNull.push(nullVal);
              }
            });
          }
        });
      }
      if(reassignedSearch_notNull.some((x: boolean) => x === true)){
        this.search = this.reassignedclaims_filter;
        search = this.search;
        sort_data = null;
        sort_type = null;
      }
      else{
        this.search=null;
		    sort_data = 'null';
        sort_type = 'null';
		    sorting_name = 'null';
        sorting_method = 'null';
        search = this.search;
      }

    searchs = this.search;
    if(sorting_name == 'null' && searchs != 'search'){
      console.log(searchs);
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }else if(searchs == 'search'){
      console.log('++++++++++++++++');
        this.realloc_pages=page;
        this.current_claim_type='reallocated';
        if (this.reassignedClaimsFind.value.dos?.[0] != null && this.reassignedClaimsFind.value.dos?.[1] != null) {
          console.log(this.reassignedClaimsFind.controls['dos'].value);
          this.reassignedClaimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.dos?.[0]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.dos?.[1]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.dos.pop(this.reassignedClaimsFind.value.dos[0]);
          this.reassignedClaimsFind.value.dos.pop(this.reassignedClaimsFind.value.dos[1]);
          const obj = { ... this.reassignedClaimsFind.controls['dos'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.reassignedClaimsFind.value.dos = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.reassignedClaimsFind.value.dos);

        }
        if (this.reassignedClaimsFind.value.date?.[0] != null && this.reassignedClaimsFind.value.date?.[1] != null) {
          console.log(this.reassignedClaimsFind.controls['date'].value);
          this.reassignedClaimsFind.value.date.startDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.date?.[0]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.date.endDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.date?.[1]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.date.pop(this.reassignedClaimsFind.value.date[0]);
          this.reassignedClaimsFind.value.date.pop(this.reassignedClaimsFind.value.date[1]);
          const obj = { ... this.reassignedClaimsFind.controls['date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.reassignedClaimsFind.value.date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.reassignedClaimsFind.value.date);
        }
        if (this.reassignedClaimsFind.value.bill_submit_date?.[0] != null && this.reassignedClaimsFind.value.bill_submit_date?.[1] != null) {
          this.reassignedClaimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.bill_submit_date?.[0]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.reassignedClaimsFind.value.bill_submit_date?.[1]), 'yyyy-MM-dd');
          this.reassignedClaimsFind.value.bill_submit_date.pop(this.reassignedClaimsFind.value.bill_submit_date[0]);
          this.reassignedClaimsFind.value.bill_submit_date.pop(this.reassignedClaimsFind.value.bill_submit_date[1]);
          const obj = { ... this.reassignedClaimsFind.controls['bill_submit_date'].value }; // { 0: 1, 1: 2, 2: 3 }

          this.reassignedClaimsFind.value.bill_submit_date = obj;
          console.log('OBJ', obj);

          console.log('Updated claims', this.reassignedClaimsFind.value.bill_submit_date);
        }

        // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.reassigned_sorting_name,this.sortByAsc,null,this.reassignedClaimsFind.value,null,this.search).subscribe(
        //   data  => this.form_table(data,type,form_type),
        //   error => this.handleError(error)
        // );
        this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,this.reassignedClaimsFind.value,null).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        )
    }else{
      this.realloc_pages=page;
      this.current_claim_type='reallocated';
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.reassigned_sorting_name,this.sortByAsc,null,null,null,this.search).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );
      this.Jarwis.getclaim_details_new(this.setus.getId(),type,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      )
    }
  }
  else if(type == 'refresh')
  {

    if(type == 'refresh')
    {
      type=this.current_claim_type;
      // console.log("Get",this.current_claim_type);
      form_type='refresh';

      if(type == 'wo')
      {
        page=this.pages;
      }
      else if(type=='completed'){
        page=this.comp_pages;
      }
      else if(type=='allocated')
      {
        page=this.alloc_pages;
      }
	    else if(type=='reallocated')
      {
        page=this.realloc_pages;
      }
    }
    if(type=='allocated' ){
      if(sorting_name == 'null' && searchs != 'search'){
        console.log('middle');
        this.alloc_pages=page;
          this.current_claim_type='allocated';
        this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }else if(searchs == 'search'){
          console.log('middle');
           this.alloc_pages=page;
          this.current_claim_type='allocated';
          this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.sorting_name,this.sortByAsc,this.assignedClaimsFind.value,null,null,this.search).subscribe(
            data  => this.form_table(data,type,form_type),
            error => this.handleError(error)
          );
        }else if(sorting_name != 'null'){
          console.log('last');
         this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.sorting_name,this.sortByAsc,null,null,null,search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }
    }else if(type=='reallocated'){
      console.log('com'+type);
      if(sorting_name == 'null' && searchs != 'search'){
        console.log('first');
        this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }else if(searchs == 'search'){
        console.log('-----------');
           this.alloc_pages=page;
        this.current_claim_type='reallocated';
        this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.reassigned_sorting_name,this.sortByAsc,null,this.reassignedClaimsFind.value,null,this.search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }else if(sorting_name != 'null'){
        console.log('second');
         this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.reassigned_sorting_name,this.sortByAsc,null,null,null,this.search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }
    }else if(type=='completed'){
      console.log('com'+type);
      if(sorting_name == 'null'  && searchs != 'search'){
        this.comp_pages=page;
        this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,null,null,search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }else if(searchs == 'search'){
           this.comp_pages=page;
        this.current_claim_type='reallocated';
        this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.closed_sorting_name,this.sortByAsc,null,null,this.closedClaimsFind.value,this.search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }else if(sorting_name != 'null'){
        this.comp_pages=page;
         this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.closed_sorting_name,this.sortByAsc,null,null,null,this.search).subscribe(
          data  => this.form_table(data,type,form_type),
          error => this.handleError(error)
        );
      }
    }
  }
  console.log(type);
  this.tab_load=true;
}

selected_status_code=[];
selected_sub_status_code=[];
//Assign Status codes
public assign_status_codes(data:any)
{
this.claim_status_codes=data.status;
this.claim_sub_status_codes=data.sub_status;
}

//Change values of substatus
public change_sub_status_code($event:any)
{
  this.selected_status_code=$event.target.value;
   this.selected_sub_status_code=this.claim_sub_status_codes[$event.target.value];
}
selected_filter_type=[];
//set filter type
public claim_filter_type($event:any)
{
this.selected_filter_type=$event.target.value;

this.claim_sort_filter();
}
//sort with filter
public claim_sort_filter()
{
this.getclaim_details(1,'all',null,null,'null','null',null,null,null,null);
}

//Assign Table data and `total values
public assign_page_data(data:any)
{
  this.workorder_table=data.data;
 setTimeout(() => {
  this.myGrid_1.api?.sizeColumnsToFit();
 }, 1000);
//  console.log(this.workorder_table);
  this.total=data.total;
  this.loader.stop();
}



searchData:string = '';
//Search filter function
public sort_data(data:any)
{
  this.getclaim_details(1,'wo',data,'searchFilter','null','null',null,null,null,null);
  this.searchData=data;
  // To reset the checklist
  this.check_all[1]=false;
  this.selected_claim_nos=[];

  //console.log(this.searchData);
}
public sort_table(data:any)
{
this.getclaim_details(1,'wo',data,'filters','null','null',null,null,null,null);
}

public export_files(type:any)
{
  let filter='all claims';
  let s_code='adjustment';

  this.Jarwis.fetch_followup_export_data(filter,s_code,this.setus.getId()).subscribe(
    data  => this.export_handler.sort_export_data(data,type,'claim'),
    error => this.error_handler(error)
    );
}

public handleError(error:any)
{
  console.log(error);
}

//Open and Close Modal
open(content:any) {
  this.modalService.open(content, { centered: true ,windowClass:'custom-class'}).result.then((result) => {
    this.closeResult = `${result}`;
  }, (reason) => {
    this.closeResult = `${this.getDismissReason()}`;
  });
}

private getDismissReason() {
  this.close_clear_data();
  }

//Managing Values displayed in Modal
  claim_clicked: any= [];
  claim_related: any= [];
  process_notes: any = [];
claim_notes:any= [];
qc_notes:any = [];
client_notes:any = [];
line_data:any=[];
toal:number = 0;
claim_note:any;
assigned_to:any;
created_at:any;
public claim_no:any;
public claimslection(claim:any)
{
  console.log('claim',claim);
  const dateTime = new Date(claim.created_at);
  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const date = String(dateTime.getDate()).padStart(2, '0');
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getSeconds()).padStart(2, '0');
  let x =  `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
  const dateTime1 = new Date(claim.updated_at);
  const year1 = dateTime1.getFullYear();
  const month1 = String(dateTime.getMonth() + 1).padStart(2, '0');
  const date1 = String(dateTime.getDate()).padStart(2, '0');
  const hours1 = String(dateTime.getHours()).padStart(2, '0');
  const minutes1 = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds1 = String(dateTime.getSeconds()).padStart(2, '0');
  let y =  `${year1}-${month1}-${date1} ${hours1}:${minutes1}:${seconds1}`;
  claim.created_at = x;
  claim.updated_at = y;
  console.log('UPDATED CLIAM', claim);
  this.claim_no = claim?.claim_no;
  this.claim_note = claim?.claim_note;
  console.log('claim_note',this.claim_note);
  this.assigned_to = claim?.assigned_to;
  this.created_at = claim?.created_at;
  this.loading=true;
  this.get_line_items(claim);
  this.check_reassign_alloc(claim);
  this.clear_refer();
  this.claim_clicked=claim;
  let length=this.workorder_table.length;
  this.claim_related=[];
  this.get_related(claim);
  // for(let i=0;i<this.workorder_table.length;i++)
  // {
  //   let related_length=this.claim_related.length;
  //   length= length-1;
  //   if(related_length<3)
  //   {
  //     if(this.workorder_table[length]['acct_no'] == claim.acct_no && this.workorder_table[length]['claim_no'] != claim.claim_no )
  //     {
  //      this.claim_related.push(this.workorder_table[length]);
  //     }
  //   }
  // }

  // console.log("Related",this.claim_related,this.workorder_table)
  this.send_calim_det('footer_data');
  this.getnotes(this.claim_clicked);
  this.check_reassign_alloc(this.claim_clicked);
  //this.processNotesDelete(this.claim_no);
}

processNotesDelete(data:any){
  this.Jarwis.followup_process_notes_delete(data, this.setus.getId()).subscribe(
    data  => this.handleResponseProcess(data),
    error => this.handleError(error)
  );
}

handleResponseProcess(data:any){
  this.getnotes(this.claim_clicked);
}


get_related(claim:any)
{
  this.Jarwis.get_related_calims(claim,'followup',this.setus.getId()).subscribe(
    data  => this.list_related(data),
    error => console.log(error)
    );
}

list_related(claims:any)
{
    this.claim_related = claims.data;
}

//Refer Claim Clicked Action
refer_claim_det:any=[];
refer_claim_no:any=[];
refer_claim_notes:any=[];
refer_process_notes:any=[];
refer_qc_notes:any=[];
main_tab:boolean=true;
active_tab:any=[];
active_refer_claim:any=[];
active_refer_process:any=[];
active_refer_qc:any=[];
active_claim:any;
refer_claim_notes_nos:any=[];
refer_process_notes_nos:any=[];
refer_qc_notes_nos:any=[];
refer_client_notes_nos:any=[];
refer_client_notes:any=[];
active_refer_client:any=[];
refer_claim_editable:string='false';
claim_status:any;
claim_nos:any;

claim_type:any;
public claim_tab_name(claim_type:any){
  this.claim_type = claim_type;
  // alert('claim_no1 ' + this.claim_type);
}

public referclaim(claim:any)
{
 claim = claim.claim;

  this.claim_nos = claim.claim_no;

  this.claim_status = claim.claim_Status;
  this.Jarwis.get_claimno(this.claim_nos, this.setus.getId(), this.claim_status, this.type).subscribe(
    data  => this.handleClaimNo(data),
    error => this.handleError(error)
  );


  if(this.refer_claim_no.indexOf(claim['claim_no']) < 0 )
  {
    this.refer_claim_det.push(claim);
    this.refer_claim_no.push(claim['claim_no']);

    // console.log("Into ref",claim)
    this.Jarwis.getnotes(claim).subscribe(
      data  => this.refer_notes(data,claim.claim_no),
      error => console.log("THeis2",error)
    );
  }
  else
  {
  this.selected_tab(claim['claim_no']);
  }
   this.send_calim_det('footer_data');
}

  assigned_data:any;

public handleClaimNo(data:any){
  this.assigned_data = data.claim_count;
  this.refer_claim(this.assigned_data);
}

refer_claim(assigned_data:any){

  //alert('claim_no');

    if(assigned_data == true ){
        this.refer_claim_editable = 'true';
     console.log(this.refer_claim_editable)
    // alert('claim_no1');
    }else if(assigned_data == false ){
      this.refer_claim_editable = 'false';
      console.log(this.refer_claim_editable);
     // alert('claim_no2');
    }
}

//Display Reference Notes
public refer_notes(data:any , claimno:any)
{
  // this.get_line_items(this.claim_clicked);

  this.refer_claim_notes_nos.push(claimno);
  this.refer_claim_notes.push(data.data.claim);

  this.refer_process_notes_nos.push(claimno);
  this.refer_process_notes.push(data.data.process);

  this.refer_qc_notes_nos.push(claimno);
  this.refer_qc_notes.push(data.data.qc);

  this.refer_client_notes_nos.push(claimno);
  this.refer_client_notes.push(data.data.client);


  let index_claim= this.refer_claim_notes_nos.indexOf(claimno);
  let index_process= this.refer_process_notes_nos.indexOf(claimno);
  let index_qc= this.refer_qc_notes_nos.indexOf(claimno);
  let index_client= this.refer_client_notes_nos.indexOf(claimno);

  this.active_refer_claim=  this.refer_claim_notes[index_claim];
  this.active_refer_process=this.refer_process_notes[index_process];
  this.active_refer_qc=this.refer_qc_notes[index_qc];
  this.active_refer_client=this.refer_client_notes[index_client];

  this.main_tab=false;
  this.active_claim=claimno;
  this.send_calim_det('footer_data');
}

public update_refer_notes(data:any,type:any,claimno:any)
{
  // this.get_line_items(claimno);
  let index_up_qc= this.refer_qc_notes_nos.indexOf(claimno);
  let index_up_process = this.refer_process_notes_nos.indexOf(claimno);
  let index_up_claim=this.refer_claim_notes_nos.indexOf(claimno);
  if(type=='processnotes')
  {
    if(index_up_process==undefined)
    {
      this.refer_process_notes_nos.push(claimno);
      this.refer_process_notes.push(data.data);
      index_up_process = this.refer_process_notes_nos.indexOf(claimno);
    }
    else{
      this.refer_process_notes[index_up_process]=data.data;
    }

  // this.refer_process_notes[claimno]=data.data;
  }
  else if(type=='claimnotes')
  {
    if(index_up_claim==undefined)
    {
      this.refer_claim_notes_nos.push(claimno);
      this.refer_claim_notes.push(data.data);
      index_up_claim=this.refer_claim_notes_nos.indexOf(claimno);
    }
    else{
      this.refer_claim_notes[index_up_claim]=data.data;
    }

    this.refer_claim_notes[claimno]=data.data;

    console.log(this.refer_claim_notes[claimno]);
  }
  else if(type=='qcnotes')
  {
    if(index_up_qc==undefined)
    {
      this.refer_qc_notes_nos.push(claimno);
      this.refer_qc_notes.push(data.data);
      index_up_qc= this.refer_qc_notes_nos.indexOf(claimno);
    }
    else{
      this.refer_qc_notes[index_up_qc]=data.data;
    }

  }
  this.active_refer_claim= this.refer_claim_notes[index_up_claim];
  this.active_refer_process=this.refer_process_notes[index_up_process];
  this.active_refer_qc=this.refer_qc_notes[index_up_qc];
}

//Focus on Selected Tab
public selected_tab(claimno:any)
{
if(claimno == 'maintab')
{
  this.main_tab=true;
  this.active_claim=[];
}
else{

    let index_qc= this.refer_qc_notes_nos.indexOf(claimno);
    let index_process = this.refer_process_notes_nos.indexOf(claimno);
    let index_claim=this.refer_claim_notes_nos.indexOf(claimno);
    let index_client=this.refer_claim_notes_nos.indexOf(claimno);

    this.active_refer_claim= this.refer_claim_notes[index_claim];
    this.active_refer_process=this.refer_process_notes[index_process];
    this.active_refer_qc=this.refer_qc_notes[index_qc];
    this.active_refer_client=this.refer_client_notes[index_client];
    this.main_tab=false;
    this.active_claim=claimno;
}
this.send_calim_det('footer_data');
this.send_calim_det('followup');
}

//Close Refer Tab
public close_tab(claim_no:any)
{
  let index=this.refer_claim_det.indexOf(claim_no);
  let list_index=this.refer_claim_no.indexOf(claim_no.claim_no)
  this.refer_claim_det.splice(index, 1);
  this.refer_claim_no.splice(list_index, 1);
  this.main_tab=true;
  this.active_claim=[];
  this.send_calim_det('footer_data');
  this.send_calim_det('followup');
  this.get_line_items(this.claim_clicked);
  this.check_reassign_alloc(this.claim_clicked);
}

//Clear Tabs Details
public clear_refer()
{
  this.main_tab=true;
  this.active_claim=[];
  this.refer_claim_det=[];
  this.refer_claim_no=[];
}

//Get Notes
public getnotes(claim:any)
{
  this.process_notes=[];
  this.claim_notes=[];
  this.qc_notes=[];
  this.client_notes=[];
  let type='All';

  // console.log("Getnot",claim)
  this.Jarwis.getnotes(claim).subscribe(
    data  => this.display_notes(data,type),
    error => this.handleError(error)
  );
}

//Update Process Notes
//Update Displayed Notes
  import_claim_note:any;
  public display_notes(data:any,type:any)
  {
    console.log(data);
    console.log(type);
  if(this.active_claim != undefined)
  {
    if(this.active_claim.length != 0)
    {
      this.update_refer_notes(data,type,this.active_claim)
    }
    else
    {
        if(type=='processnotes')
        {
          this.process_notes=data.data;
        }
        else if(type=='claimnotes')
        {
          this.claim_notes=data.data;
        }
        else if(type=='qcnotes')
        {
          this.qc_notes=data.data;
        }
        else if(type=='All')
        {
          this.process_notes=data.data.process;
          this.claim_notes=data.data.claim;
          this.qc_notes=data.data.qc;
          this.client_notes=data.data.client;
          console.log(this.claim_notes);
        }
    }
    this.loading=false;
    this.processNotes.reset();
    this.claimNotes.reset();
  }
}


//Save Notes

note_refresh(){
  this.process_notes_data_list =[];
  this.claim_notes_data_list =[];
}


public process_notes_data_list:any =[];
public process_notes_data:any =[];

public savenotes(type:any)
{
  let claim_id:any;
  if(this.active_claim.length != 0)
  {
    let index= this.refer_claim_no.indexOf(this.active_claim);
    claim_id=this.refer_claim_det[index];
  }
  else{
  claim_id=this.claim_clicked;
  }

  if(type=='processnotes')
  {
    this.Jarwis.process_note(this.setus.getId(),this.processNotes.value['processnotes'],claim_id,'processcreate', 'followup').subscribe(
      data  => this.display_notes(data,type),
      error => this.handleError(error)
    );
    // this.request_monitor=0;
    // this.process_notes_data.push({notes:this.processNotes.value['processnotes'],id:claim_id['claim_no']});
    // this.process_notes_data_list.push(claim_id['claim_no']);
    // this.notes_hadler.set_notesest(this.setus.getId(),this.processNotes.value['processnotes'],claim_id,'process_create');
    // this.send_calim_det('footer_data');
  }
  else if(type=='claimnotes')
  {
    this.Jarwis.claim_note(this.setus.getId(),this.claimNotes.value['claim_notes'],claim_id,'claim_create').subscribe(
      data  => this.display_notes(data,type),
      error => this.handleError(error)
      );

    if(this.editnote_value!=null || this.editnote_value!=undefined){
      this.claimNotes.value['claim_notes'] = this.editnote_value;
    }
    this.request_monitor=0;
    this.claim_notes_data.push({notes:this.claimNotes.value['claim_notes'],id:claim_id['claim_no']});
    this.claim_notes_data_list.push(claim_id['claim_no']);

    //console.log("Dta List",this.claim_notes_data_list);
    this.notes_hadler.set_notes(this.setus.getId(),this.claimNotes.value['claim_notes'],claim_id,'claim_create');
    this.send_calim_det('footer_data');
  }
}



//Edit Notes
edit_noteid:any;
editnote_value: any;
initial_edit:boolean=false;
proess_initial_edit:any;
public editnotes(type:any,value:any,id:any)
{
  //For initial Edit of Claim notes
  if(type=='claim_notes_init')
  {
    let claim_data=this.claim_notes_data.find(x => x.id == id['claim_no']);
    this.editnote_value=claim_data.notes;
    // this.claimNotes.patchValue({
    //   claim_notes: this.editnote_value,
    // });
    this.edit_noteid=id;
    this.initial_edit=true;
  }else if(type=='process_notes_init')
  { let process_data:any=this.process_notes_data.find((x:any) => x.id == id['claim_no']);
    this.editnote_value=process_data.notes;
    this.edit_noteid=id;
    // this.claimNotes.patchValue({
    //   claim_notes: this.editnote_value,
    // });
    this.proess_initial_edit=true;
  }
  else{
    console.log('Type',type);
    console.log('editnote_value',value);
    console.log('ID',id);
    this.editnote_value=value;
    if(type=='processnote'){
      this.processNotes.patchValue({
        processnotes : this.editnote_value,
      })
    }
    this.edit_noteid=id;
    if(type=='claimnotes'){
      this.claimNotes.patchValue({
        claim_notes: this.editnote_value,
      });
    }
    this.initial_edit=false;
  }


}

public get_insurance(){
  this.Jarwis.get_insurance(this.setus.getId()).subscribe(
      data  => this.handleInsurance(data),
      error => this.handleError(error)
    );
}

option:any;
handleInsurance(data:any){
  this.option = data.claim_data;
}

//Update Notes
public updatenotes(type:any){
  if(this.initial_edit==true)
  {
    this.notes_hadler.set_notes(this.setus.getId(),this.claimNotes.value['claim_notes'],this.edit_noteid,'claim_create');
    this.claim_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes=this.claimNotes.value['claim_notes'];
    // this.claim_notes_data[this.edit_noteid['claim_no']]=this.claimNotes.value['claim_notes'];
    this.initial_edit=false;
    this.send_calim_det('footer_data');
  }/*else if(this.proess_initial_edit==true){
    this.notes_hadler.set_notesest(this.setus.getId(),this.processNotes.value['processnotes'],this.edit_noteid,'claim_create');
    this.process_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes=this.processNotes.value['processnotes'];
    this.initial_edit=false;
    this.send_calim_det('footer_data');
  } */
  else{
  if(type=='processnotes')
  {
    this.Jarwis.process_note(this.setus.getId(),this.processNotes.value['processnotes'],this.edit_noteid,'processupdate', 'audit-closed').subscribe(
      data  => this.display_notes(data,type),
      error => this.handleError(error)
    );

    // let claim_active;
    // this.Jarwis.check_edit_val(claim_active,'followup').subscribe(
    //   data  => {
    //   this.set_note_edit_validity(data);
    //     // console.log("Note _edit",this.note_edit_val);
    //     if(this.note_edit_val != undefined)
    //     {
    //       // console.log("Inside",this.processNotes.value,this.edit_noteid);
    //      this.Jarwis.process_note(this.setus.getId(),this.processNotes.value['processnotes'],this.edit_noteid,'processupdate', 'followup').subscribe(
    //       data  => this.display_notes(data,type),
    //       error => this.handleError(error)
    //      );
    //     }
    //     else
    //     {
    //       this.toastr.errorToastr('Notes cannot be Updated.', 'Claim Processed.');
    //     }
    // },
    //   error => this.handleError(error)
    // );
  }
  else if(type == 'claimnotes')
  {

    this.Jarwis.claim_note(this.setus.getId(),this.claimNotes.value['claim_notes'],this.edit_noteid,'claimupdate').subscribe(
      data  => this.display_notes(data,type),
      error => this.handleError(error)
    );

    let claim_active;

    // if(this.main_tab == true)
    // {
    //   claim_active=this.claim_clicked;
    // }
    // else{
    //   claim_active=this.refer_claim_det.find(x => x.claim_no == this.active_claim);
    // }
    // console.log("cc",claim_active ,);
    // this.check_note_edit_validity(this.claim_clicked);

    // this.Jarwis.check_edit_val(claim_active,'followup').subscribe(
    //   data  => {
    //     // console.log("ched",data);
    //   this.set_note_edit_validity(data);
    //     // console.log("Note _edit",this.note_edit_val);
    //     if(this.note_edit_val != undefined)
    //     {
    //       // console.log("Inside",this.claimNotes.value,this.edit_noteid);
    //       this.Jarwis.claim_note(this.setus.getId(),this.claimNotes.value['claim_notes'],this.edit_noteid,'claimupdate').subscribe(
    //         data  => this.display_notes(data,type),
    //         error => this.handleError(error)
    //       );
    //     }
    //     else
    //     {
    //       this.toastr.warningToastr('Claim notes cannot be Updated.');
    //     }
    // },

    //   error => this.handleError(error)
    // );


  }

  }
  this.editnote_value=null;
  }

  public close_clear_data()
  {
    this.editnote_value=null;
  }
  //Clear ProcessNote
  public clear_notes()
  {
    this.editnote_value=null;
    this.processNotes.reset();
  }
  //Send Claim Value to Followup-Template Component on Opening Template
  // active_sent_claim:string[];
  public send_calim_det(type:any)
  {
    console.log(type);

    if(this.main_tab==true)
    {
      console.log(this.main_tab);
      if(type == 'followup')
      {
        console.log(this.claim_clicked['claim_no']);
        this.follow.setvalue(this.claim_clicked['claim_no']);
      }
      else{
        this.notes_hadler.selected_tab(this.claim_clicked['claim_no']);
        this.notes_hadler.set_claim_details(this.claim_clicked);
        this.claim_active=this.claim_clicked;
      }
    }
    else
    {
      if(type == 'followup')
      {
        this.follow.setvalue(this.active_claim);
      }
      else{

        this.notes_hadler.selected_tab(this.active_claim);
        let claim_detials=this.refer_claim_det.find((x:any) => x.claim_no == this.active_claim);
        console.log(claim_detials);
        this.notes_hadler.set_claim_details(claim_detials);
        this.claim_active=this.active_claim;
      }
    }
  }

  claimid:any;
  active_data:any;
  followup_data:any;
  followup_question_data:any;
  public get_followup_details()
  {
    let claim:any=this.follow.getvalue();
    if(this.claimid.includes(claim) )
    {
      let id=this.claimid.indexOf(claim);
      this.active_claim=this.followup_data[id];
      this.active_data=this.followup_question_data[id];
      console.log('1'+ this.active_data);
      }
      else{
        this.Jarwis.get_followup(claim).subscribe(
          data  => this.assign_data(data,claim),
          error => this.handleError(error)
          );
        }
      }

  public assign_data(data:any,claim:any)
  {
    console.log(data.data.data);
    this.claimid.push(claim);
    this.followup_data.push( data.data.data);
    this.followup_question_data.push(data.data.content);
    this.active_claim=data.data.data;
    this.active_data=data.data.content;
    console.log('2' +this.active_data);
  }

  public collect_response(data:any)
  {
    if(this.main_tab == true)
    {
      this.check_note_edit_validity(this.claim_clicked);
    }
    else{

      let claim_detials=this.refer_claim_det.find((x:any) => x.claim_no == this.active_claim);
      this.check_note_edit_validity(claim_detials);
    }
    this.display_notes(data,'claimnotes');
    this.getclaim_details(1,'refresh','null','null','null','null',null,null,null,null);
    this.getclaim_details(1,'allocated','null','null','null','null',null,null,null,null);
    this.getclaim_details(1,'reallocated','null','null','null','null',null,null,null,null);
    //  console.log("Dta List Brf",this.claim_notes_data_list);
    let index =  this.claim_notes_data_list.indexOf(this.active_claim);
    this.claim_notes_data_list.splice(index, 1);
    let index1:any =  this.process_notes_data_list.indexOf(this.active_claim);
    this.process_notes_data_list.splice(index1, 1);
    //console.log("Dta List AFTT",this.claim_notes_data_list);
  }

  public get_line_items(claim:any)
  {
    // console.log("Get line",claim);
    this.check_note_edit_validity(claim);
    let stat=0;

    for(let i=0;i<this.line_item_data.length;i++)
    {
      let array:any=this.line_item_data[i];
      let x =  array.find((x:any) => x.claim_id == claim['claim_no']);
      if(x!=undefined)
      {
        this.line_data=array;
        stat=1;
      }

    }
    if(stat ==0)
    {
      this.Jarwis.get_line_items(claim).subscribe(
        data  => this.assign_line_data(data) ,
        error => this.handleError(error)
      );
    }
  }
  //error_handler
  error_handler(error:any)
  {
    //console.log(error)
    if(error.error.exception == "Illuminate\Database\QueryException"){
      this.toastr.warningToastr("File can not be Deleted",'Foreign key Constraint');
    }
    else{
      this.toastr.errorToastr(error.error.exception, "Error!");
    }
  }

  line_item_data:any=[];
  assign_line_data(data:any)
  {
    this.line_item_data.push(data.data);
    this.line_data=data.data;
  }

  confirmation_type:any;
  reassign_claim:any ;
  curr_reassigned_claims:any=[];

  confirm_reassign(claim:any)
  {
    this.confirmation_type='Reassign';
  this.reassign_claim=claim;
  }

  confirm_action(type:any)
  {
    if(type == 'Reassign')
    {
      let mod_type='followup';
      this.Jarwis.reassign_calim(this.reassign_claim,this.setus.getId(),mod_type).subscribe(
        data  => this.after_reassign(data,this.reassign_claim['claim_no']) ,
        error => this.handleError(error)
      );
    }
  }

  reassign_allocation:boolean=true;
  after_reassign(data:any,claim:any)
  {
    // console.log(data,claim);
    this.curr_reassigned_claims.push(claim);
    // this.getclaim_details(this.alloc_pages,'allocated');
    this.getclaim_details(1,'wo','null','null','null','null',null,null,null,null);
    this.reassign_allocation=false;
  }

  check_reassign_alloc(claim:any)
  {

    console.log("Here REassign",claim);
    if(this.setus.get_role_id() == '1' && claim['followup_work_order'] != null)
    {
      let already_re=this.curr_reassigned_claims.indexOf(claim.claim_no);
      if(already_re<0)
      {
        this.reassign_allocation=true;
      }
      else
      {
        this.reassign_allocation=false;
      }

    }
    else{
      this.reassign_allocation=false;
    }

  }

  check_note_edit_validity(claim:any)
  {
    console.log("Check",claim);
    this.Jarwis.check_edit_val(claim,'followup').subscribe(
      data  => this.set_note_edit_validity(data),
      error => this.handleError(error)
    );

  }

  note_edit_val:any ;
  set_note_edit_validity(data:any)
  {
    console.log("Validity",data);
    if(data.edit_val == true)
    {
      // console.log(data.note_id['id']);
      this.note_edit_val = data.note_id['id'];
      console.log(this.note_edit_val);
    }
    else
    {
      this.note_edit_val=undefined;
    }
    console.log(this.note_edit_val);
  }

  reload_data()
  {
    if(this.new_cdtnnn){
      console.log('Finally INNN');
      // this.Jarwis.getclaim_details_new(this.setus.getId(),'allocated',null,null,null,null).subscribe(
      //   data  => this.form_table(data,'allocated',null),
      //   error => this.handleError(error)
      // )
      this.new_cdtnnn =false;
    }
    this.loading=true;
    if(this.modalService.hasOpenModals() == false)
    {
      this.getclaim_details(this.pages,'allocated',null,null,'null','null',null,null,null,null);
      this.getclaim_details(this.pages,'reallocated',null,null,'null','null',null,null,null,null);

      for(let i=0;i<this.assigned_claims.length;i++)
      {
        let claim=this.assigned_claims[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);

      }

      let page_count=15;

      this.pages=1;
      this.Jarwis.get_table_page(null,this.pages,page_count,null,'null','null','null','null').subscribe(
        data  => this.assign_page_data(data),
        error => this.handleError(error)
      );

      this.checkboxes.forEach((element) => {
        element.nativeElement.checked = false;
      });

    }
  }
  // get_touch_limit()
  // {
  //   this.Jarwis.get_practice_stats().subscribe(
  //     data =>this.set_prac_settings(data)
  //     );
  // }
  touch_count:number = 0;
  // set_prac_settings(data)
  // {
  //   let prac_data=data.data;
  //   this.touch_count=prac_data.touch_limit;
  //   console.log(this.touch_count);
  // }
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
  chart_val={
    "chart": {
        // "caption": "Split of Top Products Sold",
        // "subCaption": "Last Quarter",
        "basefontsize": "10",
        "pieFillAlpha": "70",
        "pieBorderThickness": "2",
        "hoverFillColor": "#cccccc",
        "pieBorderColor": "#ffffff",
        "showPercentInTooltip": "0",
        "numberPrefix": "$",
        "plotTooltext": "$label, $$valueK, $percentValue",
        "theme": "fusion"
    },
    "category": [
        {
            "label": "My Report",
            "color": "#ffffff",
            "value": "150",
            "category": [
                {
                    "label": "0-30",
                    "color": "#f8bd19",
                    "category": [
                        {
                            "label": "Breads",
                            "color": "#f8bd19",
                            "value": "11.1"
                        },
                        {
                            "label": "Juice",
                            "color": "#f8bd19",
                            "value": "27.75"
                        },
                        {
                            "label": "Noodles",
                            "color": "#f8bd19",
                            "value": "9.99"
                        },
                        {
                            "label": "Seafood",
                            "color": "#f8bd19",
                            "value": "6.66"
                        }
                    ]
                },
                {
                    "label": "31-60",
                    "color": "#e44a00",
                    "category": [
                        {
                            "label": "Sun Glasses",
                            "color": "#e44a00",
                            "value": "10.08"
                        },
                        {
                            "label": "Clothing",
                            "color": "#e44a00",
                            "value": "18.9"
                        },
                        {
                            "label": "Handbags",
                            "color": "#e44a00",
                            "value": "6.3"
                        },
                        {
                            "label": "Shoes",
                            "color": "#e44a00",
                            "value": "6.72"
                        }
                    ]
                },
                {
                    "label": "61-90",
                    "color": "#008ee4",
                    "category": [
                        {
                            "label": "Bath &{br}Grooming",
                            "color": "#008ee4",
                            "value": "9.45"
                        },
                        {
                            "label": "Feeding",
                            "color": "#008ee4",
                            "value": "6.3"
                        },
                        {
                            "label": "Diapers",
                            "color": "#008ee4",
                            "value": "6.75"
                        }
                    ]
                },
                {
                    "label": "120+",
                    "color": "#33bdda",
                    "category": [
                        {
                            "label": "Laptops",
                            "color": "#33bdda",
                            "value": "8.1"
                        },
                        {
                            "label": "Televisions",
                            "color": "#33bdda",
                            "value": "10.5"
                        },
                        {
                            "label": "SmartPhones",
                            "color": "#33bdda",
                            "value": "11.4"
                        }
                    ]
                }
            ]
        }
    ]
  }

  user_role:any;
  class_change:any=[];
  class_change_tab:any=[];
  user_role_maintainer()
  {
    let role_id=Number(this.setus.get_role_id());
    //console.log("User Role",role_id);
    if(role_id == 5 || role_id == 3 || role_id == 2)
    {
      this.user_role=2;
      this.class_change['tab1']='active';
      this.class_change['tab2']='';

      this.class_change_tab['tab1']='tab-pane active';
      this.class_change_tab['tab2']='tab-pane'

    }
    else if(role_id == 1)
    {
      this.user_role=1;

      this.class_change['tab1']='active';
      this.class_change['tab2']='';

      this.class_change_tab['tab1']='tab-pane active';
      this.class_change_tab['tab2']='tab-pane'

      // this.get_month_details(); edited...
    }
  }
  weeks:any=[];
  days:any=[];
  get_month_details()
  {
    this.Jarwis.get_month_details().subscribe(
      data  => this.set_month_det(data),
      error => this.handleError(error)
    );
  }
  col_span:any=[];
  set_month_det(data:any)
  {
    // console.log(data.working,"WEE",data.weeks);
    this.weeks=data.weeks;
    this.days=data.working;
    //For SATURDAY
    let week_length:any=[];
    data.weeks.forEach((element:any) => {

      if(element.length == undefined)
      {
        week_length.push(1);
      }
      else{
        week_length.push(element.length);
      }

    });
    this.col_span=week_length;
    // console.log("len",this.col_span)
    this.get_prod_qual();
  }
  get_prod_qual()
  {
    this.Jarwis.get_prod_qual(this.setus.getId(),this.days).subscribe(
      data  => this.assign_prod_qual(data),
      error => this.handleError(error)
    );
  }
  assigned_target=[];
  achieved_target=[];
  achi_targ_per=[];
  assign_prod_qual(data:any)
  {
    //console.log('o/p',data);
    this.assigned_target=data.assigned;
    this.achieved_target = data.worked;
    this.achi_targ_per = data.work_per;
  }
  public check_all: Array<any> =[];
  public selected_claims:any=[];
  public selected_claim_nos:any=[];

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
  //Selected Claim Sorting
  public selected(event:any,claim:any,index:any)
  {

    if(claim == 'all' && event.target.checked == true )
    {
      let assigned_claims = this.assigned_claims;

      let claim_nos=this.selected_claim_nos;
      let claim_data= this.selected_claims;

      assigned_claims.forEach(function (value:any) {
        let keys = value;
        if(!claim_nos.includes(keys['claim_no']))
        {
        claim_nos.push(keys['claim_no']);
        claim_data.push(keys);
        }
        });
        this.selected_claim_nos=claim_nos;
        this.selected_claims=claim_data;
        console.log(this.selected_claims);
    }
    else if(claim == 'all' && event.target.checked == false)
    {

      for(let i=0;i<this.assigned_claims.length;i++)
      {
        let claim=this.assigned_claims[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);

      }

      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if(event.target.checked == true)
    {
    this.selected_claims.push(this.table_datas[index]);
    this.selected_claim_nos.push(claim);
    }
    else if(event.target.checked == false)
    {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind,1);
      this.selected_claim_nos.splice(ind,1);

    }
  }
  public reassigned_selected(event:any,claim:any,index:any)
  {

    if(claim == 'all' && event.target.checked == true )
    {
      let reassigned_claims_data = this.reassigned_claims_data;

      let claim_nos=this.selected_claim_nos;
      let claim_data= this.selected_claims;

      reassigned_claims_data.forEach(function (value:any) {
        let keys = value;
        if(!claim_nos.includes(keys['claim_no']))
        {
        claim_nos.push(keys['claim_no']);
        claim_data.push(keys);
        }
        });
        this.selected_claim_nos=claim_nos;
        this.selected_claims=claim_data;
    }
    else if(claim == 'all' && event.target.checked == false)
    {

      for(let i=0;i<this.reassigned_claims_data.length;i++)
      {
        let claim=this.reassigned_claims_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);

      }

      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if(event.target.checked == true)
    {
    this.selected_claims.push(this.reassigned_claims_data[index]);
    this.selected_claim_nos.push(claim);
    }
    else if(event.target.checked == false)
    {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind,1);
      this.selected_claim_nos.splice(ind,1);

    }
  }


  public completed_selected(event:any,claim:any,index:any)
  {

    if(claim == 'all' && event.target.checked == true )
    {
      let completed_claims_data = this.completed_claims_data;

      let claim_nos=this.selected_claim_nos;
      let claim_data= this.selected_claims;

      completed_claims_data.forEach(function (value:any) {
        let keys = value;
        if(!claim_nos.includes(keys['claim_no']))
        {
        claim_nos.push(keys['claim_no']);
        claim_data.push(keys);
        }
        });
        this.selected_claim_nos=claim_nos;
        this.selected_claims=claim_data;
    }
    else if(claim == 'all' && event.target.checked == false)
    {

      for(let i=0;i<this.completed_claims_data.length;i++)
      {
        let claim=this.completed_claims_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);

      }

      // this.selected_claims=[];
      // this.selected_claim_nos=[];
    }
    else if(event.target.checked == true)
    {
    this.selected_claims.push(this.table_datas[index]);
    this.selected_claim_nos.push(claim);
    }
    else if(event.target.checked == false)
    {
      let ind = this.selected_claim_nos.indexOf(claim);
      this.selected_claims.splice(ind,1);
      this.selected_claim_nos.splice(ind,1);
    }
  }
  summary_total_assigned:Number=0;
  setSummaryInfo(data:any){
    this.summary_total_assigned = data.summary.total_assigned;
  }
  getSummary(){

    // this.Jarwis.getSummaryDetails(this.setus.getId()).subscribe(
    //     data  => this.setSummaryInfo(data),
    //     error => this.handleError(error)
    //   );
  }

  public get_statuscodes()
  {
    this.Jarwis.get_status_codes(this.setus.getId(),'all').subscribe(
      data  => this.process_codes(data)
    );
  }
  public process_codes(data:any)
  {
    console.log(data);
    let status_option=[];
    this.status_codes_data=data.status;
    this.sub_status_codes_data=data.sub_status;
    for(let i=0;i<this.status_codes_data.length;i++)
    {
      if(this.status_codes_data[i]['status']==1)
      {
        // alert(this.status_codes_data[i]['status_code']);
        status_option.push({id: this.status_codes_data[i]['id'], description: this.status_codes_data[i]['status_code'] +'-'+ this.status_codes_data[i]['description'] } );
      }
    }
    this.status_options=status_option;
  }
  public assigned_status_code_changed(event:any)
  {
    if(event.value!=undefined)
    {
      let sub_status:any=this.sub_status_codes_data[event.value.id];
      let sub_status_option:any=[];
      console.log('sub_status_option');
      if(sub_status == undefined || sub_status =='' )
      {
        this.sub_options=[];
        this.assignedClaimsFind.patchValue({
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
            this.assignedClaimsFind.patchValue({
              sub_status_code: {id:this.sub_options[0]['id'],description:this.sub_options[0]['description']}
            });
          }
          else{
            this.assignedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }
  public reassigned_status_code_changed(event:any)
  {
    if(event.value!=undefined)
    {
      let sub_status:any=this.sub_status_codes_data[event.value.id];
      let sub_status_option:any=[];
      console.log('sub_status_option');
      if(sub_status == undefined || sub_status =='' )
      {
        this.sub_options=[];
        this.reassignedClaimsFind.patchValue({
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
            this.reassignedClaimsFind.patchValue({
              sub_status_code: {id:this.sub_options[0]['id'],description:this.sub_options[0]['description']}
            });
          }
          else{
            this.reassignedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }
  public closed_status_code_changed(event:any)
  {
    if(event.value!=undefined)
    {
      let sub_status:any=this.sub_status_codes_data[event.value.id];
      let sub_status_option:any=[];
      console.log('sub_status_option');
      if(sub_status == undefined || sub_status =='' )
      {
        this.sub_options=[];
        this.closedClaimsFind.patchValue({
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
            this.closedClaimsFind.patchValue({
              sub_status_code: {id:this.sub_options[0]['id'],description:this.sub_options[0]['description']}
            });
          }
          else{
            this.closedClaimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  //Configuration of Dropdown Search
  public config:any = {
  displayKey:"description",
  search:true,
  limitTo: 1000,
  result:'single'
  }

  ngOnInit() {
    // this.auth.tokenValue.next(false);
    //this.get_insurance();
    // this.getSearchResults();
    this.user_role_maintainer();
    this.getSummary();
    //this.getclaim_details(1,'wo','null','null','null','null',null,null,null,null);
    // this.get_statuscodes();

    this.assignedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      responsibility: [],
      rendering_provider:[],
      payer_name:[],
      date:[],
      status_code: [],
      sub_status_code: [],
      bill_submit_date: [],
      denial_code: [],
    });

    this.reassignedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      responsibility: [],
      rendering_provider:[],
      payer_name:[],
      date:[],
      status_code: [],
      sub_status_code: [],
      bill_submit_date: [],
      denial_code: [],
    });

    this.closedClaimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge: [],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      responsibility: [],
      rendering_provider:[],
      payer_name:[],
      date:[],
      status_code: [],
      sub_status_code: [],
      bill_submit_date: [],
      denial_code: [],
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

        this.subscription=this.notify_service.fetch_touch_limit().subscribe(message => {
          this.touch_count = message
        console.log('touch count ONIN', this.touch_count);
        });

          const debouncetime = pipe(debounceTime(700));
    this.search_data.valueChanges.pipe(debouncetime)
    .subscribe( result => this.sort_data(result)
    );
    this.filter_option.valueChanges
    .subscribe( result => this.sort_table(result)
    );
  }


  res:any;
  ngAfterViewInit()
  {
    console.log('LAST IN FOllowUP COMP');
    console.log('asasasasas',this.auth.tokenValue.value);


    // this.auth.tokenValue.next(true);
    if(this.touch_count == undefined)
    {
      this.touch_count=this.notify_service.manual_touch_limit();
      console.log('touch count afterview', this.touch_count);
    }
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
    setTimeout(() => {
      this.getclaim_details(1,'allocated','null','null','null','null','null','null','null','null')
    }, 1000);

    // this.res =  this.myGrid_1.api?.applyTransaction({
    //   add: [{
    //     'touch':0,
    //     'claim_no':'12345',
    //     'dos':'01/01/2024',
    //     'age':'123',
    //     'acct_no':'4323',
    //     'patient_name':'Selva',
    //     'rendering_prov':'-Nil-',
    //     'responsibility':'Submitted',
    //     'total_charges':'50.00',
    //     'total_ar':'34.00',
    //     'claim_Status':'Assigned',
    //     'claim_note':'-Nil-',
    //     'created_ats':'User | 20/4/2023'
    //   }
    // ],
    //   addIndex: 2,
    // });
    // setTimeout(() => {
    //   this.printResult(this.res);
    // }, 2000);
  }

   printResult(res: RowNodeTransaction) {
    console.log("---------------------------------------");
    if (res.add) {
      res.add.forEach((rowNode) => {
        console.log("Added Row Node", rowNode);
      });
    }
    if (res.remove) {
      res.remove.forEach((rowNode) => {
        console.log("Removed Row Node", rowNode);
      });
    }
    if (res.update) {
      res.update.forEach((rowNode) => {
        console.log("Updated Row Node", rowNode);
      });
    }
  }



  ngOnDestroy(){
    // prevent memory leak when component destroyed
    //this.subscription.unsubscribe();
    this.response_data.unsubscribe();
    this.update_monitor.unsubscribe();
    this.subscription.unsubscribe();
  }
		//Create Work Order
  // public reassign(){
  //      this.Jarwis.getdata(this.selected_claim_nos,this.setus.getId()).subscribe(
  //     data  => this.reassigned_claims(data),
  //     error => this.handleError(error),
  //    )}
  //     reassigned_claims(data){
  //       if(data.status =='success'){
  //         console.log(data.status);
  //        this.toastr.successToastr('Assigned Successfully.','Successfully');
  //       }
  //       else{
  //        this.toastr.errorToastr( 'Some thing went wrong.');
  //       }
  //     }


  public reassign(content:any){

    if(this.selected_claim_nos.length==0){
      this.toastr.errorToastr('Please select Claims');
    }
    else{
      this.openModal3(content);
      this.getDismissReason();
      // this.modalService.open(content, { centered: true ,windowClass:'custom-class'}).result.then((result) => {
      //   this.closeResult = `${result}`;
      // }, (reason) => {
      //   this.closeResult = `${this.getDismissReason()}`;
      // });
    }
  }



  confirm_box(confirmation:any)
  {
    this.Jarwis.getdata(this.selected_claim_nos,this.setus.getId(),confirmation).subscribe(
      data  => this.reassigned_claims(data),
      error => this.handleError(error)

    );
  }
  reassigned_claims(data:any){
    if(this.selected_claim_nos.length==0){
      this.toastr.errorToastr('please select Claims');
    }
    for(let i=0;i<this.selected_claim_nos.length;i++)
    {
      var assigned_to=this.selected_claim_nos[i]['assigned_to'];
      var assigned_by=this.selected_claim_nos[i]['assigned_by'];
    }
    if(data.assigned_to == data.assigned_by)
    {
      this.toastr.errorToastr('Unable to Reassign');
      this.selected_claim_nos=[];

    }
    else{
      let page_count=15;
      // console.log("ip",type);
      let form_type:any=null;
      let type='allocated';
      let page = this.alloc_pages;
            this.tab_load=true;
      this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,null,null,null,null,null,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      );
      this.toastr.successToastr( 'Reassigned Successfully');
    }
  }


  confirm_boxes(reassign:any)
  {
      this.Jarwis.getdata(this.selected_claim_nos,this.setus.getId(),reassign).subscribe(
        data  => this.reassigned_claims_datas(data),
        error => this.handleError(error)

      );
  }
  reassigned_claims_datas(data:any){
    if(this.selected_claim_nos.length==0){
      this.toastr.errorToastr('please select Claims');
    }
    for(let i=0;i<this.selected_claim_nos.length;i++)
    {
      var assigned_to=this.selected_claim_nos[i]['assigned_to'];
      var assigned_by=this.selected_claim_nos[i]['assigned_by'];
    }
    if(data.assigned_to == data.assigned_by)
    {
      this.toastr.errorToastr('Unable to Reassign');
      this.selected_claim_nos=[];

    }
    else{
      let page_count=15;
      // console.log("ip",type);
      let form_type:any=null;
      let type='reallocated';
      let page = this.realloc_pages;
            this.tab_load=true;
      // this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,null,null,'null','null',null,null,null,null).subscribe(
      //   data  => this.form_table(data,type,form_type),
      //   error => this.handleError(error)
      // );

      this.Jarwis.getclaim_details(this.setus.getId(),page,page_count,type,null,null,null,null,null,null,null,null).subscribe(
        data  => this.form_table(data,type,form_type),
        error => this.handleError(error)
      );
      this.toastr.successToastr( 'Reassigned Successfully');
    }
  }


  cancel_claims(){
    this.selected_claim_nos=[];
  }

  public sort_details(type:any) {
    if(type=='id'){
            if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.allocated_claims.sort((a:any,b:any) => a.acct_no.localeCompare(b.acct_no));
        this.completed_claims.sort((a:any,b:any) => a.acct_no.localeCompare(b.acct_no));
        this.reallocated_claims.sort((a:any,b:any) =>a.acct_no.localeCompare(b.acct_no));
      } else {
        this.sortByAsc = true;
        this.allocated_claims.sort((a:any,b:any) => b.acct_no.localeCompare(a.acct_no));
        this.completed_claims.sort((a:any,b:any) => b.acct_no.localeCompare(a.acct_no));
        this.reallocated_claims.sort((a:any,b:any) => b.acct_no.localeCompare(a.acct_no));
     }
    }
    else if(type=='claims'){
      if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.allocated_claims.sort((a:any,b:any) => a.claim_no.localeCompare(b.claim_no));
        this.completed_claims.sort((a:any,b:any) => a.claim_no.localeCompare(b.claim_no));
        this.reallocated_claims.sort((a:any,b:any) => a.claim_no.localeCompare(b.claim_no));
      } else {
        this.sortByAsc = true;
        this.allocated_claims.sort((a:any,b:any) => b.claim_no.localeCompare(a.claim_no));
        this.completed_claims.sort((a:any,b:any) => b.claim_no.localeCompare(a.claim_no));
        this.reallocated_claims.sort((a:any,b:any) => b.claim_no.localeCompare(a.claim_no));
     }
    }
    else if(type=='patient'){
      if(this.sortByAsc == true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.patient_name.localeCompare(b.patient_name));
        this.completed_claims.sort((a:any,b:any) => a.patient_name.localeCompare(b.patient_name));
        this.reallocated_claims.sort((a:any,b:any) => a.patient_name.localeCompare(b.patient_name));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.patient_name.localeCompare(a.patient_name));
        this.completed_claims.sort((a:any,b:any) => b.patient_name.localeCompare(a.patient_name));
        this.reallocated_claims.sort((a:any,b:any) => b.patient_name.localeCompare(a.patient_name));
      }
    }
    else if(type=='insurance'){
      if(this.sortByAsc == true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.prim_ins_name.localeCompare(b.prim_ins_name));
        this.completed_claims.sort((a:any,b:any) => a.prim_ins_name.localeCompare(b.prim_ins_name));
        this.reallocated_claims.sort((a:any,b:any) => a.prim_ins_name.localeCompare(b.prim_ins_name));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.prim_ins_name.localeCompare(a.prim_ins_name));
        this.completed_claims.sort((a:any,b:any) => b.prim_ins_name.localeCompare(a.prim_ins_name));
        this.reallocated_claims.sort((a:any,b:any) => b.prim_ins_name.localeCompare(a.prim_ins_name));
      }
    }
    else if(type=='bill'){
      if(this.sortByAsc==true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.total_charges.localeCompare(b.total_charges));
        this.completed_claims.sort((a:any,b:any) => a.total_charges.localeCompare(b.total_charges));
        this.reallocated_claims.sort((a:any,b:any) => a.total_charges.localeCompare(b.total_charges));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.total_charges.localeCompare(a.total_charges));
        this.completed_claims.sort((a:any,b:any) => b.total_charges.localeCompare(a.total_charges));
        this.reallocated_claims.sort((a:any,b:any) => b.total_charges.localeCompare(a.total_charges));
      }
    }
    else if(type=='due'){
      if(this.sortByAsc==true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.total_ar.localeCompare(b.total_ar));
        this.completed_claims.sort((a:any,b:any) => a.total_ar.localeCompare(b.total_ar));
        this.reallocated_claims.sort((a:any,b:any) => a.total_ar.localeCompare(b.total_ar));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.total_ar.localeCompare(a.total_ar));
        this.completed_claims.sort((a:any,b:any) => b.total_ar.localeCompare(a.total_ar));
        this.reallocated_claims.sort((a:any,b:any) => b.total_ar.localeCompare(a.total_ar));
      }
    }
    else if(type=='status'){
      if(this.sortByAsc==true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.claim_Status.localeCompare(b.claim_Status));
        this.completed_claims.sort((a:any,b:any) => a.claim_Status.localeCompare(b.claim_Status));
        this.reallocated_claims.sort((a:any,b:any) => a.claim_Status.localeCompare(b.claim_Status));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.claim_Status.localeCompare(a.claim_Status));
        this.completed_claims.sort((a:any,b:any) => b.claim_Status.localeCompare(a.claim_Status));
        this.reallocated_claims.sort((a:any,b:any) => b.claim_Status.localeCompare(a.claim_Status));
      }
    }
    else if(type=='dos'){
      if(this.sortByAsc==true){
        this.sortByAsc=false;
        this.allocated_claims.sort((a:any,b:any) => a.dos.localeCompare(b.dos));
        this.completed_claims.sort((a:any,b:any) => a.dos.localeCompare(b.dos));
        this.reallocated_claims.sort((a:any,b:any) => a.dos.localeCompare(b.dos));
      }
      else{
        this.sortByAsc=true;
        this.allocated_claims.sort((a:any,b:any) => b.dos.localeCompare(a.dos));
        this.completed_claims.sort((a:any,b:any) => b.dos.localeCompare(a.dos));
        this.reallocated_claims.sort((a:any,b:any) => b.dos.localeCompare(a.dos));
      }
    }
    }


    // order_list(page:number,type,sort_data,sort_type) {
    //   let page_count=15;
    //   // console.log("ip",type);
    //   let form_type=null;
    //   this.alloc_pages=page;
    //   this.current_claim_type='allocated';

    //   if(this.sortByAsc==true){
    //     this.sortByAsc=false;
    //     this.Jarwis.getclaim_details_sort(this.setus.getId(),page,page_count,type,this.sortByAsc,sort_type).subscribe(
    //       data  => this.form_table(data,type,form_type),
    //       error => this.handleError(error)
    //     );
    //   }
    //   else{
    //     this.sortByAsc=true;
    //     this.Jarwis.getclaim_details_sort(this.setus.getId(),page,page_count,type,this.sortByAsc,sort_type).subscribe(
    //       data  => this.form_table(data,type,form_type),
    //       error => this.handleError(error)
    //     );
    //   }


    // }

    handleOrderList(data:any){

    }
   public  tooltipOptions :any = {
        'placement': 'right',
        'show-delay': '200',
        'tooltip-class': 'new-tooltip-class',
        'background-color': '#9ad9e4',
        'margin-top': '20px'
      };

    public claim_number:any;

    public tooltip(claim:any){
      this.claim_number = claim.claim_no;

      this.Jarwis.claims_tooltip(this.claim_number).subscribe(
        data  => this.handleClaimsTooltip(data),
        error => this.handleError(error)
      );
    }

  claim_data:any;
  age:any;
  showAge:any;
  calculateAge:any;

  public handleClaimsTooltip(data:any){
    this.claim_data = data.claim_data;
    this.age = data.claim_data.dob;

    const convertAge = new Date(this.age);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24))/365);
    this.calculateAge = this.showAge;
    console.log(this.calculateAge);
  }

  public searchClaims:any;

  public export_excel_files(type:any, table_name:any)
  {
    console.log(table_name);
  if(table_name == 'Assigned_claims'){
    this.searchClaims = this.assignedClaimsFind.value;
    console.log(this.searchClaims);
  }else if(table_name == 'Reassigned_claims'){
    this.searchClaims = this.reassignedClaimsFind.value;
  }else if(table_name == 'Closed_claims'){
    this.searchClaims = this.closedClaimsFind.value;
  }

  this.Jarwis.fetch_followup_claims_export_data(this.setus.getId(), table_name, this.search, this.searchClaims).subscribe(
      data  => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
      );
  }

  public export_pdf_files(type:any, table_name:any)
  {
    let filter='all claims';
    let s_code='adjustment';

    this.Jarwis.fetch_followup_claims_export_data_pdf(this.setus.getId(), table_name).subscribe(
      data  => this.export_handler.sort_export_data(data,type,'claim'),
      error => this.error_handler(error)
    );
  }

  export_Excel_handler(){
  }

  getSearchResults(): void {
    this.Jarwis.get_payer_name().subscribe((sr:any) => {
      this.searchResults = sr['payer_names'];
      console.log(this.searchResults);
    });
  }
  searchFromArray(arr:any, regex:any) {
    let matches = [], i;
    for (i = 0; i < arr.length; i++) {
      if (arr[i].match(regex)) {
        matches.push(arr[i]);
      }
    }
    console.log('matches: ' + matches);
    return matches;
  };
  //For Assigned
  assignedSearchOnKeyUp(event:any) {
    let input = event.target.value;
    console.log('event.target.value: ' + input);
    console.log('this.searchResults: ' + this.searchResults);
    if (input.length > 0) {
      this.assigned_results = this.searchFromArray(this.searchResults, input);
    }
    else{
      this.assigned_selected_val = null;
      this.assignedSelected = false;
    }
  }
  assignedSelectvalue(value:any) {
    if(value !='' || value !=null){
      this.assignedSelected = true;
    this.assigned_selected_val = value;
    }
    else{
      this.assigned_selected_val = null;
      this.assignedSelected = false;
    }
  }
  //For Reassigned
  reassignedSearchOnKeyUp(event:any) {
    let input = event.target.value;
    console.log('event.target.value: ' + input);
    console.log('this.searchResults: ' + this.searchResults);
    if (input.length > 0) {
      this.reassigned_results = this.searchFromArray(this.searchResults, input);
    }
    else{
      this.reassigned_selected_val = null;
      this.reassignedSelected = false;
    }
  }
  reassignedSelectvalue(value:any) {
    if(value !='' || value !=null){
      this.reassignedSelected = true;
    this.reassigned_selected_val = value;
    }
    else{
      this.reassigned_selected_val = null;
      this.reassignedSelected = false;
    }
  }
  //For Closed
  closedSearchOnKeyUp(event:any) {
    let input = event.target.value;
    console.log('event.target.value: ' + input);
    console.log('this.searchResults: ' + this.searchResults);
    if (input.length > 0) {
      this.closed_results = this.searchFromArray(this.searchResults, input);
    }
    else{
      this.closed_selected_val = null;
      this.closedSelected = false;
    }
  }
  closedSelectvalue(value:any) {
    if(value !='' || value !=null){
      this.closedSelected = true;
    this.closed_selected_val = value;
    }
    else{
      this.closed_selected_val = null;
      this.closedSelected = false;
    }
  }

  bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true,adaptivePosition: true  });
  submit_date:any;
  submitted:boolean = false;
  cdtn:boolean = false;
  public gridApi_1!: GridApi;
  public gridApi_2!: GridApi;
  public gridApi_3!: GridApi;
  rowValue_ID_1: any;
  rowValue_ID_2: any;
  rowValue_ID_3: any;
  GridrowData1: any = [];
  GridrowData2: any = [];
  GridrowData3: any = [];
  search_values:any;
  search_value_reworks:any;
  searchvalue_closedClaims:any;

  @ViewChild('myGrid_1') myGrid_1!: AgGridAngular;
  @ViewChild('myGrid_2') myGrid_2!: AgGridAngular;
  @ViewChild('myGrid_3') myGrid_3!: AgGridAngular;
  @ViewChild('claimpage') claimpage!: TemplateRef<any>;
  @ViewChild('processnotes') processnotes!: TemplateRef<any>;
  @ViewChild('claimnotes') claimnotes!: TemplateRef<any>;
  @ViewChild('confirmation') confirmation!: TemplateRef<any>;
  modalRef?: BsModalRef;
  modalRef2?: BsModalRef;
  modalRef3?: BsModalRef;
  isCollapsed_Assigned:boolean = true;
  isCollapsed_Revoked:boolean = true;
  isCollapsed_Grid1:boolean = false;
  isCollapsed_Grid2:boolean = false;
  isCollapsed_Grid3:boolean = false;
  isCollapsed_closed_claim:boolean = true;
  paginationSizeValue_assigned:any = 15;
  paginationSizeValue_reworked:any = 15;
  paginationSizeValue_closed:any = 15;
  onSearch(){
    this.myGrid_1.api.setQuickFilter(this.search_values)
    this.myGrid_2.api.setQuickFilter(this.search_value_reworks)
    this.myGrid_3.api.setQuickFilter(this.searchvalue_closedClaims);
  }

  onPageSizeChanged(type:any) {
    if(type=='assigned'){console.log('Assigned');this.gridApi_1.paginationSetPageSize(Number(this.paginationSizeValue_assigned));}
    else if(type=='reworked'){console.log('Reworked');this.gridApi_2.paginationSetPageSize(Number(this.paginationSizeValue_reworked));}
    else if(type=='closed'){console.log('closed');this.gridApi_3.paginationSetPageSize(Number(this.paginationSizeValue_closed));};
  }

  onSelectionChanged(params: any) {
    this.cdtn = !this.cdtn;
    this.selected_claim_nos = [];
    console.log('cdtn', this.cdtn);
    console.log('params', params);
    this.rowValue_ID_1 = this.myGrid_1.api.getSelectedRows();
    console.log('ID1', this.rowValue_ID_1);
    // if (this.rowValue_ID_1 != '') {
    //   for (let i = 0; i < this.rowValue_ID_1.length; i++) {
    //     this.selected_claim_nos.push(this.rowValue_ID_1?.[i].claim_no);
    //   }
    // }
    // this.claimslection(this.rowValue_ID_1);this.check_reassign_alloc(this.rowValue_ID_1);this.claim_check(this.rowValue_ID_1.touch);this.note_refresh();
    // this.rowValue_ID_1 .forEach((rowNode: any) => {
    //   rowIndex = rowNode.rowIndex;
    //   console.log('Row Index:', rowIndex);
    //   // this.selected(this.cdtn,this.rowValue_ID_1.claim_no,this.rowValue_ID_1.rowIndex);
    // });
  }

  onSelectionChanged_closedClaims(params:any){
    this.selected_claim_nos = [];
    console.log('cdtn', this.cdtn);
    console.log('params', params);
    this.rowValue_ID_3 = this.myGrid_3.api.getSelectedRows();
    console.log('ID3', this.rowValue_ID_3);
    // if (this.rowValue_ID_3 != '') {
    //   for (let i = 0; i < this.rowValue_ID_3.length; i++) {
    //     this.selected_claim_nos.push(this.rowValue_ID_3?.[i].claim_no);
    //   }
    // }
    // this.claimslection(this.rowValue_ID_3);
    // this.claim_check(this.rowValue_ID_3.touch);
  }

  onSelectionChanged_reWorks(params:any){
    this.rowValue_ID_2 = this.myGrid_2.api.getSelectedRows();
    console.log('ID2', this.rowValue_ID_2);
  }

  public defaultColDef: ColDef = {
    editable: false,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    sortable: true,
    resizable: false,
  };

  customSortModel = [{ colId: 'yourColumnId', sort: 'asc' }];

  gridOptions1: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: false,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: this.paginationSizeValue_assigned,
    suppressDragLeaveHidesColumns: true,
    // getRowId: this.getRowNodeId,
    // sortModel: this.customSortModel,
  };
  public rowClassRules: RowClassRules = {
    // row style function
    "appear_red": (params:any) => {
      var numSickDays = params.data.touch;


      // if(numSickDays >0){
      //   // console.log(params);
      //   // console.log(params.data);
      //   setTimeout(() => {
      //     this.myGrid_1.api.ensureIndexVisible(params.rowIndex, 'top');
      //   },1000);
      // }
      return numSickDays > 0;
    },
    "appear_yellow": (params: any) => {
      // console.log(params);
      let rowIndex = params.node.rowIndex
      return rowIndex == 2;
    }
  };
  getRowNodeId(params: any) {
    return params;
  }

  gridOptions2: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: false,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: this.paginationSizeValue_reworked,
    suppressDragLeaveHidesColumns: true,
  };

  gridOptions3: GridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true
    },
    rowSelection: 'multiple',
    rowHeight: 34,
    suppressHorizontalScroll: false,
    suppressMovableColumns:true,
    pagination: true,
    paginationPageSize: this.paginationSizeValue_closed,
    suppressDragLeaveHidesColumns: true,
  };

  onGridReady_1(params: GridReadyEvent) {
    this.gridApi_1 = params.api;
    params.api.sizeColumnsToFit();
    console.log('event', params);
    this.myGrid_1.api.setRowData([]);
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

  openModal(model_name: TemplateRef<any>) {



    console.log('IN');
    this.modalRef = this.modal.show(model_name, this.config);
  }

  openModal2(model_name: TemplateRef<any>) {
    console.log('IN');
    this.modalRef2 = this.modal.show(model_name, this.config);
    this.getDismissReason();
  }
  openModal3(model_name: TemplateRef<any>) {
    console.log('IN');
    this.modalRef3 = this.modal.show(model_name, this.config);
    this.getDismissReason();
  }
  columnDefs1: ColDef[] = [
    {
      field: 'touch',
      headerName: '',
      width: 50,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered.bind(this, 'touch'),

    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width:130,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width:130,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'dos'),
      onCellClicked: this.CellClicked.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 136,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'age'),
      onCellClicked: this.CellClicked.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 155,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'rendering_prov'),
      onCellClicked: this.CellClicked.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'responsibility'),
      onCellClicked: this.CellClicked.bind(this, 'responsibility')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width:135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'total_charges'),
      onCellClicked: this.CellClicked.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'total_ar'),
      onCellClicked: this.CellClicked.bind(this, 'total_ar')
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_Status'),
      onCellClicked: this.CellClicked.bind(this, 'claim_Status')
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width: 145,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'claim_note'),
      onCellClicked: this.CellClicked.bind(this, 'claim_note')
    },
    {
      field: 'created_ats',
      headerName: 'Assigned To | Date',
      sortable: true,
      width: 165,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered.bind(this, 'created_ats',),
      onCellClicked: this.CellClicked.bind(this, 'created_ats')
    }
  ];

  columnDefs2: ColDef[] = [
    {
      field: 'touch',
      headerName: '',
      width: 43,
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'touch'),
      cellStyle:(params:any):any=>{
        return {'font-size':'12px' };
    },
    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width:100,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'claim_no')
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width:120,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'dos'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'dos')
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 90,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'age'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'age')
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 85,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'acct_no')
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'patient_name')
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 155,cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'rendering_prov'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'rendering_prov')
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'responsibility'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'responsibility')
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'billed_submit_date'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'billed_submit_date')
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 130,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'denial_code'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'denial_code')
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width:125,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'total_charges'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'total_charges')
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'total_ar'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'total_ar')
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 125,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'claim_Status'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'claim_Status')
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'claim_note'),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'claim_note')
    },
    {
      field: 'created_ats',
      headerName: 'Assigned To | Date',
      sortable: true,
      width: 165,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_ReworkClaims.bind(this, 'created_ats',),
      onCellClicked: this.CellClicked_ReworkClaims.bind(this, 'created_ats')
    }
  ]


  columnDefs3: ColDef[] = [
    {
      field: 'touch',
      headerName: '',
      width: 43,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      sortable: true, // Set the `sortable` property to a boolean value
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'touch'),
      headerClass: 'custom-header'
    },
    {
      field: 'claim_no',
      headerName: 'Claim No',
      sortable: true, // Set the `sortable` property to a boolean value
      width:100,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'claim_no'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'claim_no'),
      headerClass: 'custom-header'
    },
    {
      field: 'dos',
      headerName: 'DOS',
      sortable: true,
      width:120,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'dos'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'dos'),
      headerClass: 'custom-header'
    },
    {
      field: 'age',
      headerName: 'Age',
      sortable: true,
      width: 90,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'age'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'age'),
      headerClass: 'custom-header'
    },
    {
      field: 'acct_no',
      headerName: 'Acc No',
      sortable: true,
      width: 85,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'acct_no'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'acct_no'),
      headerClass: 'custom-header'
    },
    {
      field: 'patient_name',
      headerName: 'Patient Name',
      sortable: true,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'patient_name'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'patient_name'),
      headerClass: 'custom-header'
    },
    {
      field: 'rendering_prov',
      headerName: 'Rendering Provider',
      sortable: true,
      width: 155,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'rendering_prov'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'rendering_prov'),
      headerClass: 'custom-header'
    },
    {
      field: 'responsibility',
      headerName: 'Responsibility',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'responsibility'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'responsibility'),
      headerClass: 'custom-header'
    },
    {
      field: 'billed_submit_date',
      headerName: 'BillSubmit Date',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'billed_submit_date'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'billed_submit_date'),
      headerClass: 'custom-header'
    },
    {
      field: 'denial_code',
      headerName: 'Denial Code',
      sortable: true,
      width: 135,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'denial_code'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'denial_code'),
      headerClass: 'custom-header'
    },
    {
      field: 'total_charges',
      headerName: 'Total Charges',
      sortable: true,
      width:105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'total_charges'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'total_charges'),
      headerClass: 'custom-header'
    },
    {
      field: 'total_ar',
      headerName: 'Total AR',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'total_ar'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'total_ar'),
      headerClass: 'custom-header'
    },
    {
      field: 'claim_Status',
      headerName: 'Claim Status',
      sortable: true,
      width: 115,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'claim_Status'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'claim_Status'),
      headerClass: 'custom-header'
    },
    {
      field: 'claim_note',
      headerName: 'Claim Note',
      sortable: true,
      width: 105,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'claim_note'),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'claim_note'),
      headerClass: 'custom-header'
    },
    {
      field: 'created_ats',
      headerName: 'Assigned To | Date',
      sortable: true,
      width: 175,
      cellStyle:(params:any):any=>{
        return {'color': '#363636',
         'font-weight': '500',  'font-family': 'sans-serif',
         'font-size': '12px '};
      },
      cellRenderer: this.cellrendered_closed_claims.bind(this, 'created_ats',),
      onCellClicked: this.CellClicked_closed_claims.bind(this, 'created_ats'),
      headerClass: 'custom-header'
    }
  ]

  cellrendered(headerName: any, params: any) {
    switch (headerName) {
      case 'touch': {
        if (params.value >= this.touch_count || params.value < this.touch_count) {
          console.log('params touch count',this.touch_count)
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
      case 'total_charges': {
        if (params.value) {
          if (typeof (params.value) == 'string') { let x = parseInt(params.value); return `$${x.toFixed(2)}`; }
        }
        else
          return '-Nil-';
        break;
      }
      case 'total_ar': {
        if (params.value) { if (typeof (params.value) == 'string') { let x = parseInt(params.value); return `$${x.toFixed(2)}`; } }
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
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo} | ${params.value}`;
      }
    }
  }

  cellrendered_closed_claims(headerName: any, params: any) {
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
      case 'billed_submit_date':{
        if (params.value)
        return params.value;
      else
        return '-Nil-';
      }
      case 'denial_code':{
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
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo} | ${params.value}`;
      }
    }
  }

  cellrendered_ReworkClaims(headerName:any,params:any){
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
      case 'billed_submit_date':{
        if (params.value)
        return params.value;
      else
        return '-Nil-';
      }
      case 'denial_code':{
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
        const rowData = params.node.data;
        const assignedTo = rowData.assigned_to;

        return `${assignedTo} | ${params.value}`;
      }
    }
  }

  CellClicked(headerName: any, params: any) {
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'dos': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'age': {
          this.openModal(this.claimpage);;
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'acct_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'patient_name': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'claim_Status': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
        case 'created_ats': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_1?.[0]);
          this.note_refresh();
          this.claim_check(this.rowValue_ID_1?.[0].touch);
          break;
        }
      }
    }
  }

  CellClicked_closed_claims(headerName: any, params: any) {
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'dos': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'age': {
          this.openModal(this.claimpage);;
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'acct_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'patient_name': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'claim_Status': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
        case 'created_ats': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_3?.[0].touch);
          break;
        }
      }
    }
  }

  CellClicked_ReworkClaims(headerName:any,params:any){
    if (params.value) {
      switch (headerName) {
        case 'claim_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_2?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          // this.check_reassign_alloc()
          break;
        }
        case 'dos': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'age': {
          this.openModal(this.claimpage);;
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'acct_no': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'patient_name': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'total_charges': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'claim_Status': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
        case 'created_ats': {
          this.openModal(this.claimpage);
          this.claimslection(this.rowValue_ID_3?.[0]);
          this.claim_check(this.rowValue_ID_2?.[0].touch);
          break;
        }
      }
    }
  }

  new_cdtnnn:any;

  onMethodCalled(data: any) {
    // Method called from child component
    console.log('Passing',data);
    this.new_cdtnnn = data;
    this.reload_data();
  }

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
          suppressColumnExpandAll: false,
          cssClasses: ['custom-sidebar'],
        },
      } as ToolPanelDef,
    ],
    defaultToolPanel: 'columns',
  };

  status_select_code(){
    if(!this.isCollapsed_Revoked || !this.isCollapsed_Assigned || !this.isCollapsed_closed_claim){
      this.get_statuscodes();this.getSearchResults();
    }
  }

  exportExcel(){
    this.myGrid_1.api.exportDataAsExcel();
  }
}
