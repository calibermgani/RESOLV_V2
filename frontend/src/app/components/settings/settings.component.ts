import { Component, OnInit ,ChangeDetectionStrategy,ViewEncapsulation, AfterViewInit, OnDestroy} from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {FormControl, FormGroup, Validators,FormArray,FormBuilder } from "@angular/forms";
import { SetUserService } from '../../Services/set-user.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Subscription } from 'rxjs';
import { UserUpdateService } from '../../Services/user-update.service';
// import { element } from '@angular/core/src/render3/instructions';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AuthService } from '../../Services/auth.service';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit,AfterViewInit,OnDestroy {
  formGroup!: FormGroup;
  questionGroup!: FormGroup;
  statusCode!: FormGroup;
  subStatusCode!: FormGroup;
  search_data: FormControl = new FormControl();
  term: string = '';
  // userEdit: FormGroup;
  practiceGroup!: FormGroup;
  settingSearch!: FormGroup;
  statusPriority!: FormGroup;
  audit_sampling: FormGroup;
  samplingArray!: FormArray;
  fields: string[] = [];
  values: string[] = [];
  closeResult : string = '';
  category:any[] = [];
  questions:any[] = [];
  category_edit:any ;
  selected_category=0;
  question_format:string = '';
  question_edit:any;
  statusCodes!: FormGroup;
  public status_list: any;
  public sub_status_list: any;
  public prac_user_list: any;
  selectedUser:any;
  p_Users: any;
  minDate = {year: 1900, month: 1, day: 1};
  observalble: Subscription;

  constructor(private Jarwis: JarwisService,private formBuilder:FormBuilder, private modalService: NgbModal,private setus: SetUserService,public toastr: ToastrManager,private user_update:UserUpdateService,private auth : AuthService) {
    this.observalble=this.setus.update_edit_perm().subscribe(message => {this.check_edit_permission(message)} );
    this.audit_sampling = this.formBuilder.group({
      sampling: this.formBuilder.array([]),
    });
  }

  public form :any = {};
  field_name:any=[];
  public displayfields(data:any)
  {
    //console.log(data);
    this.fields=data.message;
    console.log(this.fields);
    this.values=data.data;
    this.field_name=data.name;
    console.log(this.field_name);
    //console.log("Name",data.name);
    let array = this.values;
    for (let index in array) {
    this.form[index]="true";
    let val=array[index];
    this.form[index+'_option']= val[1];
    }

    // if(data.error == 'Upload Complete'){
    //   this.settingSearch.reset();
    // }
  }

  public getfields()
  {
    var event="123";
    this.Jarwis.getfields(event, 'null').subscribe(
    data => this.displayfields(data)
    );
    }

  public onSubmit(){
   this.Jarwis.setsetting(this.form).subscribe(
    data => this.notify(data)
   );
  }
   public notify(data:any)
   {
     //this.displayfields(data);
     if(data.error == 'Settings Set'){
         this.settingSearch.reset();
     }
    this.toastr.successToastr('Import settings updated');
    this.getfields();
  }

  public check(event:any)
  {
    this.form[event+'_option']= "notify";
  }

  modalRef?: BsModalRef;

  public open(content:any) {
    this.modalService.open(content, { centered: true ,windowClass:'custom-class' }).result.then((result) => {
      console.log('result',result);

      this.closeResult = `${result}`;
    }, (reason) => {
    });
}
//Create Category
category_count: number = 0;
public category_list(data:any)
{
  console.log(data.count, '-->');
  this.category=data.data;
  this.category_count = data.count;

  this.questions=data.quest;

}

public edit_category(data:any)
{
  // this.category_edit=this.category[data-1];

  this.category_edit=  this.category.find((x:any) => x['id'] == data);


  this.formGroup.patchValue({
    category_name: this.category_edit['name'],
    label_name: this.category_edit['label_name'],
    status: this.category_edit['status']
  });
}

public create_category()
{
  this.Jarwis.create_category(this.formGroup.value, this.setus.getId()).subscribe(
    data => this.update_category(data)
    );
    this.toastr.successToastr("Category created successfully")
}

public update_category(data:any)
{
  this.category.push(data.data);
  //console.log(this.category);
  this.get_category_data();
}

public edit_update_category()
{
  this.Jarwis.update_category(this.formGroup.value, this.setus.getId(),this.category_edit).subscribe(
    data => this.category_list(data)
    );
    this.toastr.successToastr("Category updated successfully")
}

//Get Category
public get_category_data()
{
  this.Jarwis.get_category(this.setus.getId()).subscribe(
    data => this.category_list(data)
    );
}

