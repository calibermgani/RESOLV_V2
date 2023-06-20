import { Injectable } from '@angular/core';
import * as jsPDF from 'jspdf';
// import jsPDF from 'jspdf';
import {ExcelService} from '../excel.service';
import { ToastrManager } from 'ng6-toastr-notifications';

@Injectable({
  providedIn: 'root'
})
export class ExportFunctionsService {

  constructor(private excelService:ExcelService,public toastr: ToastrManager,) { }


  export_data: Array<any> =[];

  public print_pdf(header:any,data:any)
  {
  //   let doc: any = new jsPDF('l', 'pt');
  //   doc.autoTable({
  //     head: [header],
  //     body: data
  //   });
  //   doc.autoPrint();
  // window.open(doc.output('bloburl'), '_blank');
  }
  
    public generatePDF(header:any,data:any) 
    { 
  //     let doc: any = new jsPDF('l', 'pt');
  //     doc.autoTable({
  //       head: [header],
  //       body: data
  //     });
  // //     doc.autoPrint();
  // // window.open(doc.output('bloburl'), '_blank');
  //     doc.save('table.pdf');
    } 



    public sort_export_data(data:any,export_type:any,type:any)
    {
      this.export_data=[];

      let ca_data=[];
      if(type=='wo_detail')
      {

         ca_data=data;
      }
      else if(type=='claim'){
         ca_data=data.data;
         console.log(ca_data)
      }
      if(export_type=='excel')
      {
        
      }
    else {
    
    for(let i=0;i<ca_data.length;i++)
    {
           let op_json=[];
    op_json.push(ca_data[i]['acct_no']);
    op_json.push(ca_data[i]['claim_no']);
    op_json.push(ca_data[i]['patient_name']);
    op_json.push(ca_data[i]['dos']);
    op_json.push(ca_data[i]['claim_age']);
    op_json.push(ca_data[i]['prim_ins_name']);
    op_json.push('3,745.00');
    op_json.push('3,745.00');
    op_json.push(ca_data[i]['status_code']);
    op_json.push(ca_data[i]['assigned_to_name']+' / '+ca_data[i]['assigned_by_name']+' / '+ca_data[i]['assigned_date']);
    this.export_data.push(op_json);
    } 
    let header=['Acct#','Claim#','Patient Name','DOS','Claim Age','Insurance','Billed','AR Due','Status Code','Assigned To/By/Date'];
     if(export_type == 'PDF'){
       
      this.generatePDF(header,this.export_data);
      }
      else if(export_type == 'print')
      {
        
        this.print_pdf(header,this.export_data);
        }
        }
    }

    public ready_wo_export(data:any,type:any)
    {
      this.export_data=[];
      let ca_data=data.data;
      if(type=='excel')
      {
        
        let op_json:any={};
        for(let i=0;i<ca_data.length;i++)
        {
      op_json=[];
          op_json['Created By/Date']=ca_data[i]['created']+'/'+ca_data[i]['created_date'];
          op_json['Work Order Name']=ca_data[i]['work_order_name'];
          op_json['Claim Count']=ca_data[i]['assigned_nos'];
          op_json['Due Date']=ca_data[i]['due_date'];
          op_json['Billed']='456.40';
          op_json['AR Due']='456.40';
          op_json['WO Status']=ca_data[i]['status'];
          op_json['Priority']=ca_data[i]['priority'];
          this.export_data.push(op_json);
    
        }
        this.excelService.exportAsExcelFile(this.export_data, 'sample');
      }
    else {
    
    for(let i=0;i<ca_data.length;i++)
    {
           let op_json=[];
    op_json.push(ca_data[i]['created']+'/'+ca_data[i]['created_date']);
    op_json.push(ca_data[i]['work_order_name']);
    op_json.push(ca_data[i]['assigned_nos']);
    op_json.push(ca_data[i]['due_date']);
    op_json.push('456.40');
    op_json.push('456.40');
    op_json.push(ca_data[i]['status']);
    op_json.push(ca_data[i]['priority']);
    this.export_data.push(op_json);
    } 
    let header=['Created By/Date','Work Order Name','Claim Count','Due Date','Billed','AR Due','WO Status','Priority'];
     if(type == 'PDF'){
       
      this.generatePDF(header,this.export_data);
      }
      else if(type == 'print')
      {
        this.print_pdf(header,this.export_data);
        }
        }
    }

