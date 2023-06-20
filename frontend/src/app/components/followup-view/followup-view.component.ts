import { Component, ViewChild, ElementRef, OnInit ,  HostBinding, Input, Renderer2 } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { FollowupService } from '../../Services/followup.service';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ToastrManager } from 'ng6-toastr-notifications';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { NgbDatepickerConfig, NgbCalendar, NgbDate, NgbDateStruct,NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-followup-view',
  templateUrl: './followup-view.component.html',
  styleUrls: ['./followup-view.component.css']
})
export class FollowupViewComponent implements OnInit {

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
    private setus: SetUserService,
    private follow:FollowupService,
    public toastr: ToastrManager,
    private calendar: NgbCalendar,
    private element: ElementRef,
    private renderer: Renderer2,
    private _parserFormatter: NgbDateParserFormatter,
    private router: Router
  ) {
    this.question = this.data;
    console.log(this.question);
    //this.followupView.templateEditResponse(data);
    this.alwaysShowCalendars = true;
  }


  singleSelected:any;

  public claimid:any =[];
  public followup_data:any =[];
  public followup_question_data:any = [];
  public active_claim:any[]=[];
  public active_data:any[] = [];

  public handleError(error:any)
  {
    console.log(error);
  }

  public cur_router:any;

  public get_followup_details()
  {

    console.log(this.router.url);

    this.cur_router = this.router.url;

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
    console.log(data);
    this.claimid.push(claim);
    this.followup_data.push( data.data.data);
    this.followup_question_data.push(data.data.content);
    this.active_claim=data.data.data;
    this.active_data=data.data.content;
    console.log('2' +this.active_data);
  }

//Reset data on adding data
  public reset_data(claim:any)
  {
    let index=this.claimid.indexOf(claim);
    this.claimid.splice(index, 1);
    this.followup_data.splice(index, 1);
    this.followup_question_data.splice(index, 1);
    this.get_followup_details();
    }


    public get_insurance(){
  this.Jarwis.get_insurance(this.setus.getId()).subscribe(
      data  => this.handleInsurance(data),
      error => this.handleError(error)
    );
}

//console.log(this.router.url);

options:any;
handleInsurance(data:any){
  this.options = data.claim_data;
  console.log(this.options);
}