public clicked_category(data:any)
{
  this.selected_category=data;
}


public change_format(event:any)
{
  this.question_format=event.target.value;
  if (event === 'Date') {
    this.questionGroup.addControl('date_type', new FormControl('', Validators.required));
    this.questionGroup.removeControl('field_validation')
    }
    else {
      this.questionGroup.removeControl('date_type');
      this.questionGroup.addControl('field_validation', new FormControl('', Validators.required));
      }
}

public create_questions()
{
  this.Jarwis.create_questions(this.questionGroup.value,this.selected_category,this.setus.getId()).subscribe(
    data => this.update_questions(data)
    );
    this.questionGroup.reset();
}

public edit_question(edit_data:any)
{
 this.question_edit=edit_data;
 if(this.question_edit['field_type']=="Date")
 {
   this.change_format('Date');
   this.questionGroup.patchValue({
   question: this.question_edit['question'],
   hint: this.question_edit['hint'],
   field_type: this.question_edit['field_type'],
   date_type: this.question_edit['date_type'],
   status: this.question_edit['status']
  });
}
else{
  this.questionGroup.patchValue({
  question: this.question_edit['question'],
  hint: this.question_edit['hint'],
  field_type: this.question_edit['field_type'],
  field_validation: this.question_edit['field_validation'],
  status: this.question_edit['status']
  });
}
//console.log(this.question_edit['status']);
}

public update_questions(data:any)
{
  this.questions=data.data;
  //this.get_category_data();
}

public update_issue(){
  this.edit_update_question();
}

public edit_update_question()
{
  this.Jarwis.update_questions(this.questionGroup.value,this.setus.getId(),this.question_edit['id']).subscribe(
    data => this.update_questions(data)
    );
}

public create_statuscode(type:any)
{

  if(type == 'status')
  {
this.Jarwis.create_status_code(this.statusCode.value, this.setus.getId()).subscribe(
  data => this.update_status_list(data,'status_code')
  );
  this.toastr.successToastr("Status Code created successfully")
  }
  else if(type == 'substatus')
  {
    this.Jarwis.create_sub_status(this.subStatusCode.value, this.setus.getId(),this.status_selected).subscribe(
      data => this.update_status_list(data,'substatus')
      );
      this.toastr.successToastr("Sub Status Code created successfully")
  }


}



public status_code_edit:any;
public sub_status_code_edit:any;
public status_id: number = 0;
public status_name:any;

status_edit(id:any){
  this.status_id = id;

  console.log(this.status_id);
}
public edit_statuscode(data:any,type:any)
{
if(type == 'statuscode')
{
  this.status_code_edit=  this.status_list.find((x:any) => x['id'] == data);
  //this.status_id = this.status_code_edit['id'];
  this.status_name = this.status_code_edit['description'];

  console.log(this.status_code_edit['address_flag_id']);

   this.statusCode.patchValue({
    state_name: this.status_code_edit['description'],
    status_code: this.status_code_edit['status_code'],
    state_status: this.status_code_edit['status'],
    foll_chk: this.status_code_edit['modules']['followup'],
    aud_chk: this.status_code_edit['modules']['audit'],
    ca_chk: this.status_code_edit['modules']['ca'],
    rcm_chk:this.status_code_edit['modules']['rcm']
   });
}
else if(type == 'sub_statuscode')
{
  this.sub_status_code_edit=data;

   this.subStatusCode.patchValue({
    state_name: this.sub_status_code_edit['description'],
    status_code: this.sub_status_code_edit['status_code'],
    state_status: this.sub_status_code_edit['status'],
    foll_chk: this.sub_status_code_edit['modules']['followup'],
    aud_chk: this.sub_status_code_edit['modules']['audit'],
    ca_chk: this.sub_status_code_edit['modules']['ca'],
    rcm_chk:this.sub_status_code_edit['modules']['rcm']
   });

}

}

public update_status(type:any)
{
  if(type == 'status_code')
  {
    this.Jarwis.update_status_code(this.statusCode.value,this.status_code_edit['id'], this.setus.getId()).subscribe(
      data => this.update_status_list(data,'status_code')
      );
      this.toastr.successToastr("Status Code updated successfully")
  }
  else if(type=='sub_status_code')
  {
    this.Jarwis.update_sub_status_code(this.subStatusCode.value,this.sub_status_code_edit['id'], this.setus.getId()).subscribe(
      data => this.update_status_list(data,'substatus')
      );
      this.toastr.successToastr("Sub Status Code updated successfully")
  }


}

