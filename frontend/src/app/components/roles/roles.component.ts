import { Component, OnInit, TemplateRef } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { SetUserService } from '../../Services/set-user.service';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {FormControl, FormGroup, Validators,FormArray } from "@angular/forms";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AuthService } from 'src/app/Services/auth.service';
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {

  constructor( private Jarwis: JarwisService,
    public toastr: ToastrManager,
    private setus: SetUserService,
    private modalService: NgbModal,
    public modals : BsModalService,private auth :AuthService) { }
  formGroup!: FormGroup;
  submitted = false;

  roles:any=[];
  editId:any=[];
  closeResult:any;

  public handleError(error:any)
  {
    console.log(error);
  }

  get_roles()
  {
    this.Jarwis.getrole().subscribe(
      message=> this.listRoles(message),
      error => this.handleError(error)
      );
  }

  get_user_role()
  {
    this.Jarwis.get_user_role('data').subscribe(
      message=> this.listRoles(message),
      error => this.handleError(error)
      );
  }

  listRoles(data:any)
  {
     //console.log(data.access_token);
    this.roles=data.access_token;
  }

  edit_roles(role:any)
  {
    this.editId=role;
    //console.log(this.editId['id']);
    this.formGroup.patchValue({
      roleName:role.role_name,
      status:role.status
    });
  }

 ngOnInit() {

    this.formGroup = new FormGroup({
      roleName : new FormControl('', [
        Validators.required
      ]),
      status : new FormControl('Active', [
        Validators.required
      ])
    });
  }

  ngAfterViewInit() {
    console.log('LAST IN ROLES COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

onUpdate()
{
  this.submitted = true;
  if (this.formGroup.invalid) {
      return;
  }try{
  this.Jarwis.updateRoles(this.formGroup.value, this.setus.getId(), this.editId['id']).subscribe(
    data => this.handleRespponseUpdateRole(data),
    error => this.validation(error)
  );
  }catch (error) {
   this.toastr.errorToastr('Error in update new Role.')
  }
}
public modal:any;
handleRespponseUpdateRole(data:any){
  this.get_roles();
  this.modalRef?.hide()
  this.toastr.successToastr(data.status);
}

onSubmit(){
  this.submitted = true;
  if (this.formGroup.invalid) {
      return;
  }try{
  this.Jarwis.createRoles(this.formGroup.value, this.setus.getId()).subscribe(
    data => this.handleRespponseCreateRole(data),
    error => this.validation(error)
  );
  }catch (error) {
   this.toastr.errorToastr('Error in creating new Role.')
  }
}

handleRespponseCreateRole(data:any){
    this.toastr.successToastr(data.status);
}

validation(error:any){

}

modalRef?: BsModalRef;
public config: any = {
  displayKey: "description",
  search: true,
  limitTo: 1000,
  result: 'single'
}


public open(content:any) {
  this.openModal(content);
  // this.modal = this.modalService.open(content, { centered: true ,windowClass:'custom-class' });
  //    this.modal.result.then((result:any) => {
  //       this.closeResult = `Closed with: ${result}`;
  //     }, (reason:any) => {
  //       this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
  //     });
}

openModal(model_name: TemplateRef<any>) {
  console.log('IN');
  this.modalRef = this.modals.show(model_name, this.config);
}


private getDismissReason(reason: any): string {
  if (reason === ModalDismissReasons.ESC) {
    return 'by pressing ESC';
  } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
    return 'by clicking on a backdrop';
  } else {
    return  `with: ${reason}`;
  }
}



}