    public create_template(data:any)
    {
      console.log(data);
      let op_json=[];
      let op_data=data.message;
      for( let i=0;i<op_data.length;i++)
      {
        op_json[op_data[i]]=[];

      }
      this.export_data.push(op_json);
      console.log(this.export_data);
      this.excelService.exportAsExcelFile(this.export_data, 'template');
    }
	

	public report_export_excel(ca_data:any){
		let op_json:any={};
    let export_datas: Array<any> =[];
		let arr:any[] = [];  
		Object.keys(ca_data).map(function(key){  
			arr.push({[key]:ca_data[key]})  
			return arr;  
		});  
		
		if(arr[0].data.length != 0){
		 
			for(let i=0;i<arr[0].data.length;i++)
			{ 
				op_json = [];
			  op_json['Acc No'] = arr[0].data[i].acct_no;
			  op_json['Claim No'] = arr[0].data[i].claim_no;
			  op_json['Patient Name'] = arr[0].data[i].patient_name;
			  op_json['DOS'] = arr[0].data[i].dos;
			  op_json['DOB'] = arr[0].data[i].dob;
			  op_json['SSN'] = arr[0].data[i].ssn;
			  op_json['Gender'] = arr[0].data[i].gender;
			  op_json['PhoneNo'] = arr[0].data[i].phone_no;
			  op_json['Address 1'] = arr[0].data[i].address_1;
			  op_json['Address 2'] = arr[0].data[i].address_2;
			  op_json['City'] = arr[0].data[i].city;
			  op_json['State'] = arr[0].data[i].state;
			  op_json['Zipcode'] = arr[0].data[i].zipcode;
			  op_json['Guarantor'] = arr[0].data[i].guarantor;
			  op_json['Employer'] = arr[0].data[i].employer;
			  op_json['Responsibility'] = arr[0].data[i].responsibility;
			  op_json['Insurance Type'] = arr[0].data[i].insurance_type;
			  op_json['Primary Insurance Name'] = arr[0].data[i].prim_ins_name;
			  op_json['Primary Policy Id'] = arr[0].data[i].prim_pol_id;
			  op_json['Primary Group Id'] = arr[0].data[i].prim_group_id;
			  op_json['Primary Address 1'] = arr[0].data[i].prim_address_1;
			  op_json['Primary Address 2'] = arr[0].data[i].prim_address_2;
			  op_json['Primary City'] = arr[0].data[i].prim_city;
			  op_json['Primary State'] = arr[0].data[i].prim_state;
			  op_json['Primary Zipcode'] = arr[0].data[i].prim_zipcode;
			  op_json['Secondary Insurance Name'] = arr[0].data[i].sec_ins_name;
			  op_json['Secondary Policy Id'] = arr[0].data[i].sec_pol_id;
			  op_json['Secondary Group Id'] = arr[0].data[i].sec_group_id;
			  op_json['Secondary Address 1'] = arr[0].data[i].sec_address_1;
			  op_json['Secondary Address 2'] = arr[0].data[i].sec_address_2;
			  op_json['Secondary City'] = arr[0].data[i].sec_city;
			  op_json['Secondary State'] = arr[0].data[i].sec_state;
			  op_json['Secondary Zipcode'] = arr[0].data[i].sec_zipcode;
			  op_json['Tertiary Insurance Name'] = arr[0].data[i].ter_ins_name;
			  op_json['Tertiary Policy Id'] = arr[0].data[i].ter_pol_id;
			  op_json['Tertiary Group Id'] = arr[0].data[i].ter_group_id;
			  op_json['Tertiary Address 1'] = arr[0].data[i].ter_address_1;
			  op_json['Tertiary Address 2'] = arr[0].data[i].ter_address_2;
			  op_json['Tertiary City'] = arr[0].data[i].ter_city;
			  op_json['Tertiary State'] = arr[0].data[i].ter_state;
			  op_json['Tertiary Zipcode'] = arr[0].data[i].ter_zipcode;
			  op_json['Auth No'] = arr[0].data[i].auth_no;
			  op_json['Rendering Provider'] = arr[0].data[i].rendering_prov;
			  op_json['Billing Provider'] = arr[0].data[i].billing_prov;
			  op_json['Facility'] = arr[0].data[i].facility;
			  op_json['Admint Date'] = arr[0].data[i].admit_date;
			  op_json['Discharge Date'] = arr[0].data[i].discharge_date;
			  op_json['CPT'] = arr[0].data[i].cpt;
			  op_json['ICD'] = arr[0].data[i].icd;
			  op_json['Modifiers'] = arr[0].data[i].modifiers;
			  op_json['Units'] = arr[0].data[i].units;
			  op_json['Total Charges'] = arr[0].data[i].total_charges;
			  op_json['Patient AR'] = arr[0].data[i].pat_ar;
			  op_json['Insurance AR'] = arr[0].data[i].ins_ar;
			  op_json['Total AR'] = arr[0].data[i].total_ar;
			  op_json['Claim Status'] = arr[0].data[i].claim_Status;
			  op_json['Claim Note'] = arr[0].data[i].claims_notes;
			  op_json['Qc note'] = arr[0].data[i].qc_notes;
			  op_json['Process Note'] = arr[0].data[i].process_notes;
			  
			  export_datas.push(op_json);
		     } 
			   this.excelService.exportAsExcelFile(export_datas, ca_data.table);
		}else{
			this.toastr.errorToastr('No data found', 'Error!');
		}
       
	}

