import { Component, OnInit, TemplateRef, ViewEncapsulation, Input, OnDestroy, EventEmitter, Output, ViewChild } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { SetUserService } from '../../Services/set-user.service';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NotesHandlerService } from '../../Services/notes-handler.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { IfStmt } from '@angular/compiler';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ToastrManager } from 'ng6-toastr-notifications';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerConfig, NgbCalendar, NgbDate, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
@Component({
  selector: 'app-claim-op-footer',
  templateUrl: './claim-op-footer.component.html',
  styleUrls: ['./claim-op-footer.component.css'],
  // encapsulation: ViewEncapsulation.None
})
export class ClaimOpFooterComponent implements OnInit, OnDestroy {
  @Input() tab: any; //Note you need to import Input from @angular/core

  //console.log(tab);
  //   @Input() bankName=[];

  //   ngOnChanges() {
  //     console.log("click",this.bankName);
  //     // this.set_current_tab(this.bankName['claim_no']);
  // }
  claimeds: any;
  fclaims: any;
  formGroup!: FormGroup;
  subscription: Subscription;
  subscription2: Subscription;
  subscription3: Subscription;
  subscription4: Subscription;
  subscription5: Subscription;
  public submitted_claims: string[] = [];

  public status_codes_data: any = [];
  public sub_status_codes_data:any= [];
  public options: any;
  public sub_options: any;
  public selected_claim_data: any = [];
  public associates_options: any;
  public err_type: any;
  public err_val: any;
  public errorCodeValue: any;
  public user: any;
  public user_name: any;
  minDate: any;
  startDate: any;
  followdate_invalid: boolean = false;
  constructor(
    private Jarwis: JarwisService,
    private setus: SetUserService,
    private loadingBar: LoadingBarService,
    private notes_handler: NotesHandlerService,
    public router: Router,
    private modalService: NgbModal,
    public toastr: ToastrManager,
    private date_config: NgbDatepickerConfig,
    private modal: BsModalService,
  ) {
    this.subscription = this.notes_handler.get_current_tab().subscribe(message => { this.set_current_tab(message); });
    this.subscription2 = this.notes_handler.get_claim_details().subscribe(message => { this.set_status_codes(message) });
    this.subscription3 = this.notes_handler.get_notes().subscribe(message => { this.recieve_values(message) });
    this.subscription4 = this.notes_handler.process_get_notes().subscribe(message => { this.process_recieve_values(message) });
    this.subscription5 = this.notes_handler.get_notes().subscribe(msg => { console.log(msg), this.receive_error_codes(msg) });


    const current = new Date();
    this.minDate = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };

    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 1);


  }

  //Get Status codes from Backend
  public get_statuscodes() {
    this.Jarwis.get_status_codes(this.setus.getId(), 'all').subscribe(
      data => { this.process_codes(data), this.assign_codes(data) }
    );
  }

  //Get Associates from backend
  /* public get_associates()
  {
    this.Jarwis.get_associates(this.setus.getId()).subscribe(
      data  => this.process_associates(data)
    );
  } */

  model: any;

  public clear(): void {
    this.model = undefined;
  }

  public get_associate_name(data: any) {
    let data1 = data.associate;
    this.Jarwis.get_associate_name(data1).subscribe(
      data => this.process_associates_name(data)
    );
  }

  //Set Associates Value

  public process_associates_name(data: any) {
    if (data.type == 'Assign') {
      let associate = data.associate;
      let index = this.associates_options.findIndex((v: any) => v.id == associate);
      this.formGroup.patchValue({
        associates: this.associates_options[index],
      });
    }
    else {
      let associates = data['user_detail'];
      let associate_option_data = [];
      if (associates != undefined || associates != '') {
        associate_option_data.push({ id: associates['id'], description: associates['user_name'] })
      }
      this.associates_options = associate_option_data;
      this.formGroup.patchValue({
        associates: { id: associates['id'], description: associates['user_name'] },
      });
    }


  }

  /* public process_associates(data:any)
  {
     console.log("Assoc",data);
    if(data.type == 'Assign')
    {
      let associates = data.associate
      let index=this.associates_options.findIndex(v => v.id == data.associate);
      this.formGroup.patchValue({
        associates: this.associates_options[index],
          });
    }
    else{
      let associates=data.data;
      let associate_option_data=[];
      if(associates!=undefined || associates != '')
      {
      for(let i=0;i<associates.length;i++)
      {
        associate_option_data.push({id: associates[i]['id'], description: associates[i]['firstname'] +' '+ associates[i]['lastname'] })
      }
      }
      this.associates_options=associate_option_data;
      }
  } */

  public receive_error_codes(data: any) {
    console.log(data);
    let user_data = data.note;
    if (user_data.hasOwnProperty("notes_opt")) {
      this.err_val = data.note.notes_opt.error_types;
      console.log(this.err_val);
      this.err_val.forEach((ertype: any) => {
        this.err_type = ertype;
        console.log(this.err_type);
      });
      this.errorvalues();
    }
    else {
      this.err_val = null;
    }
  }

  //Set selected claim_details
  public set_status_codes(data: any) {

    console.log(data);
    this.selected_claim_data = [];
    this.selected_claim_data = data;
    console.log(this.selected_claim_data);
    if (this.note_update_monitor == true) {
      // alert('dd0');
      this.assign_codes(data);
    }
    this.assign_codes(data);

  }
  selected_claim: any;
  public assign_codes(data: any) {
    console.log(data);
    let x:any = false;

    console.log('selected_claim_data',this.selected_claim_data);
    console.log('notes_details',this.notes_details);
    if (this.router.url == '/followup') {
      if ((this.selected_claim_data['claim_note'] != '' && this.selected_claim_data['claim_note'] != undefined && this.selected_claim_data['claim_note'] != null) || (this.selected_claim_data['claims_notes'] != '' && this.selected_claim_data['claims_notes'] != undefined && this.selected_claim_data['claims_notes'] != null)) {
        this.note_validation = true;
      }
    }

    if (this.selected_claim_data['claim_closing'] == 1) {
      if (this.selected_claim_data['claim_closing'] == 1) {
        this.formGroup.patchValue({    // edited..
          closed: 1 // edited.
          });


        //alert(this.selected_claim_data['status_code']);
        if (this.selected_claim_data['status_code'] != '' && this.selected_claim_data['status_code'] != undefined && this.selected_claim_data['status_code'] != null) {
          console.log(this.sub_status_codes_data);
          console.log(this.selected_claim_data['status_code']);
          let status_id;
          status_id = this.status_codes_data.find((v:any) => v.id == this.selected_claim_data['status_code']);
          console.log(status_id);
          let substatus_id= this.sub_status_codes_data[status_id['id']];
          console.log(substatus_id);
          let data = { type: 'initialisation', status_code: status_id['id'], sub_status_id: substatus_id };
          console.log(data);
          this.status_code_changed(data);
          let associate_data = { type: 'Assign', associate: this.selected_claim_data['followup_associate'] };

          this.get_associate_name(associate_data);

          // this.formGroup.patchValue({
          //   status_code: {id:status_id['id'],description:status_id['status_code']+'-'+status_id['description']},
          //   followup_date: {year:this.selected_claim_data['followup_date'][2],month:this.selected_claim_data['followup_date'][1],day:this.selected_claim_data['followup_date'][0]},
          // });
          console.log('status_id[id]',status_id['id']);
          console.log('status_id[status_code]',status_id['status_code']);
          console.log('status_id[description]',status_id['description']);

          if (Array.isArray(this.selected_claim_data['followup_date'])) {
            console.log('It is an array');
            console.log(this.selected_claim_data['followup_date']);
            if (this.selected_claim_data['followup_date'][2] == 1970) {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: '',
                closed: 1
              });

            } else {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: { year: this.selected_claim_data['followup_date'][2], month: this.selected_claim_data['followup_date'][1], day: this.selected_claim_data['followup_date'][0] },
                closed: 1
              });
              x = true;
              console.log('For FollowUp Closed Claims the footer values comes here....');

            }
          }
          else {
            console.log('Not an array');
            console.log(this.selected_claim_data['followup_date']);
            var str = this.selected_claim_data['followup_date'];
            console.log(str);
            if (str == null) {
              this.selected_claim_data['followup_date'] = '';
            } else {
              this.selected_claim_data['followup_date'] = str.split("-");
            }
            console.log(this.selected_claim_data['followup_date']);
            if (Number(this.selected_claim_data['followup_date'][0]) == 1970) {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: '',
                closed: 1
              });

            } else {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: { year: Number(this.selected_claim_data['followup_date'][0]), month: Number(this.selected_claim_data['followup_date'][1]), day: Number(this.selected_claim_data['followup_date'][2]) },
                closed: 1
              });

            }
          }


          //}
        }

      }
      this.claim_closed = true;

    //   if(x== true)
    //   {this.formGroup.controls['status_code'].disable();
    //   this.formGroup.controls['sub_status_code'].disable();
    //   this.formGroup.controls['followup_date'].disable();
    // this.tab_status = true;}
    //   else{
    // }

    this.formGroup.controls['status_code'].enable();
    this.formGroup.controls['sub_status_code'].enable();
    this.formGroup.controls['followup_date'].enable();

      if (this.router.url == '/audit') {
        this.formGroup.controls['status_code'].disable();
        this.formGroup.controls['sub_status_code'].disable();
        this.formGroup.controls['followup_date'].disable();
        this.formGroup.controls['associates'].disable();
      }

    }
    else {
      this.claim_closed = false;
      this.formGroup.controls['status_code'].enable();
      this.formGroup.controls['sub_status_code'].enable();
      this.formGroup.controls['followup_date'].enable();
      if (this.router.url == '/audit') {
        this.formGroup.controls['associates'].enable();
      }
      if (this.selected_claim_data['status_code'] != '' && this.selected_claim_data['status_code'] != undefined && this.selected_claim_data['status_code'] != null) {
        //  alert('test '+this.selected_claim_data['followup_date']);
        let status_id = this.status_codes_data.find((v:any) => v.id == this.selected_claim_data['status_code']);
        let substatus_id = this.sub_status_codes_data[status_id['id']];
        let data = { type: 'initialisation', status_code: status_id['id'], sub_status_id: substatus_id };
        this.status_code_changed(data);
        let associate_data = { type: 'Assign', associate: this.selected_claim_data['followup_associate'] };

        this.get_associate_name(associate_data);
        if (this.selected_claim_data['followup_date'] == null) {
          this.formGroup.patchValue({
            status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
            followup_date: '',
            closed: 0
          });
        } else {
          if (Array.isArray(this.selected_claim_data['followup_date'])) {
            console.log('It is an array');
            console.log(this.selected_claim_data['followup_date']);
            if (this.selected_claim_data['followup_date'][2] == 1970) {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: '',
                closed: 0
              });
            } else {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: { year: this.selected_claim_data['followup_date'][2], month: this.selected_claim_data['followup_date'][1], day: this.selected_claim_data['followup_date'][0] },
                closed: 0
              });
              let f_date = this.formGroup.controls['followup_date'].value;
        //       const date: Date = new Date(f_date);

        // const year: number = date.getUTCFullYear();
        // const month: number = date.getUTCMonth() + 1; // Adding 1 since getUTCMonth() returns zero-based month (0-11)
        // const day: number = date.getUTCDate();

        // const result = { year, month, day };

        // console.log(result);
        // f_date = result;
              if (this.minDate.year > f_date.year) {
                this.followdate_invalid = true;
              }
              else if (this.minDate.month > f_date.month) {
                this.followdate_invalid = true;
              }
              else if (this.minDate.day >= f_date.day) {
                this.followdate_invalid = true;
              }
            }
          } else {
            console.log('Not an array');
            console.log(this.selected_claim_data['followup_date']);
            var str = this.selected_claim_data['followup_date'];
            console.log(str);
            if (str == null) {
              this.selected_claim_data['followup_date'] = '';
            } else {
              this.selected_claim_data['followup_date'] = str.split("-");
            }
            console.log(this.selected_claim_data['followup_date']);
            if (Number(this.selected_claim_data['followup_date'][0]) == 1970) {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: '',
                closed: 0
              });
            } else {
              this.formGroup.patchValue({
                status_code: { id: status_id['id'], description: status_id['status_code'] + '-' + status_id['description'] },
                followup_date: { year: Number(this.selected_claim_data['followup_date'][0]), month: Number(this.selected_claim_data['followup_date'][1]), day: Number(this.selected_claim_data['followup_date'][2]) },
                closed: 0
              });
              let f_date = this.formGroup.controls['followup_date'].value;

        //       const date: Date = new Date(f_date);

        // const year: number = date.getUTCFullYear();
        // const month: number = date.getUTCMonth() + 1; // Adding 1 since getUTCMonth() returns zero-based month (0-11)
        // const day: number = date.getUTCDate();

        // const result = { year, month, day };

        // console.log(result);
        // f_date = result;
              if (this.minDate.year > f_date.year) {
                this.followdate_invalid = true;
              }
              else if (this.minDate.month > f_date.month) {
                this.followdate_invalid = true;
              }
              else if (this.minDate.day >= f_date.day) {
                this.followdate_invalid = true;
              }
            }
          }

          // const myArray = ["A", "B", "C"]
          // console.log(isStringArray(myArray));


          // if(this.selected_claim_data['followup_date']){

          //   this.formGroup.patchValue({
          //     status_code: {id:status_id['id'],description:status_id['status_code']+'-'+status_id['description']},
          //     followup_date: {year:this.selected_claim_data['followup_date'][2],month:this.selected_claim_data['followup_date'][1],day:this.selected_claim_data['followup_date'][0]},
          //     closed: 0
          //   });
          // }else{

          //   this.formGroup.patchValue({
          //     status_code: {id:status_id['id'],description:status_id['status_code']+'-'+status_id['description']},
          //     followup_date: {year:this.selected_claim_data['followup_date'][2],month:this.selected_claim_data['followup_date'][1],day:this.selected_claim_data['followup_date'][0]},
          //     closed: 0
          //   });
          // }

        }

        console.log(this.formGroup.value['status_code']);
        //}
      }

    }
  }


  //Process and Display Claim Codes
  public process_codes(data: any) {
    let status_option = [];
    this.status_codes_data = data.status;
    this.sub_status_codes_data = data.sub_status;
    for (let i = 0; i < this.status_codes_data.length; i++) {
      if (this.status_codes_data[i]['status'] == 1) {
        // alert(this.status_codes_data[i]['status_code']);    //////   '-' + this.status_codes_data[i]['description']
        status_option.push({ id: this.status_codes_data[i]['id'], description: this.status_codes_data[i]['status_code']});
      }
    }
    this.options = status_option;

    if (this.router.url == '/rcm') {
      this.note_validation = true;

    }
    if (this.router.url == '/claims') {
      this.note_validation = true;

    }
    /* if(this.router.url=='/audit')
    {
      this.note_validation=true;

    } */
  }

  @ViewChild('option1') option1!: TemplateRef<any>;
  @ViewChild('option2') option2!: TemplateRef<any>;
  @ViewChild('option3') option3!: TemplateRef<any>;
  @ViewChild('option4') option4!: TemplateRef<any>;
  @ViewChild('option5') option5!: TemplateRef<any>;
  @ViewChild('option6') option6!: TemplateRef<any>;
  @ViewChild('option7') option7!: TemplateRef<any>;
  @ViewChild('option8') option8!: TemplateRef<any>;
  @ViewChild('option9') option9!: TemplateRef<any>;
  @ViewChild('option10') option10!: TemplateRef<any>;
  @ViewChild('option11') option11!: TemplateRef<any>;
  @ViewChild('option12') option12!: TemplateRef<any>;
  selectedOptions:any
  //Handle Claim Code Changed event
  followUpDateValidate : boolean = false;
  public status_code_changed(event: any) {
    console.log('event', event.type);

    if (event.value != undefined) {
      let sub_status: any = this.sub_status_codes_data[event.value.id];

      let sub_status_option = [];

      console.log('sub_status_option');
      console.log('Sub Status',sub_status);


      if (sub_status == undefined || sub_status == '') {
        this.sub_options = [];
        this.formGroup.patchValue({
          sub_status_code: {id:21,description:'Reprocess'}   //edited
        });
      }
      else {
        for (let i = 0; i < sub_status.length; i++) {
          if (sub_status[i]['status'] == 1) {
            sub_status_option.push({ id: sub_status[i]['id'], description: sub_status[i]['status_code'] + '-' + sub_status[i]['description'] });
          }

          this.sub_options = sub_status_option;
          if (this.sub_options.length != 0) {
            this.formGroup.patchValue({
              sub_status_code: { id: this.sub_options[0]['id'], description: this.sub_options[0]['description'] }
            });
          }
          else {
            this.formGroup.patchValue({
              sub_status_code: ""
            });
          }
        }
      }
      this.modified_stats.push(event);
    }
    if (event.type == "initialisation") {
      let sub_status: any = this.sub_status_codes_data[event.status_code];
      let sub_status_selected: any = event.sub_status_id;
      let sub_status_option = [];
      for (let i = 0; i < sub_status.length; i++) {
        if (sub_status[i]['status'] == 1) {
          sub_status_option.push({ id: sub_status[i]['id'], description: sub_status[i]['status_code'] + '-' + sub_status[i]['description'] });
        }

        // this.formGroup.patchValue({
        //   sub_status_code: sub_status[index]['id']
        //  });
      }
      this.sub_options = sub_status_option;
      //console.log("Sub Option",this.sub_options,this.selected_claim_data['substatus_code']);
      // console.log("Event",event,this.selected_claim_data,this.sub_options);
      // this.formGroup.get('sub_status_code').setValue(sub_status_selected[0]['id']);
      let index = this.sub_options.findIndex((x: any) => x.id == this.selected_claim_data['substatus_code']);
      // console.log("SStstus",this.sub_options,sub_status,sub_status[index]['id']);
      //  this.formGroup.get('sub_status_code').setValue({id:this.selected_claim_data['substatus_code']});
      this.formGroup.patchValue({
        sub_status_code: { id: this.selected_claim_data['substatus_code'], description: this.sub_options[index]['description'] }
      });
    }
    // console.log('sss',this.selectedOptions);
    // console.log('Form control',this.formGroup.value);
    // console.log('Form control status',this.formGroup.value['status_code']);
    let status_code_value = this.formGroup.value['status_code'];
    console.log('INside',status_code_value.description);
    if(status_code_value.description == "Claim Not On File"){
      this.openModal(this.option1);
      let date = new Date();

      let updatedDate = new Date(date.setDate(date.getDate() + 7));
      let formattedDate = updatedDate.toLocaleDateString('en-US');

      console.log('asasasasasas',formattedDate);
      this.model = formattedDate;
    }
    else if(status_code_value.description == "Capitation"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option2);
    }
    else if(status_code_value.description == "Claim denied for lack of Primary EOB"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option3);
    }
    else if(status_code_value.description == "Claim has been forwarded to pricing center"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option4);
    }
    else if(status_code_value.description == "Co-ordination of Benefits"){
      this.followUpDateValidate = true;
      this.formGroup.controls['followup_date'].setValidators([Validators.required]);
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Coverage terminated"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option6);
    }
    else if(status_code_value.description == "Deductible"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option7);
    }
    else if(status_code_value.description == "Duplicate Claim"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option8);
    }
    else if(status_code_value.description == "Global"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option9);
    }
    else if(status_code_value.description == "Hospice"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option10);
    }
    else if(status_code_value.description == "Inclusive/bundled/global"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option11);
    }
    else if(status_code_value.description == "In-process"){
      this.followUpDateValidate = true;
      this.formGroup.controls['followup_date'].setValidators([Validators.required]);
      this.openModal(this.option12);
      let date = new Date();

      let updatedDate = new Date(date.setDate(date.getDate() + 7));
      let formattedDate = updatedDate.toLocaleDateString('en-US');

      console.log('asasasasasas',formattedDate);
      this.model = formattedDate;
    }
    else if(status_code_value.description == "Medical records"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "No claim on file or Claim not on file"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Offset Adjustment"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Claim Paid to Provider"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Patient can’t be identified"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Required W9 form"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Voice mail"){
      this.followUpDateValidate = true;
      this.formGroup.controls['followup_date'].setValidators([Validators.required]);
      this.followUpDateValidate = true;
      this.openModal(this.option5);
    }
    else if(status_code_value.description == "Claim Paid to PT"){
      this.formGroup.controls['closed'].disable();
      this.followUpDateValidate = false;
      this.formGroup.controls['followup_date'].clearValidators();
      this.openModal(this.option5);
    }
  }
  // ShowQuestions(event:any){
  //   console.log('Select Target Value',event.target.value);

  //   // this.openModal(this.option1);
  // }

  //Configuration of Dropdown Search

  public active_tab: any;
  public notes_details: Array<any> = [];
  public process: Array<any> = [];
  public note_validation: boolean = false;
  public tab_status: boolean = false;
  //Recieve selected data form other Component and Set data of Selected tab
  public set_current_tab(claim: any) {
    this.active_tab = claim;
    console.log('Active_Tab', this.active_tab);
    console.log('Notes Details', this.notes_details);
    // console.log("Active tab",this.active_tab)


    if (!this.notes_details.find(x => x.claim_no == this.active_tab)) {
      this.note_validation = false;
      console.log(this.note_validation);
    }
    else {
      this.note_validation = true;
    }



    if (this.submitted_claims.includes(this.active_tab)) {
      this.tab_status = true;
      if (this.submit_tab_types[this.active_tab] == 'Audit') {
        this.message = "Audit Processing Completed";
      }
      else {
        this.message = "Moved to Audit Processing";
      }

      // this.toastr.successToastr('Claim Processed', this.message) ;
    }
    else {
      // When its not undefined
      // console.log("Claim_datra",this.claim_data);
      this.get_note_details();
    }
  }

  //Handle Validation of Notes
  public recieve_values(data: any) {
    console.log('working');
    console.log("Notse data", data);
    this.Sample_notes = data;
    if(this.router.url!='/followup')
    {
    console.log('errorrrr',this.Sample_notes.note.notes_opt.error_types[0]);
    if(this.Sample_notes.note.notes_opt.error_types[0] !=1){
     this.formGroup.controls['closed'].disable();
     this.closed_claim_cdtn = false;
    }
    else{
     this.formGroup.controls['closed'].enable();
    }
   }

    if (this.notes_details.find(x => x.claim_no == this.active_tab)) {
      let claim = this.notes_details.find(x => x.claim_no == this.active_tab);
      let index = this.notes_details.findIndex(x => x == claim);
      this.notes_details[index] = data;

    }
    else {
      this.notes_details.push(data);
    }

    if (!this.notes_details.find(x => x.claim_no == this.active_tab)) {
      this.note_validation = false;
    }
    else {
      this.note_validation = true;
    }
  }

  public process_recieve_values(data: any) {
    console.log("Notse data", data);
    if (this.process.find(x => x.claim_no == this.active_tab)) {
      let claim = this.process.find(x => x.claim_no == this.active_tab);
      let index = this.process.findIndex(x => x == claim);
      this.process[index] = data;

    }
    else {
      this.process.push(data);
    }

    if (!this.process.find(x => x.claim_no == this.active_tab)) {
      this.note_validation = false;
    }
    else {
      this.note_validation = true;
    }
  }

  public handleError(error: any) {
    console.log(error);
  }
  Sample_notes:any;
  closed_claim_cdtn:boolean = false;
  public check_updates() {
    if (this.note_validation == true) {
      if (this.router.url != '/rcm') {
        if (this.router.url == '/followup') {
          console.log('Selected_Claims',this.selected_claim_data);
          console.log(this.selected_claim_data['claim_note']);
          let note_val;
          if (this.selected_claim_data['claim_note'] != '' && this.selected_claim_data['claim_note'] != undefined && this.selected_claim_data['claim_note'] != null) {
            note_val = this.selected_claim_data['claim_note'];
          }
          else if (this.selected_claim_data['claims_notes'] != '' && this.selected_claim_data['claims_notes'] != undefined && this.selected_claim_data['claims_notes'] != null) {
            note_val = this.selected_claim_data['claims_notes'];
          }
          this.selected_claim_data.followup_date = [this.result.month,this.result.day,this.result.year];
          this.notes_details.push({ note: note_val, claim: this.selected_claim_data, type: 'claimpresent', claim_no: this.selected_claim_data['claim_no'] });
          //this.notes_details.patchValue({user:user_id,note:notes,claim:claim_id,type:command_type,claim_no:claim_id['claim_no']});
          //this.note_validation=true;
        }
        console.log('Notes Details', this.notes_details);

        let selected_details = this.notes_details.find(x => x.claim_no == this.active_tab);
        console.log(selected_details);
        let user_notes = selected_details['note'];
        let user = selected_details['user'];
        let input_type = selected_details['type'];
        let claim_details = selected_details['claim'];

        if(this.router.url=='/audit'){
          let error_type_value = this.Sample_notes.note.notes_opt.error_types[0];
          console.log('asasasas',error_type_value);

          let closed_formControl_value = this.formGroup.value.closed;
          console.log('Closed FormControl Value',closed_formControl_value);
          if(closed_formControl_value==1 )
          {
            console.log('For No Error Claims');
            this.Jarwis.check_notes_update(claim_details,'all',this.claim_data).subscribe(
                  data  => this.set_note_update_val(data),
                  error => this.handleError(error)
                  );
          }
          else if(closed_formControl_value == undefined)
          {
            console.log('For Error Claims and other claims');
            this.Jarwis.check_notes_update(claim_details,'all',this.claim_data).subscribe(
              data  => this.set_note_update_val(data),
              error => this.handleError(error)
              );
          }
          else
          {
            this.closed_claim_cdtn= true;
          }
        }
        // if(input_type=='claim_create')
        //     {
         if(this.router.url!='/audit')
              this.Jarwis.check_notes_update(claim_details,'all',this.claim_data).subscribe(
                data  => this.set_note_update_val(data),
                error => this.handleError(error)
                );
        // }
      }

    }

  }

  //Save reference for later use
  confirm_modal!: string | TemplateRef<any>;
  save_ref(ref: any) {
    this.confirm_modal = ref;
  }

  note_update_monitor: boolean = false;

  set_note_update_val(data: any) {
    console.log("Its goods", data);
    if (data.updated == true && this.router.url == '/followup') {
      console.log('update true - landed here');
      let selected_data = this.notes_details.find(x => x.claim_no == this.active_tab);
      console.log(selected_data);
      if (selected_data['type'] == 'claimpresent') {
        this.finish_followup();
      }
      else {
        console.log('update true - other type');
        this.note_update_monitor = false;
        this.followup_process();
        this.finish_followup();
        this.followup_process_notes();
      }
    }
    else if (data.updated == true && this.router.url != '/followup') {
      this.note_update_monitor = true;
      this.open(this.confirm_modal);
      if (data.cc == true) {
        this.notes_handler.refresh_notes('all');
      }

      else {
        this.notes_handler.refresh_notes('notes');
      }
      this.get_note_details();
    }
    else if (data.updated == false && this.router.url == '/followup') {
      console.log('landed here');
      let selected_data = this.notes_details.find(x => x.claim_no == this.active_tab);
      console.log('selected_data',selected_data);
      if (selected_data['type'] == 'claimpresent') {
        this.finish_followup();
      }
      else {
        console.log('other type');
        this.note_update_monitor = false;
        this.followup_process();
        this.finish_followup();
        this.followup_process_notes();
      }
    }
    else {
      this.note_update_monitor = false;
      this.followup_process();
      this.finish_followup();
      this.followup_process_notes();
    }
  }

  closeResult: string = '';
  modalRef?: BsModalRef;
  public config: any = {
    displayKey: "description",
    search: true,
    limitTo: 1000,
    result: 'single'
  }
  open(content: any) {
    this.openModal(content);
    // this.modalService.open(content, { windowClass: 'dark-modal_footer' });
  }

  openModal(model_name: TemplateRef<any>) {
    this.modalRef = this.modal.show(model_name, this.config);
  }
  closeModal(modal_name: any){
   this.modal.hide(modal_name);
  }

  public followup_process_notes() {
    let selected_details: any = this.process.find(x => x.claim_no == this.active_tab);
    console.log(selected_details);
    let user_notes = selected_details['note'];
    let user = selected_details['user'];
    let input_type = selected_details['type'];
    let claim_details = selected_details['claim'];
    console.log(claim_details);
    // this.Jarwis.claim_note(this.setus.getId(),user_notes,claim_details,'claim_create').subscribe(
    //   data  => this.response_handler(data,'followup'),
    //   error => this.handleError(error)
    // );
    this.Jarwis.process_note(this.setus.getId(), user_notes, claim_details, 'processcreate', 'followup').subscribe(
      data => this.response_handler(data, 'followup'),
      error => this.handleError(error)
    );
  }

  //Create Notes after Validation of Notes and Status Code
  public followup_process() {
    if (this.router.url != '/rcm') {
      if (this.note_validation == true) {
        let selected_details = this.notes_details.find(x => x.claim_no == this.active_tab);
        let user_notes = selected_details['note'];
        let user = selected_details['user'];
        let input_type = selected_details['type'];
        let claim_details = selected_details['claim'];

        console.log(selected_details);
        if (input_type == 'claim_create') {
          // this.Jarwis.claim_note(this.setus.getId(), user_notes, claim_details, 'claim_create').subscribe(
          //   data => this.response_handler(data, 'followup'),
          //   error => this.handleError(error)
          // );
        }

        else if (input_type == 'create_qcnotes') {
          this.Jarwis.qc_note(this.setus.getId(), user_notes, claim_details, 'create_qcnotes').subscribe(
            data => this.response_handler(data, 'audit'),
            error => this.handleError(error)
          );
        }
        else if (input_type == 'create_client_notes') {
          this.Jarwis.client_notes(this.setus.getId(), user_notes, claim_details, 'client_create').subscribe(
            data => this.response_handler(data, 'CA'),
            error => this.handleError(error)
          );
        }
      }
    }
  }

  //Set Status-code details for claims and Moving claims to next Level of processing
  public finish_followup() {
    let input_type: any;
    let claim_details: any;
    let user_data: any;
    let audit_err;
    if (this.router.url != '/rcm') {
      console.log('rcm');

      let selected_details = this.notes_details.find(x => x.claim_no == this.active_tab);

      // console.log(x.claim_no);
      console.log(this.active_tab);

      console.log(selected_details);
      user_data = selected_details['note'];

      input_type = selected_details['type'];
      claim_details = selected_details['claim'];
    }
    else {
      console.log('rcm_create');
      input_type = 'rcm_create';
      claim_details = this.selected_claim_data;
    }
    console.log(claim_details);
    console.log('finish_followup');
    console.log(this.formGroup.value);
    this.formGroup.value.followup_date = this.result;
    console.log('Updated FormGroup',this.formGroup.value);
    if (user_data.hasOwnProperty("notes_opt")) {
      let er_data = user_data.notes_opt.error_types;
      console.log(er_data);
      audit_err = er_data.toString();
      console.log(audit_err);
      claim_details.content = user_data.notes;
    }
    else {
      audit_err = null;
    }
    let data_codes = { status: this.formGroup.value, audit_err_code: audit_err }
    // console.log("i\p",input_type,this.formGroup.value,input_type,claim_details)
    if (input_type == 'claimpresent') {
      let i_type = 'claim_create'
      this.Jarwis.finish_followup(this.setus.getId(), data_codes, claim_details, i_type).subscribe(
        data => { console.log(data), this.handle_resources(data, this.formGroup.value), this.response_handler(data, 'followup') },
        error => this.handleError(error)
      );
    }
    else {
      this.Jarwis.finish_followup(this.setus.getId(), data_codes, claim_details, input_type).subscribe(
        data => this.handle_resources(data, this.formGroup.value),
        error => this.handleError(error)
      );
    }

  }
  public submit_tab_types: Array<any> = [];
  public message: string = '';

  //Set Status code data and Handle claim status
  public handle_resources(data: any, form_value: any) {
    console.log(data.message);
    console.log(data);

    if (data.message == 1) {
      this.submitted_claims.push(this.active_tab);
      this.tab_status = true;

      // this.formGroup.get('sub_status_code').setValue(form_value.sub_status_code);
      // this.formGroup.patchValue({
      //   status_code: {disabled: true},
      //   sub_status_code: {disabled: true},
      //   associates: {disabled: true},
      //   followup_date: {disabled: true}
      // });

      if (data.type == "Followup") {
        this.submit_tab_types[this.active_tab] = data;
        this.message = "Claim Processed";
        this.callMethod()

      }
      else if (data.type == "Audit") {

        this.submit_tab_types[this.active_tab] = data;
        this.message = "Audit Completed";
      }
      else if (data.type == "CA") {
        this.submit_tab_types[this.active_tab] = data;
        this.message = "Claim Processed";
      }
      this.toastr.successToastr(this.message);

    }
    this.modalService.hasOpenModals() == false;
  }

  //Handling Response after creation of followup trigerring functoions in other components
  public response_handler(data: any, type: any) {
    console.log(data);
    this.notes_handler.set_response(data, type);
  }

  claim_data: Array<any> = [];
  public set_note_details(data: any) {

    this.claim_data = data;

    console.log(this.claim_data);
    // console.log("Claim_datra",this.claim_data);
  }

  get_note_details() {
    console.log("active", this.active_tab)
    this.Jarwis.get_note_details(this.active_tab).subscribe(
      data => this.set_note_details(data)
    );
  }

  modified_stats: any = [];
  alert_message: string = '';
  save_alert_function(alert_mod: any,) {
    if (this.router.url == '/followup') {
      console.log('inside', this.modified_stats);
      if (this.modified_stats.length > 0) {
        this.check_updates();
        // this.save_ref(conf_mod);
      }
      else {
        this.alert_message = 'Status not changed. Do you wish to continue?';
        this.open(alert_mod);

      }
    }
    else {
      if (this.modified_stats.length > 1) {
        this.check_updates();
        // this.save_ref(conf_mod);
      }
      else {
        this.alert_message = 'Status not changed. Do you wish to continue?';
        this.open(alert_mod);
      }
    }
  }

  claim_closed: boolean = false;
  closed_event(event: any) {
    let checked = event.currentTarget.checked;

    if (checked == true) {
      this.closed_claim_cdtn =false;
      this.claim_closed = true;
      this.formGroup.controls['status_code'].enable();
      this.formGroup.controls['sub_status_code'].enable();
      this.formGroup.controls['followup_date'].disable();
      this.modified_stats.push('closed');

      if (this.router.url == '/audit') {
        this.formGroup.controls['associates'].enable();
      }

    }
    else {
      this.claim_closed = false;

      this.formGroup.controls['status_code'].enable();
      this.formGroup.controls['sub_status_code'].enable();
      this.formGroup.controls['followup_date'].enable();

      if (this.router.url == '/audit') {
        this.formGroup.controls['associates'].enable();
      }

      if (this.modified_stats.length > 0) {
        this.modified_stats.pop();
      }

    }

  }
  public followup_closed() {
    this.formGroup.controls['closed'].disable();
  }
  public followtoggle() {
    // this.formGroup.controls['followup_date'].reset();
    this.formGroup.controls['closed'].enable();
  }
  /* get_values()
  {
    //alert('te');
        //Test of fork join
        this.Jarwis.get_process_associates(this.setus.getId(),this.active_tab,this.router.url).subscribe(
          data  => {
            this.process_codes(data[0]),
            //this.process_associates(data[1]),
            // this.set_note_details(data[2]),
            this.assign_codes(data);
          }
        );
  } */

  errorvalues() {
    if (this.err_type != null && this.err_type != '' && this.err_type != undefined) {
      this.Jarwis.get_audit_codes(this.setus.getId()).subscribe(
        data => {
          this.seterrcode(data);
        }
      );
    }
  }
  public seterrcode(value: any) {
    let errcode = value.err_types;
    let evalue = errcode.find((x: any) => x.id == this.err_type);
    this.errorCodeValue = evalue.name;
  }

  public disableClaim(): any {
    let disableClaim;
    if (this.errorCodeValue == 'Error' || this.errorCodeValue == 'FYI' || this.errorCodeValue == 'Clarification') {
      disableClaim = this.formGroup.controls['closed'].disable();
    }
    this.claim_closed = false;
    return disableClaim;
  }

  ngOnInit() {

    console.log('claimeds',this.claimeds);

  this.note_validation = this.setus.change_status.value;

  console.log('Tab Status ',this.note_validation);


    //this.get_values();
    //this.get_associates();
    this.get_statuscodes();
    //Observables for claim selection
    if (this.router.url == '/followup') {
      //alert(this.router.url);
      this.formGroup = new FormGroup({
        status_code: new FormControl('', [
          Validators.required,

        ]),
        sub_status_code: new FormControl('', [

        ]),
        associates: new FormControl('', [
          Validators.required
        ]),
        followup_date: new FormControl('', [

        ]),
        closed: new FormControl(null, [
          Validators.required
        ])
      });
    } else {
      this.formGroup = new FormGroup({
        status_code: new FormControl('', [
          Validators.required
        ]),
        sub_status_code: new FormControl('', [
          Validators.required
        ]),
        associates: new FormControl('', [
          Validators.required
        ]),
        followup_date: new FormControl('', [
          Validators.required
        ]),
        closed: new FormControl(null, [
          Validators.required
        ])
      });
    }


    //console.log(this.formGroup.value);

    if (this.router.url == '/followup') {
      if (this.tab == 'allocated') {
        //console.log(this.tab);
        this.formGroup.removeControl('associates')
      } else {
        //console.log('this.tab');
        this.formGroup.removeControl('associates')
      }
    }

    /* this.errorvalues();
    this.seterrcode(this.errorCodeValues); */

  }

  //   ngAfterViewInit()
  //   {
  // this.get_statuscodes();
  //   }
  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
    this.subscription4.unsubscribe();
    this.subscription5.unsubscribe();

  }
  claimed() {
    return this.claimeds;
  }
  fclaim() {
    return this.fclaims;
  }
   result:any;
  check_follow_date() {
    let f_date: any;
    this.formGroup.get("followup_date")?.valueChanges.subscribe((selectedValue: any) => {
      setTimeout(() => {
        const date: Date = new Date(selectedValue);

        const year: number = date.getUTCFullYear();
        const month: number = date.getUTCMonth() + 1; // Adding 1 since getUTCMonth() returns zero-based month (0-11)
        const day: number = date.getUTCDate();

         this.result = { year, month, day };

        console.log(this.result);
        f_date = this.result;
        console.log(f_date);
        if (f_date != '' || f_date != null || f_date != undefined) {
          if (this.minDate.year > f_date.year) {
            console.log('change year');
            this.followdate_invalid = true;
          }
          else if (this.minDate.month > f_date.month) {
            console.log('change month');
            this.followdate_invalid = true;
          }
          else if (this.minDate.day >= f_date.day  && this.minDate.month > f_date.month) {
            console.log('change date');
            this.followdate_invalid = true;
          }
          else {
            this.followdate_invalid = false;
          }
        }
      })
    })
  }

  bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true });

  @Output() methodCalled = new EventEmitter<any>();
  callMethod() {
    // Call method and emit an event to notify the parent component
    let data: boolean = true;
      this.methodCalled.emit(data);

  }

}
