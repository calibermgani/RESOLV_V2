import { Component, OnInit, TemplateRef } from '@angular/core';
import {FormControl, FormGroup, Validators,FormArray } from "@angular/forms";
import{Customer} from '../../models/customer.model';
import { JarwisService } from '../../Services/jarwis.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import { SetUserService } from '../../Services/set-user.service';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { AuthService } from 'src/app/Services/auth.service';
@Component({
  selector: 'app-customer-creation',
  templateUrl: './customer-creation.component.html',
  styleUrls: ['./customer-creation.component.css']
})
export class CustomerCreationComponent implements OnInit {

  constructor( private Jarwis: JarwisService,
    public toastr: ToastrManager,
    private setus: SetUserService,
    private modalService: NgbModal,public modal :BsModalService, private auth : AuthService) { }
  formGroup!: FormGroup;

  customers!:Customer[];
  selectedCustomer!:Customer[];
  updateId:number = 0;
  closeResult:any;
  submitted = false;
  modalRef?: BsModalRef;
  public config: any = {
    displayKey: "description",
    search: true,
    limitTo: 1000,
    result: 'single'
  }

  public open(content:any) {
    this.openModal(content);
    // this.modalService.open(content, { centered: true ,windowClass:'custom-class' }).result.then((result) => {
    //   this.closeResult = `${result}`;
    // }, (reason) => {
    // });
}
openModal(model_name: TemplateRef<any>) {
  console.log('IN');
  this.modalRef = this.modal.show(model_name, this.config);
}
get f() { return this.formGroup.controls; }

  onSubmit()
  {
    this.formGroup.value;
  // this.customer_form=this.formGroup.value;
  this.submitted = true;
  // stop here if form is invalid
  if (this.formGroup.invalid) {
      return;
  }

  this.Jarwis.createVendor(this.formGroup.value,this.setus.getId()).subscribe(
    message=> this.notifyregister(message,'create'),
    error => this.validation(error)
    );
  }
public validation(error:any){
this.toastr.errorToastr("Fill The All Required (*) Fields")
}

  notify(error:any)
{
  this.toastr.errorToastr(error, 'Error in Vendor Creation')
}
notifyregister(data:any,type:any)
{
  if(type=='create')
  {
    this.toastr.successToastr('Vendor Created');
  }
  else if(type=='update'){
      this.list_vendors(data);
    this.toastr.successToastr('Vendor Updated');
  }

this.clear_data();
}

public handleError(error:any)
{
  console.log(error);
}

get_vendors()
{
  this.Jarwis.getVendor().subscribe(
    message=> this.list_vendors(message),
    error => this.handleError(error)
    );
}

list_vendors(data:any)
{
  this.customers = data.data
}
edit_vendor_details(vendor:any)
{
  this.updateId=vendor.id;
  this.formGroup.patchValue({
    customer_name:vendor.customer_name,
    short_name:vendor.short_name,
    customer_desc:vendor.customer_desc,
    contact_person:vendor.contact_person,
    email:vendor.email,
    addressline1:vendor.addressline1,
    addressline2:vendor.addressline2,
    city:vendor.city,
    state:vendor.state,
    zipcode5:vendor.zipcode5,
    zipcode4:vendor.zipcode4,
    phone:vendor.phone,
    phoneext:vendor.phoneext,
    mobile:vendor.mobile,
    status:vendor.status
  });
}

clear_data()
{
  this.formGroup.reset();
  // this.formGroup.get('status').setValue('Active');
  this.formGroup.setValue({
    status:'Active'
  })
}

updateVendor()
{
  this.Jarwis.updateVendor(this.formGroup.value,this.updateId,this.setus.getId()).subscribe(
    message=> this.notifyregister(message,'update'),
    error => this.notify(error)
    );
}


  ngOnInit() {
    this.formGroup = new FormGroup({
      customer_name : new FormControl('', [
        Validators.required,
         Validators.pattern(/^[a-zA-Z]+\w*$/)
      ]),
      short_name : new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z]+\w*$/)
      ]),
      customer_desc : new FormControl(''),
      contact_person : new FormControl(''),
      email : new FormControl('', [
        Validators.required,
        Validators.pattern( /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) //Email pattern
      ]),
      addressline1 : new FormControl(''),
      addressline2 : new FormControl(''),
      city : new FormControl(''),
      state : new FormControl(''),
      zipcode5 : new FormControl('',[
        Validators.required,
        Validators.pattern(/^\d{5}$|^\d{5}-\d{4}$/)
      ]),
      zipcode4 : new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{4}$|^\d{4}-\d{3}$/)
      ]),
      phone : new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{10}$|^\d{10}-\d{9}$/)
      ]),
      phoneext : new FormControl('', [
        Validators.required,
        Validators.pattern(/^[0-9-]*$/)
      ]),
      mobile : new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{10}$|^\d{10}-\d{9}$/)
      ]),
      status : new FormControl('Active'),
    });
  }
  ngAfterViewInit() {
    console.log('LAST IN VENDORS COMP');

    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }
}