  public create_claim_export_excel(ca_data:any){
    let op_json:any={};
    let export_datas: Array<any> =[];
    let arr:any[]= [];  
    Object.keys(ca_data).map(function(key){  
      arr.push({[key]:ca_data[key]})  
      return arr;  
    });  
    
    if(arr[0].data.length != 0){
     
      for(let i=0;i<arr[0].data.length;i++)
      { 
        op_json = [];

        op_json['Acc No'] = arr[0].data[i].acct_no;
        op_json['Claim No'] = arr[0].data[i].claim_no;
        op_json['Patient Name'] = arr[0].data[i].patient_name;
        op_json['DOS'] = arr[0].data[i].dos;
        op_json['DOB'] = arr[0].data[i].dob;
        op_json['SSN'] = arr[0].data[i].ssn;
        op_json['Gender'] = arr[0].data[i].gender;
        op_json['PhoneNo'] = arr[0].data[i].phone_no;
        op_json['Address 1'] = arr[0].data[i].address_1;
        op_json['Address 2'] = arr[0].data[i].address_2;
        op_json['City'] = arr[0].data[i].city;
        op_json['State'] = arr[0].data[i].state;
        op_json['Zipcode'] = arr[0].data[i].zipcode;
        op_json['Guarantor'] = arr[0].data[i].guarantor;
        op_json['Employer'] = arr[0].data[i].employer;
        op_json['Responsibility'] = arr[0].data[i].responsibility;
        op_json['Insurance Type'] = arr[0].data[i].insurance_type;
        op_json['Primary Insurance Name'] = arr[0].data[i].prim_ins_name;
        op_json['Primary Policy Id'] = arr[0].data[i].prim_pol_id;
        op_json['Primary Group Id'] = arr[0].data[i].prim_group_id;
        op_json['Primary Address 1'] = arr[0].data[i].prim_address_1;
        op_json['Primary Address 2'] = arr[0].data[i].prim_address_2;
        op_json['Primary City'] = arr[0].data[i].prim_city;
        op_json['Primary State'] = arr[0].data[i].prim_state;
        op_json['Primary Zipcode'] = arr[0].data[i].prim_zipcode;
        op_json['Secondary Insurance Name'] = arr[0].data[i].sec_ins_name;
        op_json['Secondary Policy Id'] = arr[0].data[i].sec_pol_id;
        op_json['Secondary Group Id'] = arr[0].data[i].sec_group_id;
        op_json['Secondary Address 1'] = arr[0].data[i].sec_address_1;
        op_json['Secondary Address 2'] = arr[0].data[i].sec_address_2;
        op_json['Secondary City'] = arr[0].data[i].sec_city;
        op_json['Secondary State'] = arr[0].data[i].sec_state;
        op_json['Secondary Zipcode'] = arr[0].data[i].sec_zipcode;
        op_json['Tertiary Insurance Name'] = arr[0].data[i].ter_ins_name;
        op_json['Tertiary Policy Id'] = arr[0].data[i].ter_pol_id;
        op_json['Tertiary Group Id'] = arr[0].data[i].ter_group_id;
        op_json['Tertiary Address 1'] = arr[0].data[i].ter_address_1;
        op_json['Tertiary Address 2'] = arr[0].data[i].ter_address_2;
        op_json['Tertiary City'] = arr[0].data[i].ter_city;
        op_json['Tertiary State'] = arr[0].data[i].ter_state;
        op_json['Tertiary Zipcode'] = arr[0].data[i].ter_zipcode;
        op_json['Auth No'] = arr[0].data[i].auth_no;
        op_json['Rendering Provider'] = arr[0].data[i].rendering_prov;
        op_json['Billing Provider'] = arr[0].data[i].billing_prov;
        op_json['Facility'] = arr[0].data[i].facility;
        op_json['Admint Date'] = arr[0].data[i].admit_date;
        op_json['Discharge Date'] = arr[0].data[i].discharge_date;
        op_json['CPT'] = arr[0].data[i].cpt;
        op_json['ICD'] = arr[0].data[i].icd;
        op_json['Modifiers'] = arr[0].data[i].modifiers;
        op_json['Units'] = arr[0].data[i].units;
        op_json['Total Charges'] = arr[0].data[i].total_charges;
        op_json['Patient AR'] = arr[0].data[i].pat_ar;
        op_json['Insurance AR'] = arr[0].data[i].ins_ar;
        op_json['Total AR'] = arr[0].data[i].total_ar;
        op_json['Claim Status'] = arr[0].data[i].claim_Status;
        op_json['Claim Note'] = arr[0].data[i].claims_notes;
        op_json['Assigned To / Assigned By / Created'] = arr[0].data[i].assigned_to_name+' / '+arr[0].data[i].assigned_by_name+' / '+arr[0].data[i].assigned_date;
        
        export_datas.push(op_json);
        console.log(export_datas);
         } 
         this.excelService.exportAsExcelFile(export_datas, ca_data.table);
    }else{
      this.toastr.errorToastr('No data found', 'Error!');
    }
       
  }


