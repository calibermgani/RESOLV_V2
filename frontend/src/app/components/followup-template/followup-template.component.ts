import { Component, ViewChild, ElementRef, OnInit ,  HostBinding, Input, Renderer2 } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { SetUserService } from '../../Services/set-user.service';
import { FollowupService } from '../../Services/followup.service';
import { NgbDatepickerConfig, NgbCalendar, NgbDate, NgbDateStruct,NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
//import { FollowupViewComponent } from '../../components/followup-view/followup-view.component';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-followup-template',
  templateUrl: './followup-template.component.html',
  styleUrls: ['./followup-template.component.css']
})
export class FollowupTemplateComponent implements OnInit {
  @Input() data:any;
  question;
  name = 'Angular';

  selected: any;
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


  constructor(
    private Jarwis: JarwisService,
    private follow:FollowupService,
    private setus: SetUserService,
    private calendar: NgbCalendar,
    private element: ElementRef,
    private renderer: Renderer2,
    private _parserFormatter: NgbDateParserFormatter,
    private router: Router,
    // private followupView: FollowupViewComponent,
  ) {


    this.question = this.data;
     console.log(this.question);
     this.alwaysShowCalendars = true;

    //this.followupView.templateEditResponse(data);
    // this.fromDate = calendar.getToday();
    // this.toDate = calendar.getToday();
   }

  //  onDateSelection(date: NgbDate,drop:any) {
  //   if (!this.fromDate && !this.toDate) {
  //     this.fromDate = date;
  //     console.log('from' + this.fromDate);
  //     console.log('to' + this.toDate);
  //   }else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
  //     this.toDate = date;
  //     console.log('from' + this.fromDate);
  //     console.log('to' + this.toDate);
  //     drop.close()
  //   }else {
  //     this.toDate = null;
  //     this.fromDate = date;
  //   }
  //   this.range=this.formatRange(this.fromDate,this.toDate)
  //   console.log('range' + this.range);
  // }

  model:any;
  formdata = new FormData();
  followUp!: FormGroup;
  values:any[] = [];
  questions:any[] = [];
  questions_data: any[] = [];
  field_label:string[] = [];
  category_label:string[] = [];
  select_id:number = 0;

  //Get values of categories from backend
public get_values()
{
this.Jarwis.get_category('id').subscribe(
  data  => this.assign_value(data),
  error => this.handleError(error)
  );
}

radioClear(){
  this.get_values();
  //this.followUp.setValue(null);
}


public assign_value(data:any)
{
  if(data.data.length!=0)
  {
    this.values=data.data;
    console.log(this.values);
    this.questions=[];
    this.questions=data.quest[1];
    this.questions_data=data.quest;
    console.log(this.questions);
    this.select_id=1;
    let field_list:any=[];
    this.questions.forEach(function (value:any) {
    let data:any = value['question_label'];
    field_list.push(data);
    });
    this.field_label=field_list;
    for(let i=0;i<this.field_label.length;i++)
    {
      console.log(this.questions[i]['field_validation']);
      if(this.questions[i]['field_validation']=='Number')
      {
        console.log(this.field_label[i]);
        this.followUp.addControl(this.field_label[i], new FormControl('',  [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/)
        ]));
      }
      else
      {
        this.followUp.addControl(this.field_label[i], new FormControl('', Validators.required));
      }
    }
  }

}

public get_insurance(){
  this.Jarwis.get_insurance(this.setus.getId()).subscribe(
      data  => this.handleInsurance(data),
      error => this.handleError(error)
    );
}

insurance:any;
public status_codes_data:Array<any> =[];
  public sub_status_codes_data:string[] = [];
  public options:any;
handleInsurance(data:any){

  let status_option=[];
    this.status_codes_data=data.claim_data;
    for(let i=0;i<this.status_codes_data.length;i++)
    {

        status_option.push({id: this.status_codes_data[i]['id'], description: this.status_codes_data[i]['ins_name'] } );

    }
    this.insurance = status_option;

}

public change_category(id:any)
{
  if(this.select_id != id)
  {
  //Remove Form Names
  for(let i=0;i<this.field_label.length;i++)
  {
    this.followUp.removeControl(this.field_label[i]);
  }
  //Assign Questions
  this.questions=[];
  this.questions=this.questions_data[id];
  //Assign Fields
  let field_list:any=[];
  this.questions.forEach(function (value) {
    let keys = value;
    let data = value['question_label'];
    field_list.push(data);
    });
  this.field_label=field_list;
  for(let i=0;i<this.field_label.length;i++)
  {
    if(this.questions[i]['field_validation']=='Number')
    {
      this.followUp.addControl(this.field_label[i], new FormControl('',  [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/)
      ]));
    }
    else
    {
      this.followUp.addControl(this.field_label[i], new FormControl('', Validators.required));
    }
  }
  this.select_id=id;
  }
}
public handleError(error:any)
{
  console.log(error);
}

config = {
  displayKey:"description",
  search:true,
  result:'single'
 }

//Get Claim details from Followup-Component
public submit()
{
  console.log(this.questions);
  let value=this.follow.getvalue();
  this.Jarwis.create_followup(this.setus.getId(),this.questions,this.followUp.value,value,this.select_id).subscribe(
    message  => this.formReset(message),
    error => this.handleError(error)
  );

}
public clear_fields()
{
  this.followUp.reset();
  //this.followUp.setValue(null);
}

public formReset(message:any){
  console.log(message.message);
  if(message.message == 'success'){

    console.log(this.followUp.value);

    this.followUp.controls['rep_name'].reset();
    this.followUp.controls['entry_date'].reset();
    this.followUp.controls['phone'].reset();
    this.followUp.controls['insurance'].reset();
    this.followUp.controls['What_s_the_filing_limit_'].reset();
    this.followUp.controls['What_s_the_effective_date_of_policy_'].reset();
    this.followUp.controls['rep_name'].reset();

  }
  //this.followUp.reset();
  //this.followUp.value['rep_name'] = '';
  console.log(this.followUp.value.rep_name);
  let claim:any=this.follow.getvalue();
  this.Jarwis.get_followup(claim).subscribe(
    data  => this.assign_data(data,claim),
    error => this.handleError(error)
    );
}

claimid:any;
followup_data:any;
followup_question_data:any;
active_claim:any;
active_data:any;

public assign_data(data:any,claim:any)
{
  console.log(data.data.data);
  console.log(claim);
  this.claimid.push(claim);
  this.followup_data.push( data.data.data);
  this.followup_question_data.push(data.data.content);
  this.active_claim=data.data.data;
  this.active_data=data.data.content;
  console.log('2' +this.active_data);
}




  ngOnInit() {
    console.log(this.data);
   //console.log(this.template_data);
   this.get_insurance();
    this.get_values();
    this.followUp = new FormGroup({
      rep_name: new FormControl('', [
        Validators.required,
        Validators.maxLength(10)
      ]),
      entry_date: new FormControl('', [
        Validators.required
      ]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/),
      ]),
      insurance: new FormControl('', [
        Validators.required
      ]) ,
      label_name: new FormControl("1",[ Validators.required])
    });
  }




}
