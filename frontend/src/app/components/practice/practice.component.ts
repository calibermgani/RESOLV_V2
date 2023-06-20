import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder } from "@angular/forms";
import { JarwisService } from '../../Services/jarwis.service';
import { SetUserService } from '../../Services/set-user.service';
import { ToastrManager } from 'ng6-toastr-notifications';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AuthService } from 'src/app/Services/auth.service';
// import { validateConfig } from '@angular/router/src/config';

@Component({
  selector: 'app-practice',
  templateUrl: './practice.component.html',
  styleUrls: ['./practice.component.css']
})
export class PracticeComponent implements OnInit {

  constructor( private Jarwis: JarwisService,
    private setus: SetUserService,
    public toastr: ToastrManager,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,public modal :BsModalService,private auth : AuthService) { }


  formGroup: FormGroup|any;
  submitted = false;
  isCollapsed_business_details = false;
  isCollapsed_payTo_addresss = false;
  isCollapsed_primary_location = false;
  isCollapsed_Credentials = false;
  isCollapsed_mailing_address = false;
  isCollapsed_general_details = false;
  isCollapsed_practice_info = false;

  public form = {
    business_name: null,
    address_1: null,
    address_2: null,
    // spec: null,
    // taxonomy: null,
    // billing_entry: null,
    // entity_type: null,
    city: null,
    state: null,
    zip_code: null,
    prim_address1: null,
    prim_address2: null,
    prim_city: null,
    prim_state: null,
    prim_zip_code: null,
    // tax_id: null,
    // npi: null,
    // medicare_ptan: null,
    // medicare_id: null,
    // medicare_id2: null,
    mail_address_1: null,
    mail_address_2: null,
    mail_city: null,
    mail_state: null,
    mail_zip: null,
    // practice_start: null,
    // primary_language: null,
    // providers: null,
    // facilities: null,
    // practice_name: null,
    // practice_desc: null,
    // avatar_name: null,
    // practice_link: null,
    emailid: null,
    // phone_no: null,
    // fax_no: null
  };


  get f() { return this.formGroup.controls; }
  ngOnInit() {

    this.formGroup = new FormGroup({
      business_name: new FormControl('', [
        Validators.required
      ]),
      speciality_id: new FormControl(''),
      taxanomy_id: new FormControl(''),
      billing_entity: new FormControl(''),
      entity_type: new FormControl(''),

      pay_address_1: new FormControl('', [
        Validators.required
      ]),
      pay_address_2: new FormControl('', [
        Validators.required
      ]),
      pay_city: new FormControl('', [
        Validators.required
      ]),
      pay_state: new FormControl('', [
        Validators.required
      ]),
      pay_zip_code: new FormControl('', [
        Validators.required
      ]),

      primary_address_1: new FormControl('', [
        Validators.required
      ]),
      primary_address_2: new FormControl('', [
        Validators.required
      ]),
      primary_city: new FormControl('', [
        Validators.required
      ]),
      primary_state: new FormControl('', [
        Validators.required
      ]),
      primary_zip_code: new FormControl('', [
        Validators.required
      ]),


      tax_id: new FormControl(''),
      npi: new FormControl(''),
      medicare_ptan: new FormControl(''),
      medicare_id: new FormControl(''),
      medicare_id2: new FormControl(''),


      mail_address_1: new FormControl('', [
        Validators.required
      ]),
      mail_address_2: new FormControl('', [
        Validators.required
      ]),
      mail_city: new FormControl('', [
        Validators.required
      ]),
      mail_state: new FormControl('', [
        Validators.required
      ]),
      mail_zip: new FormControl('', [
        Validators.required
      ]),


      practice_start: new FormControl(''),
      primary_language: new FormControl(''),
      providers: new FormControl(''),
      facilities: new FormControl(''),

      practice_name: new FormControl('', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9]*$/),
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.pattern( /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
      ]),


      practice_desc: new FormControl(''),
      avatar_name: new FormControl(''),
      practice_link: new FormControl(''),
      phone_no: new FormControl(''),
      fax_no: new FormControl(''),

      status : new FormControl('Active'),
    });
  }

  ngAfterViewInit() {
    console.log('LAST IN PRACTICE COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

  onSubmit() {
    console.log(this.formGroup.value);
    this.submitted = true;
    if (this.formGroup.invalid) {
      console.log('error');
        return;
    }
    try{
      this.Jarwis.createpractice(this.formGroup.value, this.setus.getId()).subscribe(
        data => this.RespponseHandleCreatePractice(data),
        error => this.validation(error)
      );
    }catch (error) {
     this.toastr.errorToastr('Error in creating new Practice.')
    }

  }

  RespponseHandleCreatePractice(data:any){
    this.toastr.successToastr("Practice created was successfully!")
  }

  public validation(error:any){
    this.toastr.errorToastr("Fill the all required fields")
  }

  modalRef?: BsModalRef;
  public config: any = {
    displayKey: "description",
    search: true,
    limitTo: 1000,
    result: 'single'
  }
  //Open and Close Modal
  open(content:any) {
    this.openModal(content);
  // this.modalService.open(content, { centered: true ,windowClass:'custom-class'}).result.then((result) => {
  // //   this.closeResult = `${result}`;
  // // }, (reason) => {
  // //   this.closeResult = `${this.getDismissReason()}`;
  // });
}
openModal(model_name: TemplateRef<any>) {
  console.log('IN');
  this.modalRef = this.modal.show(model_name, this.config);
}
}
