import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators,FormArray,FormBuilder } from "@angular/forms";
import { JarwisService } from '../../Services/jarwis.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Subscription } from 'rxjs';
import { SetUserService } from '../../Services/set-user.service';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
@Component({
  selector: 'app-userregistration',
  templateUrl: './userregistration.component.html',
  styleUrls: ['./userregistration.component.css']
})
export class UserregistrationComponent implements OnInit {

 formGroup!: FormGroup;
 process_fields !: FormGroup;
 submitted = false;

 practice!:Array<{ id: number, name: string }>;
 practice_assig:Array<{ field: number, practice: string }>=[];
 practice_list:Array<any>=[];
 bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true  });


  public form = {
    username: null,
    password:null,
    firstname:null,
    lastname:null,
    dob:null,
    phone:null,
    address1:null,
    address2:null,
    city:null,
    state:null,
    zip:null
  };
  // observalble: Subscription;
  constructor(private Jarwis: JarwisService,
    public toastr: ToastrManager,
    private setus: SetUserService,
    private fb: FormBuilder,) {


}

 roles: any = [] ;
 minDate = {year: 1900, month: 1, day: 1};
public handlemessage(data:any)
{
  if(data.message !='Clear')
  {
    this.formGroup.get('username')?.setValue('');
    this.formGroup.get('username')?.markAsUntouched();
    this.toastr.warningToastr('Select Different Username', 'Unavaiable!')
  }

}

fetchrole()
{
    this.Jarwis.getrole().subscribe(
      data => this.handleResponse(data),

    );

}

  handleResponse(data:any){
  this.roles=data.access_token;
  }


onSubmit()
{


  this.submitted = true;
    if (this.formGroup.invalid) {
      console.log("check fields for valid entry");
        return;
    }
    try{

      let process_values:any=this.formGroup.value.process_details;
      console.log(process_values);

      let dateString  = this.formGroup.value.dob;
      let dob  = new Date(dateString );
      const formattedDate = {
        year: dob.getFullYear(),
        month: dob.getMonth() + 1, // Month value starts from 0, so we add 1
        day: dob.getDate()
      };
      this.formGroup.value.dob = formattedDate;
      console.log('formGroup',this.formGroup.value);
      let prac_settings:any=[];
      this.field_details.forEach((element:any) => {
          let prac_value=  process_values['practice_'+element.line_id];
          let role_value= process_values['role_'+element.line_id];
          let assign_lim= process_values['assign_limit_'+element.line_id];
          let caller_bm= process_values['caller_bm_'+element.line_id];
          prac_settings.push({practice_id:prac_value,role_id:role_value,assign_limit:assign_lim,caller_bench:caller_bm});
      console.log('practice_'+element.line_id);
      });
      this.formGroup.value.process_details=prac_settings;

      this.Jarwis.register(this.formGroup.value,this.setus.getId()).subscribe(
        message=> this.notifyregister(message),
        error => this.validation(error)

      );
    }catch (error) {
     this.toastr.errorToastr('Error in creating new Practice.')
    }


}
public validation(error:any){
  this.toastr.errorToastr('Fill the all required fields')
}
onBlur()
{
if(this.formGroup.value.username != '')
{
	 this.Jarwis.validateusername(this.formGroup.value).subscribe(

      message=> this.handlemessage(message),
      error => this.notify(error)
    );
  }
}
notify(error:any)
{
  this.toastr.errorToastr(error, 'Error in User Creation')
}
notifyregister(error:any)
{
  //console.log(error);
  // this.notify = error.error.error;
  this.toastr.successToastr('User-Created');
  this.formGroup.markAsPristine();
  this.formGroup.markAsUntouched();
  this.formGroup.reset({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    dob : '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });
  this.process_fields.reset({
    role_0: '',
    practice_0: '',
    assign_limit_0: '',
    caller_bm_0: '',
  });
  this.getPractices();
}


practice_nos=1;
 field_details:any=[];

add_practice()
{
  let index=Math.floor(Math.random() * 99) + 1;
this.practice_nos++;
  if(this.practice.length >= this.practice_nos)
  {

    this.process_fields.addControl('role_'+index, new FormControl(null, [Validators.required]));
    this.process_fields.addControl('practice_' +index , new FormControl(null, [Validators.required]));
    this.process_fields.addControl('assign_limit_' +index , new FormControl(null, [Validators.required]));
    this.process_fields.addControl('caller_bm_' +index , new FormControl(null, [Validators.required]));

    let fields:any=[];
    fields['line_id']=index;
    fields['practice']='practice_' +index;
    fields['role']='role_'+index;
    fields['assign_lim']='assign_limit_' +index;
    fields['caller_bm']='caller_bm_' +index;

    this.field_details.push(fields);
  }


}


delete_row(data:any)
{
  this.practice_nos--;
//console.log(data);

let index = this.field_details.findIndex((x:any) => x.line_id == data.line_id)
this.field_details.splice(index,1);

this.process_fields.removeControl(data.practice);
this.process_fields.removeControl(data.role);
this.process_fields.removeControl(data.assign_lim);
this.process_fields.removeControl(data.caller_bm);

}

set_prac_data(data:any)
{
  // let prac_data=[{id:0,name:'Practice1'},{id:1,name:'Practice2'},{id:2,name:'Practice3'}];
//console.log(data);
  this.practice=data.data;
  this.practice_list=data.data;

  //reset_practice
  this.practice_nos=1;
  this.field_details=[];


  let fields:any=[];
  fields['line_id']=0;
  fields['practice']="practice_0";
  fields['role']="role_0";
  fields['assign_lim']="assign_limit_0";
  fields['caller_bm']="caller_bm_0";

  this.field_details.push(fields);


}

selected_practices=[];
check_dup_prac()
{
  // console.log(this.process_fields.value);
  // let values=this.process_fields.value;
  let used_practices:any=[];
  this.field_details.forEach((element:any) => {
    // console.log(element.line_id);

    // console.log(this.process_fields.value['practice_'+element.line_id])

    let practice_id=this.process_fields.value['practice_'+element.line_id];

    let prac_index = used_practices.findIndex((x:any) => x == practice_id);
    //console.log(prac_index,used_practices);
  if(prac_index < 0)
  {
    used_practices.push(practice_id);
  }
  else{

    this.process_fields.get('practice_'+element.line_id)?.reset();
    this.process_fields.get('role_'+element.line_id)?.reset();
    this.process_fields.get('assign_limit_'+element.line_id)?.reset();
    this.process_fields.get('caller_bm_'+element.line_id)?.reset();
  }


  });




}

getPractices()
{
  this.Jarwis.getPracticesList().subscribe(
    data =>this.set_prac_data(data),
    error=>this.toastr.errorToastr(error, 'Error')
  );

}

get f() { return this.formGroup.controls; }

get g() { return this.process_fields.controls; }

ngOnInit() {

  this.process_fields = this.fb.group({
    role_0: new FormControl('', [
      Validators.required
    ]),
    practice_0: new FormControl('', [
      Validators.required
    ]),
    assign_limit_0: new FormControl('',[Validators.pattern(/^[0-9-]*$/)]),
    caller_bm_0: new FormControl('',[Validators.pattern(/^\d+(\.\d{1,2})?$/)])
  });

    this.formGroup = new FormGroup({
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20),

      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(15),
      ]),
      firstname: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
      ]),
      lastname: new FormControl('', [
        Validators.required,
        Validators.minLength(1)
      ]),
      dob : new FormControl('', [
        Validators.required
      ]),
      phone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/),
        Validators.minLength(10)
      ]),
      address1: new FormControl('', [
        Validators.required
      ]),
      address2: new FormControl('', [
        Validators.required
      ]),
      city: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(25),
      ]),
      state: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
      ]),
      zip: new FormControl('', [
        Validators.required,
         Validators.pattern(/^[0-9-]*$/)
      ]),
      process_details:this.process_fields,
      });

      //console.log(this.formGroup);


   this.fetchrole();
   this.getPractices();




  //  this.observalble=this.user_update.get_user_det().subscribe(message => {this.set_user_data(message)} );
  }

  // ngOnDestroy(){
  //   this.observalble.unsubscribe();
  // }