public stay_clear()
{
  this.status_code_edit=null;
  this.statusCode.reset();
  this.questionGroup.reset();
  this.question_edit=null
  this.formGroup.reset();
  this.category_edit=null;
  this.subStatusCode.reset();
  this.sub_status_code_edit=null;
  this.statusCodes.reset();
  this.audit_status_edit=null;

}

//Updating view values of Status and Sub status

public update_status_list(data:any,type:any)
{
  // console.log(data,type);
  if(type=='all')
  {
    this.status_list=data.status;
    this.sub_status_list=data.sub_status;
  }
  else if(type=='status_code')
  {
    this.status_list=data.status;
  }
  else if(type=='substatus')
  {
    this.sub_status_list=data.sub_status;
  }


}

public get_status_data()
{
  this.Jarwis.get_status_codes(this.setus.getId(),'all').subscribe(
    data => this.update_status_list(data,'all')
    );
}

status_selected:string ='';
allowed_modules :any;
public clicked_status(id:any)
{
this.status_selected=id;
let status:any= this.status_list.find((x:any) => x['id'] == id);
this.allowed_modules=status['modules'];
}

edit_permission:boolean=false;
check_edit_permission(data:any)
{
  //console.log("Edit_permission",data);
if(data.includes('settings'))
{
  this.edit_permission=true;
}
else{
  this.edit_permission=false;
}
}

// user_details_list=[];
// user_profile_det=[];
// user_address_det=[];
// user_work_profiles=[];
// get_users_list()
// {
//   this.Jarwis.get_users_list(this.setus.getId()).subscribe(
//     data => this.set_user_list(data)
//     );





// }

// set_user_list(data)
// {
//   this.user_details_list = data.data;
//   this.user_profile_det = data.profile;
//   this.user_address_det = data.address;
//   this.user_work_profiles = data.work_profile;
//   // console.log(this.user_details_list);
// }

// selected_user=<any>[];
// edit_user_details(user)
// {
//   // console.log(user);
// this.selected_user['det']=user;

// this.selected_user['prof'] =  this.user_profile_det.find(x => x['user_id'] == user.id);
// this.selected_user['addr'] =  this.user_address_det.find(x => x['id'] == this.selected_user['prof']['address_flag_id']);
// this.selected_user['w_p'] = this.user_work_profiles.find(x => x['user_id'] == user.id);

// // console.log(this.selected_user);
//   // this.user_update.selected_user(user);
//   this.fetchrole();
//   // console.log(this.selected_user['prof']['dob']);

//   // this.selected_user['prof']['dob']
//         console.log(this.selected_user['prof']['dob']);
//         this.userEdit.patchValue({
//           username:user.user_name,
//           firstname:user.firstname,
//           lastname:user.lastname,
//           // dob: {startDate: this.selected_user['prof']['dob'], endDate: this.selected_user['prof']['dob']},
//           dob:{year:this.selected_user['prof']['dob'][2],month:this.selected_user['prof']['dob'][1],day:this.selected_user['prof']['dob'][0]},
//           phone:this.selected_user['prof']['mobile_phone'],
//           address1:this.selected_user['addr']['address_line_1'],
//           address2:this.selected_user['addr']['address_line_2'],
//           city:this.selected_user['addr']['city'],
//           state:this.selected_user['addr']['state'],
//           zip:this.selected_user['addr']['zip4'],
//           role:user.role_id,
//           assign_limit:this.selected_user['w_p']['claim_assign_limit'],
//           caller_benchmark:this.selected_user['w_p']['caller_benchmark']

//         });

// }

// roles:string[];
// fetchrole()
// {
//     this.Jarwis.getrole().subscribe(
//       data => this.handleResponse(data),
//     );
// }
//   handleResponse(data){
//   this.roles=data.access_token;
//   }


//   onBlur()
// {
//   // console.log(this.userEdit.value);
// if(this.userEdit.value.username != '' && this.userEdit.value.username != this.selected_user['det']['user_name'] )
// {
// 	 this.Jarwis.validateusername(this.userEdit.value).subscribe(

//       message=> this.handlemessage(message),
//       error => console.log(error)
//     );
//   }
// // }
// public handlemessage(data)
// {
//   if(data.message !='Clear')
//   {
//     this.userEdit.get('username').setValue(this.selected_user['det']['user_name']);
//     this.toastr.warningToastr('Select Different Username', 'Unavaiable!')
//   }

// }

// update_user() {

//   console.log(this.userEdit.value.assign_limit,this.userEdit.value.caller_benchmark);
//   console.log(this.selected_user['w_p']['claim_assign_limit'],this.selected_user['w_p']['caller_benchmark']);