formdata = new FormData();
  followUp!: FormGroup;

  ngOnInit() {
    this.get_insurance();
    this.followUp = new FormGroup({
      rep_name: new FormControl('', [
        Validators.required,
        Validators.maxLength(10)
      ]),
      entry_date: new FormControl('', [
        Validators.required]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/),
      ]),
      insurance: new FormControl('', [
        Validators.required
      ]) ,
      label_name: new FormControl("1",[ Validators.required])
    });

    this.follow.change.subscribe(click => {
      this.get_followup_details();
    });
    this.follow.reset.subscribe(click => {
      this.reset_data(click);
    });
  }

  edittemplate(id:any){
    console.log(id);
    this.Jarwis.template_edit(id, this.setus.getId()).subscribe(
      data  => this.templateEditResponse(data) ,
      error => this.handleError(error)
    );

    this.get_values();
  }

  public get_values()
  {
  this.Jarwis.get_category('id').subscribe(
    data  => this.assign_value(data),
    error => this.handleError(error)
    );
  }

  values:any = [];
  questions:any = [];
  questions_data:any = [];
  field_label:any = [];
  category_label:any= [];
  select_id:number = 0;

  processnotes!:FormControl;
  public assign_value(data:any)
  {
    console.log(data);
    if(data.data.length!=0)
    {
      this.values=data.data;
      console.log(this.values);
      this.questions=[];
      this.questions=data.quest[this.category];
      this.questions_data=data.quest;
      this.select_id=1;
      let field_list:any=[];
      this.questions.forEach(function (value:any) {
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
    }
    console.log(this.questions);

  }

  public change_category(id:any){
    console.log(id);
    this.get_values();
    this.category = id;

    if(this.main_category != id)
    {
      console.log('Remove Form Names');
      for(let i=0;i<this.field_label.length;i++)
      {
        this.followUp.removeControl(this.field_label[i]);
      }
      //Assign Questions
      this.questions=[];
      this.questions=this.questions_data[id];
      //Assign Fields
      let field_list:any=[];
      this.questions.forEach(function (value:any) {
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
      this.category=id;
      console.log(this.questions);
    }
  }


  public template_data:any;
  rep_name: any;
  insurance_id:any;
  edit_id:any;
  temp_claim_id:any;
  category:any;
  result:any;
  answer_one:any;
  answer_two:any;
  main_category:any;
  answer_three:any;
  answer_four:any;
  material_sub_total:any;
  red:any;
  dated:any;
  myArray:any;
  entry_date:any;
  month:any;day:any;year:any;ansSlicedOne:any;ansSlicedTwo:any;
  templateEditResponse(data:any){
    console.log(data + ' ---->-->');
    console.log(data.data.content);
    this.result = JSON.parse(data.data.content);
    console.log(this.result);
    // if((this.result[0]['answer'])){
    //   this.answer_one = this.result[0]['answer'];
    //   console.log(this.answer_one);
    // }
    // if((this.result[1] != undefined)){
    //   this.answer_two = this.result[1]['answer'];
    //   console.log(this.answer_two);
    // }
    // if((this.result[2] != undefined)){
    //   this.answer_three = this.result[2]['answer'];
    // }
    // if((this.result[3] != undefined)){
    //   this.answer_four = this.result[3]['answer'];
    // }
    //selected: any = { "startDate": "2021-02-16", "endDate": "2021-03-27" };
    this.insurance_id = data.data.insurance_id;
    this.edit_id = data.data.id;
    this.temp_claim_id = data.data.claim_id;
    this.category = data.data.category_id;
    this.main_category = data.data.category_id;
    console.log(this.category);

    var num = [7, 8, 9];

    /*this.result.forEach(function (value) {
        console.log('prasath'+ value);
    });

    for(let i=0; i<this.field_label.length; i++)
    {
        console.log(this.field_label[i]);
        //this.followUp.removeControl(this.field_label[i]);
        this.followUp.controls['rep_name'].value('prasath karnan');
        */

        console.log(this.result[0].answer);

        const str = this.result[0].answer;
        this.ansSlicedOne = str.slice(0, -11);
        this.ansSlicedTwo = str.substring(11, 21);
        console.log(this.ansSlicedOne);
        console.log(this.ansSlicedTwo);

        this.selected = { "startDate": this.ansSlicedOne, "endDate": this.ansSlicedTwo };

        console.log(this.entry_date);


        console.log(this.selected + '=+=+=+=+=+=+');

        this.result.forEach((item:any) => {
        console.log(item);



         let question_label = item.question_label;

         console.log(question_label);

         let answer = item.answer;

         console.log(answer);

         console.log(data.data.date);

         this.dated  =  data.data.date;


         //console.log(this.singleSelected +'------>');

         this.entry_date = this.dated.split('-');

         this.month = Number(this.entry_date[1]);
         this.day = Number(this.entry_date[2]);
         this.year = Number(this.entry_date[0]);


         const [year, month, day] = this.dated.split('-');
         const obj = { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
         console.log('convert date', obj);
         this.entry_date = obj;
         console.log(this.entry_date);


         [{"question":"What's the effective date of policy?","hint":"EOD Policy","question_label":"What_s_the_effective_date_of_policy_","type":"date_range","answer":"2020-12-12 TO 2021-01-07"},{"question":"What's the filing limit?","hint":"Filing Limit","question_label":"What_s_the_filing_limit_","answer":"12"}]


         //console.log(this.entry_date[1]);

         this.myArray =  {
                "month": this.month,
                "day": this.month,
                "year": this.year
               };

         this.followUp.addControl(question_label, new FormControl('',  [
            Validators.required,
          ]));

          //this.followUp.controls['question_label'].setValue(answer);

          let teste = answer.substr(1,2);

         console.log(answer + ' =====>');

          console.log(this.entry_date);

          this.followUp.patchValue({
            rep_name: data.data.rep_name,
            entry_date: this.entry_date,
            phone: data.data.phone,
            insurance:data.data.insurance,
            [question_label]: answer,
          });

          // this.followUp.controls['rep_name'].value('prasath karnan');
          // console.log(item.question_label +' '+ answer);
      });

   // }


    // this.followUp.patchValue({

    //   // [item]: value,
    // });
    this.getInsuranceSelectValue();

  }

  getInsuranceSelectValue(){
    this.Jarwis.insurance_name_list().subscribe(
      data  => this.insuranceNameResponse(data) ,
      error => this.handleError(error)
    );
  }

   insurance_name:any;

  insuranceNameResponse(data:any){
    this.insurance_name = data.data;
    console.log(this.insurance_name);
  }

  update(){
    console.log(this.questions);
    let value=this.follow.getvalue();

    this.Jarwis.update_followup_template(this.setus.getId(),this.edit_id,this.questions,this.followUp.value,value,this.select_id).subscribe(
    data  => this.followupUpdate(data),
    error => this.handleError(error)
  );
  }

  followupUpdate(data:any){
    this.toastr.successToastr('Folloup Template Update was Successfully.','Successfully');
    this.templateReload();
  }

  public templateReload(){

  console.log(this.followUp.value.rep_name);
  let claim:any=this.follow.getvalue();
  this.Jarwis.get_followup(claim).subscribe(
    data  => this.assign_data(data,claim),
    error => this.handleError(error)
    );
}

  deletetemplate(id:any){
    this.Jarwis.deletetemplate(id).subscribe(
      data  => this.deletetemplateResponse(data) ,
      error => this.handleError(error)
    );
  }

  deletetemplateResponse(data:any){
    let claim:any = this.follow.getvalue();

    this.Jarwis.get_followup(claim).subscribe(
          data  => this.assign_data(data,claim),
          error => this.handleError(error)
          );
    this.toastr.successToastr('Folloup Template Delete was Successfully.','Successfully');
  }
}