// select_practice(event,field)
// {
//   console.log(event,field);
//   if(this.practice_assig.length !=0)
//   {
//     let data = this.practice_assig.findIndex(x => x.field == field);


//   }
//   else{
//     this.practice_assig.push({practice:event,field:field});
//   }


//   let index = this.practice_list.findIndex(x => x.id == event);
//   console.log(index);

//   let op_data=[];
//   this.practice.forEach(element => {
//     if(element.id != event)
//     {
//       op_data.push(element);
//     }

//   });


//   console.log(op_data);
//   this.practice_list=op_data;

//   console.log(this.practice_list,this.practice);
// }



// edit_data=null;
// set_user_data(data)
// {
//   console.log("In Here",data);
// this.edit_data=data;
// console.log(this.edit_data.user_name);
// this.formGroup.patchValue({
//   username: this.edit_data.user_name,
//   firstname: this.edit_data['firstname'],
//   lastname: this.edit_data['lastname'],
//   dob: this.edit_data['firstname'],
//   phone: this.edit_data['firstname'],
//   address1: this.edit_data['role_id'],
//   address2: this.edit_data['role_id'],
//   city: this.edit_data['role_id'],
//   state: this.edit_data['role_id'],
//   zip: this.edit_data['role_id'],
//   role: this.edit_data['role_id']

//   });

// this.formGroup.get('username').patchValue(this.edit_data['user_name']);
// this.formGroup.get('firstname').patchValue(this.edit_data['firstname']);
// this.formGroup.get('lastname').patchValue(this.edit_data['lastname']);
// this.formGroup.get('dob').patchValue(this.edit_data['firstname']);
// this.formGroup.get('phone').patchValue(this.edit_data['firstname']);
// this.formGroup.get('address1').patchValue(this.edit_data['firstname']);
// this.formGroup.get('address2').patchValue(this.edit_data['firstname']);
// this.formGroup.get('city').patchValue(this.edit_data['firstname']);
// this.formGroup.get('state').patchValue(this.edit_data['firstname']);
// this.formGroup.get('zip').patchValue(this.edit_data['firstname']);
// this.formGroup.get('role').patchValue(this.edit_data['role_id']);
// }
}