//   let update:boolean;
//   if(this.userEdit.value.assign_limit != this.selected_user['w_p']['claim_assign_limit'] || this.userEdit.value.caller_benchmark != this.selected_user['w_p']['caller_benchmark'])
//   {
//     update = true;
//   }
//   else{
//     update = false;
//   }




//   this.Jarwis.update_user_details(this.userEdit.value,this.selected_user['det']['id'], this.setus.getId(),update).subscribe(
//     data =>{ this.get_users_list();
//       this.toastr.successToastr('User details Updated successfully.', 'Updated')
//     },
//     error=>this.toastr.errorToastr(error, 'Error')
//   );
// }


//For Audit States
get_root_cause_states(){
  this.Jarwis.get_root_cause(this.setus.getId(),'all').subscribe(
    data =>{ this.assign_root_cause(data)}
  );
}

get_error_type(){
  this.Jarwis.get_error_type(this.setus.getId(),'all').subscribe(
    data =>{ this.assign_root_cause(data)}
  );

}

root_cause_data:any=[];
assign_root_cause(data:any)
{
this.root_cause_data=data.states;
}

stat_type:string = '';
set_stat_type(data:any)
{
this.stat_type=data;
}

create_states()
{
  if(this.stat_type == 'root_cause')
  {
    //console.log(this.statusCodes.value);

      this.Jarwis.create_root_cause(this.setus.getId(),this.statusCodes.value,'create').subscribe(
    data =>{ this.assign_root_cause(data)}
  );
  this.toastr.successToastr("Root Cause created successfully")
  }
  else {
    this.Jarwis.create_error_type(this.setus.getId(),this.statusCodes.value,'create').subscribe(
      data =>{ this.assign_root_cause(data)}
    );
    this.toastr.successToastr("Error Type created successfully")
  }
}

audit_status_edit:any;

edit_status_codes(data:any,type:any)
{
  //console.log(data,data.name);
this.audit_status_edit=data;
    this.statusCodes.patchValue({
      name: data.name,
      status: data.status
     });


}

update_states()
{
  let id={user:this.setus.getId(),upd_id:this.audit_status_edit['id']}
  if(this.stat_type == 'root_cause')
  {
    // console.log(this.statusCodes.value);
      this.Jarwis.create_root_cause(id,this.statusCodes.value,'update').subscribe(
    data =>{ this.assign_root_cause(data)}
  );
  this.toastr.successToastr("Root Cause updated successfully")
  }
  else{
    this.Jarwis.create_error_type(id,this.statusCodes.value,'update').subscribe(
      data =>{ this.assign_root_cause(data)}
      );
      this.toastr.successToastr("Error Type updated successfully")
  }
}

// selected_modules=[false,false,false,false];


// module_names = [
//   {
//     id: 1,
//     name: 'Follow Up'
//   },
//   {
//     id: 2,
//     name: 'Audit'
//   },
//   {
//     id: 3,
//     name: 'Client Assistance'
//   },
//   {
//     id: 4,
//     name: 'RCM'
//   }
// ];

update_prac_settings()
{
  //console.log(this.practiceGroup.value);
  this.Jarwis.update_prac_settings(this.practiceGroup.value,this.setus.getId()).subscribe(
    data =>  this.toastr.successToastr('Import settings updated') ,
    error =>  {this.toastr.warningToastr('Not Updated', 'Warning!')}
    );
}
get_practice_stats()
{
  this.Jarwis.get_practice_stats().subscribe(
    data =>this.set_prac_settings(data)
    );
}

set_prac_settings(data:any)
{
  let prac_data=data.data;
  this.practiceGroup.patchValue({
    touch_limit: prac_data.touch_limit
  });
}

 //Configuration of Dropdown Search
 config = {
  displayKey:"description",
  search:true,
  result:'single'
 }

 get_practice_user_list()
{
  this.Jarwis.get_practice_user_list(this.setus.getId()).subscribe(
    (data:any) => {
      this.prac_user_list = data['user_list'];
      console.log(this.prac_user_list);
      this.p_Users = this.prac_user_list;
      console.log(this.p_Users);
    });
}