  public create_wo_export_excel(ca_data:any){

    let op_json:any={};
    
    let export_datas: Array<any> =[];
    let arr:any[] = [];  
    Object.keys(ca_data).map(function(key){  
      arr.push({[key]:ca_data[key]})  
      return arr;  
    });  
    
    console.log(arr[0].data);

    if(arr[0].data.length != 0){
        for(let i=0;i<arr[0].data.length;i++)
      { 
        op_json = [];
        op_json['Created By / Date'] = arr[0].data[i].created+'-'+arr[0].data[i].created_at;
        op_json['Workorder Name'] = arr[0].data[i].work_order_name;
        op_json['Claim Count'] = arr[0].data[i].assigned_nos;
        op_json['Due Date'] = arr[0].data[i].due_date;
        op_json['Billed'] = arr[0].data[i].billed;
        op_json['AR Due'] = arr[0].data[i].ar_due;
        op_json['Wo Status'] = arr[0].data[i].status;
        op_json['Priority'] = arr[0].data[i].priority;
        op_json['Work Notes'] = arr[0].data[i].work_notes;
        
        export_datas.push(op_json);
         } 
         this.excelService.exportAsExcelFile(export_datas, ca_data.table);
    }else{
        this.toastr.errorToastr('No data found', 'Error!');
    }

  }
    

}
