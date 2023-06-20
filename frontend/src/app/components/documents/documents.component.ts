  import { Component, OnInit,ViewEncapsulation  } from '@angular/core';
  import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
  import { FormControl, FormGroup, Validators } from "@angular/forms";
  import { JarwisService } from '../../Services/jarwis.service';
  import { ToastrManager } from 'ng6-toastr-notifications';
  import { SetUserService } from '../../Services/set-user.service';
  // import * as FileSaver from 'file-saver';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import {Observable} from "rxjs/index";
  // import { saveAs } from 'file-saver';
  import * as moment from 'moment';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { AuthService } from 'src/app/Services/auth.service';


  @Component({
    selector: 'app-documents',
    templateUrl: './documents.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./documents.component.css']
  })

  export class DocumentsComponent implements OnInit {

    selecteds: any;
    maxSize : any = 9;
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
    bsConfig?: Partial<BsDatepickerConfig> = Object.assign({}, { containerClass: 'theme-default', rangeInputFormat: 'MM/DD/YYYY', dateInputFormat: 'MM/DD/YYYY', showWeekNumbers: false, isAnimated: true, adaptivePosition: true  });

    isInvalidDate = (m: moment.Moment) =>  {
      return this.invalidDates.some(d => d.isSame(m, 'day') )
    }

    constructor(
      private modalService: NgbModal,
      public toastr: ToastrManager,
      private Jarwis: JarwisService,
      public setus: SetUserService,
      private http: HttpClient,
      private auth : AuthService
    ) { this.alwaysShowCalendars = true; }
    closeResult : string = '';
    // formdata = new FormData();
    formGroup: FormGroup | any;
    searchformGroup:FormGroup | any;
    edit_file_details=[];
    doc_details_edit:any ;
    upload_file: Array<File> =[];
    document_list:any=[];
    pages:number =0;
    delete_selected:any=[];
    list_type:string ='';
    list_type_nos:number=0;
    download_file_list:any[]=[];
    download_id:number=0;
    total_list:number=0;
    delete_id:number=0;
    myDate= new Date();
    sortByAsc: boolean = true;
    open(content:any) {
      this.modalService.open(content, {centered: true, windowClass: 'dark-modal' }).result.then((result) => {
        this.closeResult = `${result}`;
      }, (reason) => {
        this.download_id=0,
        this.delete_id=0;
        this.delete_selected=[];
        this.formGroup.reset();
        this.edit_file_details=[];
        this.formGroup.controls['file'].setValidators([Validators.required]);
        this.upload_file=[];
      });
  }

  check_availability(type: any)
  {
  if(this.formGroup.value.document_name != '')
  {
    this.Jarwis.doc_name_validity(this.formGroup.value.document_name,type,this.doc_details_edit['id']).subscribe(

        data => this.handle_validation(data,type),
      error => this.handleError(error)
      );
    }
  }

 public handleError(error: any)
{
  console.log(error);
}
  handle_validation(data: any,type: string)
  {
    if(data.data==false)
    {
      this.toastr.errorToastr('Please change Document Name.', 'Name Present');
      if(type=='edit')
      {
        this.formGroup.get('document_name').setValue(this.doc_details_edit['document_name']);

      }
      else{
        this.formGroup.get('document_name').setValue('');
      }
    }
  }

  file_validation(fileEvent: any)
  {
    this.upload_file=[];
    let allowed_type=['pdf','csv','xlsx','doc','docx','png','jpg'];
    let file_valid:boolean=true;
    let file_nos=fileEvent.target.files.length;
    for(let i=0;i<file_nos;i++)
        {
          let file_data=fileEvent.target.files[i];
          this.upload_file.push(file_data);
          let file_ext=file_data.name.split('.').pop();

          if(!allowed_type.includes(file_ext))
          {
            file_valid=false;
          }
        }
        if(file_valid==false)
        {
          this.toastr.errorToastr('Please Upload valid File.', 'Invalid File Type');
          this.formGroup.get('file').setValue('');
          file_valid=true;
          this.upload_file=[];
        }
  }

  after_upload(data: any,type: string | Blob)
  {
    if(type=='upload')
    {
      this.toastr.successToastr('Document Upload Successful', 'Upload Status');
    }
    else{
      this.toastr.successToastr('Document Details Updated', 'Update Status');
    }
    this.document_list=data.data.data;
    this.total_list=data.data.count;
    this.upload_file=[];
    this.formGroup.reset();
    //console.log(this.document_list);
  }



  clear()
  {
    this.formGroup.reset();
  }

  get_document_list_pagination(page: any){
    this.get_document_list(page,this.search,this.sortByAsc,this.sorting_name);
  }


  get_document_list(page: number,searchValue: string,sort_by: boolean | null,sort_name: null)
  {
    this.pages=page;
    let page_count=15;
    this.document_list=[];
    this.Jarwis.get_document_list(page,page_count,searchValue,sort_by,sort_name).subscribe(
      data => this.assign_data(data),
      error => this.handleError(error)
    );
  }

  current_total: any;
  skip: any;
  total_row: any;
  skip_row: any;
  current_row: number=0;

  assign_data(data: any)
  {
    this.document_list=data.data.data;
    this.total_list=data.data.count;

    this.current_total= data.data.count;
    this.skip = data.skip + 1;

    this.skip_row = this.skip;
    this.current_row = this.skip + this.current_total - 1;
    this.total_row = data.data.count;
  }

  display_files_list(id: string | number)
  {
    this.list_type="Downloadable File List";
    this.list_type_nos=1;
    this.download_id=this.document_list[id]['id'];
    this.download_file_list=JSON.parse(this.document_list[id]['file_name']);
  }

  delete_files_list(id: string | number)
  {
    this.list_type="Deletable File List";
    this.list_type_nos=2;
    this.delete_id=this.document_list[id]['id'];
    this.download_file_list=JSON.parse(this.document_list[id]['file_name']);
  }

  // this.Jarwis.fetch_create_claims_export_data(this.setus.getId(), table_name, this.search, this.searchClaims, this.workordersearch).subscribe(
  //   data  => this.export_handler.create_claim_export_excel(data),
  //   error => this.error_handler(error)
  //   );

  download_file(id: any,file: string)
  {
    if(this.download_id==0)
    {
      let value=JSON.parse(file);
      file=value[0];
    }
  this.Jarwis.download_doc_file(id,file).subscribe(
    data => this.handle_file_response(data,file),
  error => this.handleError(error)
  );
  }

  handle_file_response(data: any,name: any)
  {
    console.log(data.data);
    console.log(name);

    window.open(data.data, "_blank");


    //return this.http.get(data.data, { responseType: 'blob' });
  }

  delete_file(id: any,file: any)
  {

    if(this.delete_id==0)
    {
      let value=JSON.parse(file);
      file=value[0];
    }
    else{
      file=this.delete_selected;
    }
    this.Jarwis.delete_doc_file(id,file,this.pages,15).subscribe(
      data => {this.assign_data(data),this.delete_selected=[];  this.toastr.successToastr('Files Deletion Successful.', 'Files Deleted');},
    error => this.handleError(error)
    );
  }
  // {this.assign_data(data),this.update_file_list(data,id)}

  add_to_delete(event:any,name:any )
  {
    if(event.target.checked == true)
    {
    this.delete_selected.push(name);
    }
    else if(event.target.checked == false)
    {
      let ind = this.delete_selected.indexOf(name);
      this.delete_selected.splice(ind,1);
    }
  }

  edit_doc_details(id: any)
  {
    let x=this.document_list.find((v:any) => v.id == id);
    this.doc_details_edit=x;
    this.formGroup.get('document_name').setValue(x.document_name);
    this.formGroup.get('category').setValue(x.category);
    this.formGroup.controls['file'].setValidators([]);
    this.edit_file_details=JSON.parse(x['file_name']);
  }

  view_doc_details(id: any)
  {
    let x=this.document_list.find((v:any) => v.id == id);
    this.doc_details_edit=x;
    this.Jarwis.view_doc_file(id).subscribe(
      data=> this.handleResponse(data),
      error => this.handleError(error)
    )
  }

  public document_names: any;
  public categories: any;
  public file_names: any;

  handleResponse(data: Object){

    // data.forEach(function (value) {
    //   this.document_names = value.document_name;
    //   this.categories = value.category;
    //   this.file_names = value.file_name;
    // });

    this.document_names = data;
    // this.doumentDetail = new documents();
    // this.doumentDetail.document_name = this.document_names;
    // this.doumentDetail.category = this.categories;
    // this.doumentDetail.file_name = this.file_names;
  }

  // file_update()
  // {
  //   console.log(this.upload_file);
  //   if(this.upload_file.length!=0)
  //   {
  //     let formData = new FormData();
  // const files: Array<File> = this.upload_file;
  // for(let i=0;i<files.length;i++)
  // {
  //   let app_name='file'+i;
  //   formData.append(app_name, this.upload_file[i]);
  // }
  // let nos=files.length.toString()
  // formData.append('file_nos',nos);
  // formData.append('user',this.setus.getId());
  // formData.append('doc_name',this.formGroup.value.document_name);
  // formData.append('doc_category',this.formGroup.value.category);
  // formData.append('type','update');
  // formData.append('upd_id',this.doc_details_edit['id']);
  //   this.Jarwis.upload_document_file(formData).subscribe(
  //     data => this.after_upload(data,'update'),
  //   error => console.log(error)
  //   );
  //   }
  // }

  file_upload(type:any)
  {
  let formData = new FormData();
  const files: Array<File> = this.upload_file;
  for(let i=0;i<files.length;i++)
  {
    let app_name='file'+i;
    formData.append(app_name, this.upload_file[i]);
  }
  let nos=files.length.toString()
  formData.append('file_nos',nos);
  // formData.append('user',this.setus.getId());
  formData.append('doc_name',this.formGroup.value.document_name);
  formData.append('doc_category',this.formGroup.value.category);
  formData.append('type',type);
  formData.append('page_no',this.pages.toString());
  formData.append('page_count','15');
  formData.append('practice_dbid','3');
  if(type == 'update')
  {
    formData.append('upd_id',this.doc_details_edit['id']);
  }
    this.Jarwis.upload_document_file(formData).subscribe(
      data => this.after_upload(data,type),
    error => this.handleError(error)
    );
  }


  public sort_data(type: string){
    if(type=='name'){
      if(this.sortByAsc == true) {
    this.sortByAsc = false;
    this.document_list.sort((a:any,b:any) => a.document_name.localeCompare(b.document_name));
    } else {
    this.sortByAsc = true;
    this.document_list.sort((a:any,b:any) => b.document_name.localeCompare(a.document_name));
    }
    }
    if(type=='category'){
      if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.document_list.sort((a:any,b:any) => a.category.localeCompare(b.category));
        } else {
        this.sortByAsc = true;
        this.document_list.sort((a:any,b:any) => b.category.localeCompare(a.category));
        }
    }
    if(type=='file_no'){
      if(this.sortByAsc == true) {
        this.sortByAsc = false;
        this.document_list.sort((a:any,b:any) => a.file_nos.localeCompare(b.file_nos));
        } else {
        this.sortByAsc = true;
        this.document_list.sort((a:any,b:any) => b.file_nos.localeCompare(a.file_nos));
        }
    }
  }

    ngOnInit() {
      // this.auth.tokenValue.next(false);
      this.get_document_list(1, '', null, null);
      this.formGroup = new FormGroup({
        document_name: new FormControl('', [
          Validators.required
        ]),
        file: new FormControl('', [
          Validators.required
        ]) ,
        category: new FormControl('', [
          Validators.required
        ])
      });

      this.searchformGroup = new FormGroup({
        document_name: new FormControl(''),
        created_at: new FormControl('') ,
        category: new FormControl('')
      });
    }

    ngAfterViewInit() {
      console.log('LAST IN DOCUMENTS COMP');

      // this.auth.tokenValue.next(true);
      if(this.auth.tokenValue.value == true)
      {let data = localStorage.getItem('token');
      this.auth.login(data);}
    }


    search: any;
    public document_search(page: any){
      console.log(this.searchformGroup.value);
      this.search = this.searchformGroup.value;
      this.get_document_list(page,this.searchformGroup.value,null,null);
    }

    sorting_name: any;
    public sorting_data(type: any){

       this.sorting_name = type;
       if(this.sortByAsc == true) {
         this.sortByAsc = false;
         this.get_document_list(this.pages,this.search,this.sortByAsc,type);
       }else{
          this.sortByAsc = true;
          this.get_document_list(this.pages,this.search,this.sortByAsc,type);
       }

    // if(this.sortByAsc == true) {
    //   this.sortByAsc = false;
    //   this.pageChange(this.pages,table,this.sortByAsc,type,sorting_name,sorting_method,null,search);
    // } else {
    //   this.sortByAsc = true;
    //   this.pageChange(this.pages,table,this.sortByAsc,type,sorting_name,sorting_method,null,search);
    // }

    }



  }