/* set_prac_user_value(){
  console.log(this.prac_user_list);
  this.p_Users = this.prac_user_list;
  console.log(this.p_Users);
  this.p_Users.forEach(element => {
    console.log(element);
    console.log(element['id']);
    //this.sampling.controls.user_id.patchValue(element['id']);
    })

} */

  ngOnInit() {
    // this.auth.tokenValue.next(false);
    this.getfields();
    this.get_category_data();
    this.get_status_data();
    this.get_practice_user_list();
    this.formGroup = new FormGroup({
      category_name: new FormControl('', [
        Validators.required
      ]),
      label_name: new FormControl('', [
        Validators.required
      ]),
      status: new FormControl('', [
        Validators.required
      ])
    });
    this.questionGroup = new FormGroup({
      question: new FormControl('', [
        Validators.required
      ]),
      hint: new FormControl('', [
        Validators.required
      ]),
      field_type: new FormControl('', [
        Validators.required
      ]),
      field_validation: new FormControl('', [
        Validators.required
      ]),
      status: new FormControl('', [
        Validators.required
      ])
    });

    this.statusCode = new FormGroup({
      state_name: new FormControl('', [
        Validators.required
      ]),
      status_code: new FormControl('', [
        Validators.required
      ]),
      state_status: new FormControl('', [
        Validators.required
      ]),
      foll_chk: new FormControl(),
      aud_chk: new FormControl(),
      ca_chk: new FormControl(),
      rcm_chk: new FormControl()
    });

    this.subStatusCode = new FormGroup({
      state_name: new FormControl('', [
        Validators.required
      ]),
      status_code: new FormControl('', [
        Validators.required
      ]),
      state_status: new FormControl('', [
        Validators.required
      ]),
      foll_chk: new FormControl(),
      aud_chk: new FormControl(),
      ca_chk: new FormControl(),
      rcm_chk: new FormControl()
    });

    //         this.userEdit = new FormGroup({
    //           username: new FormControl('', [
    //             Validators.required,
    //             Validators.pattern(/^[a-zA-Z]+\w*$/)
    //           ]),
    //           // password: new FormControl('', [
    //           //   Validators.required
    //           // ]),
    //           firstname: new FormControl('', [
    //             Validators.required
    //           ]),
    //           lastname: new FormControl('', [
    //             Validators.required
    //           ]),
    //           dob : new FormControl('', [
    //             Validators.required
    //           ]),
    //           phone: new FormControl('', [
    //             Validators.required,
    //             Validators.pattern(/^[0-9-]*$/),
    //             Validators.minLength(10)

    //           ]),
    //           address1: new FormControl('', [
    //             Validators.required
    //           ]),
    //           address2: new FormControl('', [
    //             Validators.required
    //           ]),
    //           city: new FormControl('', [
    //             Validators.required
    //           ]),
    //           state: new FormControl('', [
    //             Validators.required
    //           ]),
    //           zip: new FormControl('', [
    //             Validators.required,
    //              Validators.pattern(/^[0-9-]*$/)
    //           ]),
    //           role: new FormControl('', [
    //             Validators.required
    //           ]),
    //       assign_limit: new FormControl('',[Validators.pattern(/^[0-9-]*$/)]),
    //       caller_benchmark: new FormControl('',[Validators.pattern(/^[0-9-]*$/)])
    //  });

    this.statusCodes = new FormGroup({
      name: new FormControl('', [
        Validators.required
      ]),
      status: new FormControl('', [
        Validators.required
      ])
    });

    this.practiceGroup = new FormGroup({
      touch_limit: new FormControl('1', [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/)
      ])
    });

    this.settingSearch = new FormGroup({
      search_data: new FormControl('', [
        Validators.required
      ]),
    });

    this.statusPriority = new FormGroup({
      priority: new FormArray([new FormControl ('')]),
    });
    this.samplingArray = this.audit_sampling.get('sampling') as FormArray;
  }

  ngAfterViewInit() {
    console.log('LAST IN SETTINGS COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }
  public onSearchChange(searchValue: any): void {
    var event="123";
      this.Jarwis.getfields(event,searchValue.target.value).subscribe(
      data => this.displayfields(data)
      );
  }

  get priority(): FormArray {
    return this.statusPriority.get("priority") as FormArray;
  }
  addStatusField() {
    this.priority.push(new FormControl(''));
  }
  removeStatusField(i:number) {
    this.priority.removeAt(i);
  }

  ngOnDestroy(){
    this.observalble.unsubscribe();
  }

  save(i:any){
    console.log(this.samplingArray.controls[i].value)
  }

  sampling_usrlist(){
    console.log(this.p_Users);
    this.samplingArray = this.audit_sampling.get('sampling') as FormArray;
    Object.keys(this.p_Users).forEach((i) => {
      this.samplingArray.push(
        this.formBuilder.group({
          user_id: new FormControl(this.p_Users[i].id),
          experience: new FormControl(''),
          month: new FormControl(''),
          audit_percentage: new FormControl(''),
        })
      );
    });
  }
}
