import { Component,ViewChildren,ElementRef,QueryList,OnInit,ChangeDetectionStrategy,Input, EventEmitter, Output, OnChanges,ViewEncapsulation } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { FollowupService } from '../../Services/followup.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { ExcelService } from '../../excel.service';
import { ExportFunctionsService } from '../../Services/export-functions.service';
import { NotifyService } from '../../Services/notify.service';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';

import { NgbDatepickerConfig, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
// import { NgbDateCustomParserFormatter} from '../../date_file';
import { NotesHandlerService } from '../../Services/notes-handler.service';
import * as moment from 'moment';


@Component({
  selector: 'app-client-assistance',
  templateUrl: './client-assistance.component.html',
  styleUrls: ['./client-assistance.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ClientAssistanceComponent implements OnInit {

  createWork = "";

  selecteds: any;
  selectedReAssigin: any;
  selectedClosed: any;
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

  isInvalidDate = (m: moment.Moment) =>  {
    return this.invalidDates.some(d => d.isSame(m, 'day') )
  }

  response_data!: Subscription;
  observalble!: Subscription;
  update_monitor!: Subscription;
  isopend=true;
  subscription !: Subscription;
  selectedAge = null;
  submit_date:any;
  age_options:any = [{ "from_age": 0, "to_age": 30 },{ "from_age": 31, "to_age": 60 },{ "from_age": 61, "to_age": 90 },{ "from_age": 91, "to_age": 120 },{ "from_age": 121, "to_age": 180 },{ "from_age": 181, "to_age": 365 }];
  select_date:any;
  select_followup_date:any;
  public status_codes_data:Array<any> =[];
  public sub_status_codes_data:any = [];
  public status_options:any;
  public sub_options:any;
  decimal_pattern = "^\[0-9]+(\.[0-9][0-9])\-\[0-9]+(\.[0-9][0-9])?$";

  isValueSelected:boolean = false;
  results:any = [] = [];
  searchResults:any = [] = [];
  selected_val:any = null;

  constructor(
  private formBuilder: FormBuilder,
  private Jarwis: JarwisService,
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

    this.observalble=this.setus.update_edit_perm().subscribe(message => {this.check_edit_permission(message)} );

    this.response_data=this.notes_hadler.get_response_data('CA').subscribe((message:any) => { this.collect_response(message) });

    this.alwaysShowCalendars = true;
   }

  table_data:any = [];
  total_claims!:number;
  closeResult : string = '';
  pages:string = '';
  loading!:boolean;
  tab_load:boolean=false;

  formGroup!: FormGroup;
  processNotes!: FormGroup;
  clientNotes!: FormGroup;
  workOrder!: FormGroup;
  claimsFind!: FormGroup;
public editnote_value = null;
completed_claims:any = [];
total_completed_claims!:number;
comp_pages!:number;


allocated_claims:any = [];
total_allocated!:number;
alloc_pages!:number;
sortByAsc: boolean = true;
sorting_name:any;

  search:any;

  public claims_filter(page:any,type:any,sort_data:any,sort_type:any,sorting_name:any,sorting_method:any,claim_searh:any,search:any){
    this.search = search;
    this.getclaim_details(page,type,sort_data,sort_type,sorting_name,sorting_method,claim_searh,search);
  }


  order_list(type:any, sort_type:any,sorting_name:any,sorting_method:any,claim_searh:any,search:any)
  {
    this.sorting_name = sort_type;

    if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.getclaim_details(this.pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,search);
    } else {
        this.sortByAsc = true;
        this.getclaim_details(this.pages,type,this.sortByAsc,sort_type,sorting_name,sorting_method,null,search);
    }

  }


  public getclaim_details(page:any,type:any,sort_data:any,sort_type:any,sorting_name:any,sorting_method:any,claim_searh:any,search:any)
  {

    this.tab_load=true;
    if(type=='wo')
    {
      this.pages=page;
    }
    else if(type=='completed'){
      this.comp_pages=page;
    }
    else if(type=='allocated')
    {
      this.alloc_pages=page;
    }


    //this.pages=page;
    let page_count=15;

    let searchs = this.search;

    console.log(searchs);

    if(sorting_name == 'null' && searchs != 'search'){
      console.log('test');
      this.Jarwis.get_ca_claims(this.setus.getId(),page,page_count,type,sort_data,sort_type,sorting_name,sorting_method,null,search).subscribe(
        data  => this.form_table(data,type),
        error => this.handleError(error)
      );
    }else if(searchs == 'search'){
      console.log(searchs);

      if (this.claimsFind.value.dos.startDate != null && this.claimsFind.value.dos.endDate != null) {
        console.log(this.claimsFind.controls['dos'].value);
        this.claimsFind.value.dos.startDate = this.datepipe.transform(new Date(this.claimsFind.value.dos.startDate._d), 'yyyy-MM-dd');
        this.claimsFind.value.dos.endDate = this.datepipe.transform(new Date(this.claimsFind.value.dos.endDate._d), 'yyyy-MM-dd');
      }
      if (this.claimsFind.value.date.startDate != null && this.claimsFind.value.date.endDate != null) {
        console.log(this.claimsFind.controls['date'].value);
        this.claimsFind.value.date.startDate = this.datepipe.transform(new Date(this.claimsFind.value.date.startDate._d), 'yyyy-MM-dd');
        this.claimsFind.value.date.endDate = this.datepipe.transform(new Date(this.claimsFind.value.date.endDate._d), 'yyyy-MM-dd');
      }
      if (this.claimsFind.value.bill_submit_date.startDate != null && this.claimsFind.value.bill_submit_date.endDate != null) {
        this.claimsFind.value.bill_submit_date.startDate = this.datepipe.transform(new Date(this.claimsFind.value.bill_submit_date.startDate._d), 'yyyy-MM-dd');
        this.claimsFind.value.bill_submit_date.endDate = this.datepipe.transform(new Date(this.claimsFind.value.bill_submit_date.endDate._d), 'yyyy-MM-dd');
      }
      if (this.claimsFind.value.followup_date.startDate != null && this.claimsFind.value.followup_date.endDate != null) {
        this.claimsFind.value.followup_date.startDate = this.datepipe.transform(new Date(this.claimsFind.value.followup_date.startDate._d), 'yyyy-MM-dd');
        this.claimsFind.value.followup_date.endDate = this.datepipe.transform(new Date(this.claimsFind.value.followup_date.endDate._d), 'yyyy-MM-dd');
      }

      this.Jarwis.get_ca_claims(this.setus.getId(),page,page_count,type,sort_data,sort_type,this.sorting_name,this.sortByAsc,this.claimsFind.value,this.search).subscribe(
        data  => this.form_table(data,type),
        error => this.handleError(error)
      );
    }else{
      this.Jarwis.get_ca_claims(this.setus.getId(),page,page_count,type,this.sortByAsc,sort_type,this.sorting_name,this.sortByAsc,null,search).subscribe(
        data  => this.form_table(data,type),
        error => this.handleError(error)
      );
    }
  }

  export_data: Array<any> =[];

  current_totals:any;
  skips:any;
  total_rows:any;
  skip_rows:any;
  current_rows:any;
  totals:any;
  current_total:any;
  total:any;
  skip:any;
  skip_row:any;
  current_row:any;
  total_row:any;
  selected_table_data:any;
  public form_table(data:any,type:any)
  {
    console.log(type);
    if(type=="wo")
    {
      this.table_data=data.data;
      console.log(this.table_data);
      this.selected_table_data=data.selected_claim_data;
      this.total_claims=data.count;
      // let ca_data=this.table_data;
      //this.total=data.total;
      this.current_totals= data.current_total;
      this.skips = data.skip + 1;

      this.skip_rows = this.skips;
      this.current_rows = this.skips + this.current_totals - 1;
      this.total_rows = data.count;
    }else if(data.type =="wo"){
      this.table_data=data.data;
      let agedata = data.data.age;
      console.log(agedata);
      this.selected_table_data=data.selected_claim_data;
      this.total_claims=data.count;
      // let ca_data=this.table_data;
      //this.total=data.total;
      this.current_totals= data.current_total;
      this.skips = data.skip + 1;

      this.skip_rows = this.skips;
      this.current_rows = this.skips + this.current_totals - 1;
      this.total_rows = data.count;
    }
    else if(type=='allocated')
    {
      //console.log(data);
      this.allocated_claims=data.data.datas;
      this.total_allocated=data.count;

      this.total=data.total;
      this.current_total= data.current_total;
      this.skip = data.skip + 1;

      this.skip_row = this.skip;
      this.current_row = this.skip + this.current_total - 1;
      this.total_row = data.count;
    }
    else if(type=='completed'){
      this.completed_claims=data.data.datas;
      this.total_completed_claims=data.count;

      // this.total=data.total;
      // this.current_total= data.current_total - 1;
      // this.skip = data.skip;

      // this.skip_row = this.skip;
      // this.current_row = this.skip + this.current_total;
      // this.total_row = data.count;
    }else if(type!="wo" || type!="allocated" || type!="completed")
    {
      this.table_data=data.data;
      this.selected_table_data=data.selected_claim_data;
      this.total_claims=data.count;
      // let ca_data=this.table_data;
      //this.total=data.total;
      // this.current_total= data.current_total - 1;
      // this.skip = data.skip;

      // this.skip_row = this.skip;
      // this.current_row = this.skip + this.current_total;
      // this.total_row = data.count;
    }
    this.tab_load=false;



  //  let field_names:Array<any>=['Acct#','Claim#','Patient Name','DOS','Claim Age','Insurance','Billed','AR Due','Sub-Status Code'];
  }

  //Check All function
  public check_all: Array<any> =[];
  public selected_claims:any=[];
  public selected_claim_nos:any=[];
  public check_all_assign(page:any,event:any)
  {
  if( event.target.checked == true)
  {
    this.check_all[page]=true;
  }
  else{
    this.check_all[page]=false;
  }
  }

  //Manage Selected claims
  assigned_claim_nos:number=0;
  public selected(event:any,claim:any,index:any)
  {
    if(claim == 'all' && event.target.checked == true )
    {
      let selected_table_data = this.selected_table_data;
      let claim_nos:any=this.selected_claim_nos;
      let claim_data:any= this.selected_claims;
      selected_table_data.forEach(function (value:any) {
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
      for(let i=0;i<this.selected_table_data.length;i++)
      {
        let claim:any=this.selected_table_data[i]['claim_no'];
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);
      }
    }
    else if(event.target.checked == true)
    {
      this.selected_claims.push(this.selected_table_data[index]);
      this.selected_claim_nos.push(claim);
      }
      else if(event.target.checked == false)
      {
        let ind = this.selected_claim_nos.indexOf(claim);
        this.selected_claims.splice(ind,1);
        this.selected_claim_nos.splice(ind,1);
        }
        }

          //Open Pop-up
  open(content:any) {
    this.modalService.open(content, { centered: true ,windowClass:'custom-class' }).result.then((result) => {
      this.closeResult = `${result}`;
    }, (reason) => {
      this.closeResult = `${this.getDismissReason()}`;
    });
}

//Modal Dismiss on Clicking Outside the Modal
private getDismissReason() {
}

  //Get Client details
  users_details :Array<any> = [];
  public get_user_list()
  {
    this.Jarwis.get_user_list(this.setus.getId()).subscribe(
      data  => this.list_users(data),
      error => this.handleError(error)
      );
  }

  //Assign and List User
  public list_users(data:any)
  {
    this.users_details=data.data;
  }

  public assigned_claims_details : Array<any> =[];
  claim_assign_type:any=null;
  selected_associates:any=[];
  //Select Associates for Work Order
  public select_associates(event:any, id:any)
  {
    if(event.target.checked == true)
    {
      this.selected_associates.push(id);
    }
    else if(event.target.checked == false)
    {
    let index = this.selected_associates.indexOf(id);
      this.selected_associates.splice(index,1);

    //Reduce Assigned Numbers Unchecked Associates
    let x=this.assigned_claims_details.find(v => v.id == id);
  if(x!=undefined)
  {
    let ind=this.assigned_claims_details.indexOf(x);
    this.assigned_claims_details.splice(ind,1);
    if(x.value!=0)
    {
      this.assigned_claim_nos=this.assigned_claim_nos-Number(x.value);
    }
  }
    }
  }

  //Manual or Automatic Assign
  public assign_type(type:any)
  {
  this.claim_assign_type=type;
  }

  public associate_error!:string;
  public associate_error_handler:any = [];
  //Manual Assign Function
  public manual_assign(event:any,id:any)
  {
    let check = this.assigned_claims_details.some(function (value) {
      return value.id === id;
    });
    if(event.target.value!=0)
    {
      if(!check)
      {
        this.assigned_claims_details.push({ id:id, value :event.target.value});
        }
        else
        {
          this.assigned_claims_details.find(v => v.id == id).value = event.target.value;
          }
          }
          this.calculate_assigned();
          }

  public assigned_data: Array<any> =[];
  //Calculate Assigned and Unassigned Claims
  public calculate_assigned()
  {
    let total=0;
  for(let i=0;i < this.assigned_claims_details.length;i++)
  {
    total += Number(this.assigned_claims_details[i]['value']);
    this.assigned_data[this.assigned_claims_details[i]['id']]=this.assigned_claims_details[i]['value'];
  }
  this.assigned_claim_nos=total;
  }
  assigned_claim_status:boolean=false;
  public assigned_claim_details:Array<any> =[];
  //Assign Claims to Create Work Order
  public assign_claims()
  {
    let selected_claims=this.selected_claim_nos;
    let assigned_details:any=[];
    let init_value=0;

    this.assigned_claims_details.forEach(function (value) {
      let keys = value;
      let id = keys['id'];
      let value_data = keys['value'];

      let claims_assigned=selected_claims.slice(init_value,Number(init_value)+Number(value_data));
      init_value=value_data;
      assigned_details.push({assigned_to:id,claim_nos:value_data,claims:claims_assigned});
      });
      this.assigned_claim_details=assigned_details;
      this.assigned_claim_status=true;
      // this.Jarwis.create_ca_workorder(this.setus.getId(),assigned_details).subscribe(
      //   data  => this.handle_workorder_creation(data),
      //   error => console.log(error)
      //   );
  }


  public create_workorder()
  {
    this.Jarwis.create_workorder(this.setus.getId(),this.workOrder.value,this.assigned_claim_details,'client_assistance').subscribe(
      data  => this.handle_workorder_creation(data),
      error => this.handleError(error)
      );
  }




  //Aftermath Work Order creation Handling
  public handle_workorder_creation(data:any)
  {
    this.toastr.successToastr('Created', 'Work Order')
    this.getclaim_details(1,'wo',null,null,'null','null',null,null);
    this.get_user_list();
    this.claim_assign_type=null;
    this.workOrder.reset();
    this.selected_claim_nos=[];
        this.selected_claims=[];
        this.check_all=[];
        this.assigned_claim_details=[];
        this.assigned_data=[];
  }

  public export_files(type:any)
  {
    let filter='all claims';
    let s_code='adjustment';

    this.Jarwis.fetch_export_data(filter,s_code,this.setus.getId()).subscribe(
      data  => this.export_handler.sort_export_data(data,type,'claim'),
      error => this.handleError(error)
      );

  }


  public export_wo_files(type:any)
  {
    let filter='all claims';
    let s_code='adjustment';
    let wo_type=3;
    this.Jarwis.fetch_wo_export_data(filter,s_code,wo_type,this.setus.getId()).subscribe(
      data  => this.export_handler.ready_wo_export(data,type),
      error => this.handleError(error)
      );

  }

  public wo_export_function(type:any)
  {
    this.export_handler.sort_export_data(this.wo_details,type,'wo_detail');
  }



//   public export_excel_data(data,type)
//   {
//     this.export_data=[];
//     if(type=='excel')
//     {
//       let ca_data=data.data;
//       let op_json={};
//       for(let i=0;i<ca_data.length;i++)
//       {
//     op_json=[];
//         op_json['Acct#']=ca_data[i]['acct_no'];
//         op_json['Claim#']=ca_data[i]['claim_no'];
//         op_json['Patient Name']=ca_data[i]['patient_name'];
//         op_json['DOS']=ca_data[i]['dos'];
//         op_json['Claim Age']=ca_data[i]['claim_age'];
//         op_json['Insurance']=ca_data[i]['prim_ins_name'];
//         op_json['Billed']='3,745.00';
//         op_json['AR Due']='2,980.00';
//         op_json['Sub-Status Code']=ca_data[i]['sub_status'];
//         this.export_data.push(op_json);

//       }
//       this.excelService.exportAsExcelFile(this.export_data, 'sample');
//     }
// else {
//   let ca_data=data.data;
//   for(let i=0;i<ca_data.length;i++)
//   {
//          let op_json=[];
//   op_json.push(ca_data[i]['acct_no']);
//   op_json.push(ca_data[i]['claim_no']);
//   op_json.push(ca_data[i]['patient_name']);
//   op_json.push(ca_data[i]['dos']);
//   op_json.push(ca_data[i]['claim_age']);
//   op_json.push(ca_data[i]['prim_ins_name']);
//   op_json.push('3,745.00');
//   op_json.push('3,745.00');
//   op_json.push(ca_data[i]['sub_status']);
//   this.export_data.push(op_json);
//   }
//    if(type == 'PDF'){
//     this.generatePDF();
//     }
//     else if(type == 'print')
//     {
//       this.print_pdf();
//       }
//       }
//   }

// public print_pdf()
// {
//   let doc: any = new jsPDF('l', 'pt');
//   doc.autoTable({
//     head: [['Acct#','Claim#','Patient Name','DOS','Claim Age','Insurance','Billed','AR Due','Sub-Status Code']],
//     body: this.export_data
//   });
//   doc.autoPrint();
// window.open(doc.output('bloburl'), '_blank');
// }

//   public generatePDF()
//   {
// // console.log(this.export_data);
//     let doc: any = new jsPDF('l', 'pt');
//     doc.autoTable({
//       head: [['Acct#','Claim#','Patient Name','DOS','Claim Age','Insurance','Billed','AR Due','Sub-Status Code']],
//       body: this.export_data
//     });
// //     doc.autoPrint();
// // window.open(doc.output('bloburl'), '_blank');
//     doc.save('table.pdf');
//   }

  //Create Work Order Tab Functions*****
table_fields :any = [];
table_datas :any = [];
claim_clicked :any = [];
claim_related :any = [];
process_notes:any = [];
claim_notes:any = [];
client_notes:any = [];
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
public claim_no:any;
public claimslection(claim:any)
{
  this.claim_no = claim.claim_no;
  this.get_line_items(claim);
  this.check_reassign_alloc(claim);
  this.clear_refer();
  this.claim_clicked=claim;

  //Related Claims
  this.loading=true;

  this.Jarwis.get_related_calims(claim,'claim',this.setus.getId()).subscribe(
    (data:any)  => this.claim_related = data['data'],
    error => this.handleError(error)
  );

  this.claim_related=[];


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
  this.getnotes(this.claim_clicked);
  this.send_calim_det('footer_data');
  //this.processNotesDelete(this.claim_no);
}

processNotesDelete(data:any){
  // this.Jarwis.process_notes_delete(data, this.setus.getId()).subscribe(
  //   data  => this.handleResponseProcess(data),
  //   error => this.handleError(error)
  // );
}

handleResponseProcess(data:any){
  this.getnotes(this.claim_clicked);
}

//Refer Claim Clicked Action
refer_claim_det:any=[];
refer_claim_no:any=[];
refer_claim_notes:any=[];
refer_process_notes:any=[];
refer_qc_notes:any=[];
refer_client_notes:any=[];
main_tab:boolean=true;
active_tab:any=[];
active_refer_claim:any=[];
active_refer_process:any=[];
active_refer_qc:any=[];
active_claim:any = [];
active_refer_client:any=[];

refer_claim_notes_nos:any=[];
refer_process_notes_nos:any=[];
refer_qc_notes_nos:any=[];
refer_client_notes_nos:any=[];
refer_claim_editable='false';
claim_status:any;
claim_nos:any;


public referclaim(claim:any)
{

  claim = claim;

  this.claim_nos = claim.claim_no;
  this.claim_status = claim.claim_Status;
  this.Jarwis.get_client_claimno(this.claim_nos, this.setus.getId(), this.claim_status).subscribe(
    data  => this.handleClaimNo(data),
    error => this.handleError(error)
  );


  if(this.assigned_datas == true ){
      this.refer_claim_editable = 'true';
  }else if(this.assigned_datas == undefined){
    this.refer_claim_editable = 'false';
  }if(this.assigned_datas == false ){
    this.refer_claim_editable = 'false';
  }


if(this.refer_claim_no.indexOf(claim['claim_no']) < 0 )
{
  this.refer_claim_det.push(claim);
  this.refer_claim_no.push(claim['claim_no']);

  this.Jarwis.getnotes(claim).subscribe(
    data  => this.refer_notes(data,claim.claim_no),
    error => this.handleError(error)
  );
}
else
{
  this.selected_tab(claim['claim_no']);
}
this.send_calim_det('footer_data');
}

assigned_datas:any;

public handleClaimNo(data:any){
  this.assigned_datas = data.claim_count;
  this.refer_claim(this.assigned_datas);
}

refer_claim(assigned_datas:any){
  if(assigned_datas == true ){
      this.refer_claim_editable = 'true';
  }else if(assigned_datas == false ){
    this.refer_claim_editable = 'false';
  }
}

//Display Reference Notes
public refer_notes(data:any,claimno:any)
{
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
  let index_up_qc= this.refer_qc_notes_nos.indexOf(claimno);
  let index_up_process = this.refer_process_notes_nos.indexOf(claimno);
  let index_up_claim=this.refer_claim_notes_nos.indexOf(claimno);
  let index_up_client=this.refer_client_notes_nos.indexOf(claimno);

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
  // this.refer_claim_notes[claimno]=data.data;
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
    // this.refer_qc_notes[claimno]=data.data;
  }
  else if(type=='client_notes')
  {
    if(index_up_client==undefined)
    {
      this.refer_client_notes_nos.push(claimno);
      this.refer_client_notes.push(data.data);
      index_up_qc= this.refer_client_notes_nos.indexOf(claimno);
    }
    else{
  this.refer_client_notes[index_up_qc]=data.data;
    }


    this.refer_client_notes[claimno]=data.data;
  }

  this.active_refer_claim= this.refer_claim_notes[index_up_claim];
  this.active_refer_process=this.refer_process_notes[index_up_process];
  this.active_refer_qc=this.refer_qc_notes[index_up_qc];
  this.active_refer_client= this.refer_client_notes[index_up_client];

  // this.active_refer_claim= this.refer_claim_notes[claimno];
  // this.active_refer_process=this.refer_process_notes[claimno];
  // this.active_refer_qc=this.refer_qc_notes[claimno];

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
}

//Close Refer Tab
public close_tab(claim_no:any)
{
 let index=this.refer_claim_det.indexOf(claim_no);
 let list_index=this.refer_claim_no.indexOf(claim_no.claim_no);
 this.refer_claim_det.splice(index, 1);
 this.refer_claim_no.splice(list_index, 1);
 this.main_tab=true;
 this.active_claim=[];
 this.get_line_items(this.claim_clicked);
 this.check_reassign_alloc(this.claim_clicked);
 this.send_calim_det('footer_data');
 }

//Clear Tabs Details
public clear_refer()
{
  this.main_tab=true;
  this.active_claim=[];
  this.refer_claim_det=[];
  this.refer_claim_no=[];
}


client_notes_data :Array<any> =[];
client_notes_data_list:any=[];


//Save Notes
public savenotes(type:any)
{
  let claim_id=[];
  if(this.active_claim.length != 0)
  {
    let index= this.refer_claim_no.indexOf(this.active_claim);
    claim_id=this.refer_claim_det[index];
  }
  else{
    claim_id=this.claim_clicked;
  }
  // if(type=='processnotes')
  // {
  // this.Jarwis.process_note(this.setus.getId(),this.processNotes.value['processnotes'],claim_id,'processcreate').subscribe(
  //   data  => this.display_notes(data,type),
  //   error => this.handleError(error)
  // );
  // }

  if(type=='client_notes')
  {
    /* this.Jarwis.client_notes(this.setus.getId(),this.clientNotes.value['client_notes'],claim_id,'client_create').subscribe(
    data  =>this.display_notes(data,type),
    error => console.log(error)
  ); */

  this.client_notes_data.push({notes:this.clientNotes.value['client_notes'],id:claim_id['claim_no']});
  this.client_notes_data_list.push(claim_id['claim_no']);
  this.notes_hadler.set_notes(this.setus.getId(),this.clientNotes.value['client_notes'],claim_id,'create_client_notes');
  this.send_calim_det('footer_data');



  }

}

qc_notes:any=[];
//Update Displayed Notes
public display_notes(data:any,type:any)
{
  if(this.active_claim.length != 0)
  {
  this.update_refer_notes(data,type,this.active_claim)
  }
  else{
    if(type=='processnotes')
    {
      this.process_notes=data.data;
    }
    else if(type=='All')
    {
      this.process_notes=data.data.process;
      this.client_notes=data.data.client;
      this.claim_notes=data.data.claim;
      this.qc_notes=data.data.qc;
    }
    else if(type == 'client_notes')
    {
      this.client_notes=data.data;
    }
  }
  this.loading=false;
  this.processNotes.reset();
  this.clientNotes.reset();
}

//Get Notes
public getnotes(claim:any)
{
  this.process_notes=[];
  this.claim_notes=[];
  this.client_notes=[];
    this.qc_notes=[];
  let type='All';
  this.Jarwis.getnotes(claim).subscribe(
    data  => this.display_notes(data,type),
    error => this.handleError(error)
  );
}

//Edit Notes
edit_noteid:any = [];
initial_edit:boolean=false;
public editnotes(type:any,value:any,id:any)
{
//console.log(type,value,id);
  if(type=='client_notes_init')
    {
      let qc_data=this.client_notes_data.find(x => x.id == id['claim_no']);
      //console.log(qc_data)
      this.editnote_value=qc_data.notes;
      this.edit_noteid=id;
      this.initial_edit=true;
    }
    else{
      this.editnote_value=value.content;
      this.edit_noteid=id;
      this.initial_edit=false;
    }

}

//Update Notes
public updatenotes(type:any)
{
  if(this.initial_edit==true)
  {
    //console.log("sending data",this.clientNotes.value['client_notes']);
    this.notes_hadler.set_notes(this.setus.getId(),this.clientNotes.value['client_notes'],this.edit_noteid,'create_client_notes');

    // this.qc_notes_data[this.edit_noteid['claim_no']]=this.qcNotes.value['qc_notes'];

    this.client_notes_data.find(x => x.id == this.edit_noteid['claim_no']).notes=this.clientNotes.value['client_notes'];

    this.initial_edit=false;
    this.send_calim_det('footer_data');
  }
  else{
    if(type=='client_notes')
    {
      let claim_active;

      if(this.main_tab == true)
      {
        claim_active=this.claim_clicked;
      }
      else{
        claim_active=this.refer_claim_det.find((x:any) => x.claim_no == this.active_claim);
      }
        this.Jarwis.client_notes(this.setus.getId(),this.clientNotes.value['client_notes'],this.edit_noteid,'client_note_update').subscribe(
        data  => this.display_notes(data,type),
        error => this.handleError(error)
        );
  }

      }
  this.editnote_value=null;

}

//Clear ProcessNote
public clear_notes()
{
  this.editnote_value=null;
  this.processNotes.reset();
  this.clientNotes.reset();
}

//Send Claim Value to Followup-Template Component on Opening Template
public send_calim_det(type:any)
{
  if(this.main_tab==true)
  {
    if(type=='followup')
    {
      this.follow.setvalue(this.claim_clicked['claim_no']);
      // this.notes_hadler.selected_tab(this.claim_clicked['claim_no']);
    }
    else{
      this.notes_hadler.selected_tab(this.claim_clicked['claim_no']);
      this.notes_hadler.set_claim_details(this.claim_clicked);
    }
  }
  else
  {
    if(type=='followup')
    {
      this.follow.setvalue(this.active_claim);
      // this.notes_hadler.selected_tab(this.active_claim);
    }
    else{
      this.notes_hadler.selected_tab(this.active_claim);
      let claim_detials=this.refer_claim_det.find((x:any) => x.claim_no == this.active_claim);
      this.notes_hadler.set_claim_details(claim_detials);
    }

  }
 }

 handleError(error:any)
{
  //console.log(error);
  this.toastr.errorToastr(error, 'Error')
}



//Work Order table Formation
wo_page_number:number=1;
work_order_data:any;
public get_workorder(filter:any,from:any,to:any,type:any,page:any)
{
  if(filter == null && from == null && to == null)
  {
    this.tab_load=true;
    // console.log("inside",filter,from,to);
    this.Jarwis.get_workorder(0,0,0,3,page,null,null,null,null,null,null,null).subscribe(
      data  => this.form_wo_table(data,page),
      error => this.handleError(error)
      );
  }
  else
  {
this.handleError("NYD");
  }

}

wo_total!:number;
public form_wo_table(data:any,page_no:any)
{
  this.work_order_data=data.data;
  this.wo_total=data.count;
  this.wo_page_number=page_no;
  this.tab_load=false;
}

wo_details:any = [];
wo_name!:string;
wo_created!:string;

//Work Order details fetch
public get_wo_details(id:any,name:any,assigned:any)
{
  this.loading=true;
  this.wo_details=[]
  this.wo_name=name;
  this.wo_created=assigned;
  this.Jarwis.get_workorder_details(id).subscribe(
    data  => this.wo_details_table(data),
    error => this.handleError(error)
    );
}


public wo_details_table(data:any)
{
  this.loading=false;
this.wo_details=data.data;

}

line_data:any=[];
public get_line_items(claim:any)
{

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

line_item_data:any=[];
assign_line_data(data:any)
{
  this.line_item_data.push(data.data);
  this.line_data=data.data;
}

edit_permission:boolean=false;
check_edit_permission(data:any)
{
if(data.includes('client_assistance'))
{
  this.edit_permission=true;
}
else{
  this.edit_permission=false;
}
}

public collect_response(data:any)
{
  this.display_notes(data,'client_notes');
  this.getclaim_details(1,'wo',null,null,'null','null',null,null);
  let index =  this.client_notes_data_list.indexOf(this.active_claim);
  this.client_notes_data_list.splice(index, 1);
}


confirmation_type!:string;
reassign_claim:any = [];
curr_reassigned_claims:any=[];

confirm_reassign(claim:any)
{
  //console.log(claim);
  this.confirmation_type='Reassign';
this.reassign_claim=claim;
}

confirm_action(type:any)
{
if(type == 'Reassign')
{
  let mod_type='audit';
  this.Jarwis.reassign_calim(this.reassign_claim,this.setus.getId(),mod_type).subscribe(
    data  => this.after_reassign(data,this.reassign_claim['claim_no']) ,
    error => this.handleError(error)
  );

}
}


reassign_allocation:boolean=true;
after_reassign(data:any,claim:any)
{
  this.curr_reassigned_claims.push(claim);
  // this.getclaim_details(this.alloc_pages,'allocated');
  this.getclaim_details(1,'wo',null,null,'null','null',null,null);
  this.reassign_allocation=false;
}

check_reassign_alloc(claim:any)
{

  if(this.setus.get_role_id() == '6' && claim['ca_work_order'] != null)
  {
    let already_re=this.curr_reassigned_claims.indexOf(claim.claim_no);
    // console.log("Here REassign",claim,already_re);
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


// get_touch_limit()
// {
//   this.Jarwis.get_practice_stats().subscribe(
//     data =>this.set_prac_settings(data)
//     );
// }

touch_count!:number;
// set_prac_settings(data)
// {
//   let prac_data=data.data;
//   this.touch_count=prac_data.touch_limit;

//  //  console.log(this.touch_count);

// }



myOptions:any = {
  'placement': 'right',
  'hide-delay': 3000,
  'theme':'light'
}


public auto_assign_claims()
{
  //console.log(this.selected_claim_nos,this.users_details,this.selected_associates);

  let assignable_aud=[];
  if(this.selected_associates.length == 0){
    this.users_details.forEach(element => {
      assignable_aud.push(element.id);
  });
  }
  else{
    assignable_aud=this.selected_associates;
  }
  //console.log(assignable_aud);

  let selected_claims=this.selected_claim_nos;
  let init_value=0;
  let users = this.users_details;
  let assigned_details:any=[];


  let assign_value=0;
  assignable_aud.forEach(function (value:any) {
    let keys = value;
    let auditor_det = users.find(x => x['id'] == keys);
//Check Assignable Numbers
    let assign_limit= Number(auditor_det['assign_limit'])-Number(auditor_det['assigned_nos']);

    // Check assignable claims nos
    if((selected_claims.length - Number(assign_value))  < assign_limit)
    {
      assign_limit=selected_claims.length;
    }

    //console.log(selected_claims,assign_limit);



    if(assign_limit >0 && (selected_claims.length - Number(assign_value)) !=0)
    {
      assign_value=Number(init_value)+Number(assign_limit);
      let claims_assigned=selected_claims.slice(init_value,Number(init_value)+Number(assign_limit));
      init_value=Number(init_value)+Number(assign_limit);
      assigned_details.push({assigned_to:auditor_det['id'],claim_nos:assign_limit,claims:claims_assigned});
    }
      });

      this.assigned_claim_details=assigned_details;
      //console.log("o/p",this.assigned_claim_details);
      this.assigned_claim_status=true;
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

//Configuration of Dropdown Search
config:any = {
  displayKey:"description",
  search:true,
  limitTo: 1000,
  result:'single'
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

  public status_code_changed(event:any)
  {
    if(event.value!=undefined)
    {
      let sub_status=this.sub_status_codes_data[event.value.id];
      let sub_status_option=[];
      console.log('sub_status_option');
      if(sub_status == undefined || sub_status =='' )
      {
        this.sub_options=[];
        this.claimsFind.patchValue({
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
            this.claimsFind.patchValue({
              sub_status_code: {id:this.sub_options[0]['id'],description:this.sub_options[0]['description']}
            });
          }
          else{
            this.claimsFind.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      // this.modified_stats.push(event);
    }
  }

  ngOnInit() {
    this.getSearchResults();
    this.get_statuscodes();
    this.getclaim_details(1,'wo',null,null,'null','null',null,null);
    // this.get_user_list();

    this.claimsFind = this.formBuilder.group({
      dos: [],
      age_filter: [],
      claim_no: [],
      acc_no: [],
      patient_name: [],
      total_charge:[],
      total_ar: new FormControl(null, [
        Validators.required,
        Validators.pattern(this.decimal_pattern),
      ]),
      status_code: [],
      sub_status_code: [],
      rendering_provider:[],
      responsibility: [],
      followup_date: [],
      date:[],
      payer_name:[],
      denial_code:[],
      bill_submit_date:[],
      claim_note: [],
      insurance: [],
      prim_ins_name: [],
      prim_pol_id: [],
      sec_ins_name: [],
      sec_pol_id: [],
      ter_ins_name: [],
      ter_pol_id: [],
    });


    this.processNotes = new FormGroup({
      processnotes: new FormControl('', [
        Validators.required
      ])
    });
    this.clientNotes = new FormGroup({
      client_notes: new FormControl('', [
        Validators.required
      ])
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
this.subscription=this.notify_service.fetch_touch_limit().subscribe(message => {
  this.touch_count = message });
}

ngAfterViewInit()
{
  if(this.touch_count == undefined)
  {
    this.touch_count=this.notify_service.manual_touch_limit();
  }
}

ngOnDestroy(){
  // prevent memory leak when component destroyed
  this.subscription.unsubscribe();
  this.observalble.unsubscribe();
  this.response_data.unsubscribe();
}
public togglecollapse(){
    alert("hi")
    this.isopend=!this.isopend;

}

tooltipOptions:any= {
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

public export_excel_files(type:any, table_name:any)
{
  console.log(table_name);
  console.log(this.search);
  console.log(this.claimsFind.value);
  this.Jarwis.fetch_client_claims_export_data(this.setus.getId(), table_name, this.search, this.claimsFind.value).subscribe(
      data  => this.export_handler.create_claim_export_excel(data),
      error => this.error_handler(error)
  );
}

public export_pdf_files(type:any, table_name:any)
{
  let filter='all claims';
  let s_code='adjustment';

  this.Jarwis.fetch_client_claims_export_data_pdf(this.setus.getId(), table_name).subscribe(
    data  => this.export_handler.sort_export_data(data,type,'claim'),
    error => this.error_handler(error)
  );
}

error_handler(error:any){}

getSearchResults(): void {
  this.Jarwis.get_ca_payer_name().subscribe((sr:any) => {
    this.searchResults = sr['payer_names'];
    console.log(this.searchResults);
  });
}
searchOnKeyUp(event:any) {
  let input = event.target.value;
  console.log('event.target.value: ' + input);
  console.log('this.searchResults: ' + this.searchResults);
  if (input.length > 0) {
    this.results = this.searchFromArray(this.searchResults, input);
  }
  else{
    this.selected_val = null;
    this.isValueSelected = false;
  }
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
onselectvalue(value:any) {
  if(value !='' || value !=null){
    this.isValueSelected = true;
  this.selected_val = value;
  }
  else{
    this.selected_val = null;
    this.isValueSelected = false;
  }
}
}
