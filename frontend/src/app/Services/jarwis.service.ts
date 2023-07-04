import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import 'rxjs/add/observable/forkJoin';
// import { Observable } from "rxjs";
// import { map, filter, switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash';
import { concat } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class JarwisService {
  // private baseUrl = 'http://:8000/api';
  // private baseUrl = 'http://localhost:8000/api';
  //private baseUrl = 'http://127.0.0.1:8000/api';
  private baseUrl = `${environment.apiUrl}`;
  //private baseUrl = 'http://35.226.72.203/avecarm/backend/public/index.php/api';
  constructor(private http: HttpClient) {
  }


  common_url(url: any, data: any) {
    if (localStorage.getItem('role') != 'Admin') {
      data['practice_dbid'] = localStorage.getItem('practice_id');
    }

    //console.log("I=P",data);

    return this.http.post(`${this.baseUrl}/` + url, data);
  }



  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
    //  let response= this.common_url('login',data);

    //  return response;

  }

  register(data: any, id: any) {
    data = { form_data: data, user_id: id };
    // console.log(data);
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  validatemail(data: any) {
    return this.http.post(`${this.baseUrl}/validatemail`, data);
  }

  getrole() {
    return this.http.post(`${this.baseUrl}/getroles`, {});
  }

  validateusername(data: any) {
    return this.http.post(`${this.baseUrl}/validateusername`, data);
  }

  validateUsername(data: any, data2: any) {
    data = { data, id: data2 };
    return this.http.post(`${this.baseUrl}/validateusername`, data);
  }

  // getclaims(data)
  // {
  //   //data={token:data2,id:data};
  //   return this.http.post(`${this.baseUrl}/getclaims`, data);
  // }

  upload(formdata: any) {
    console.log(formdata);
    // let data = {formData:formdata, practice_dbid : localStorage.getItem('practice_id')};



    return this.http.post(`${this.baseUrl}/upload`, formdata);

    // let data=formdata;
    // let response= this.common_url('upload',data);

    // return response;
  }

  uploadcloseclaim(formvalues: any) {
    console.log(formvalues);
    return this.http.post(`${this.baseUrl}/update_auto_close_claims`, formvalues);
  }

  getprofile(data: any) {
    data = { id: data };
    return this.http.post(`${this.baseUrl}/getprofile`, data);
  }

  setimage(data: any, dataid: any) {
    data = { image: data, id: dataid };
    return this.http.post(`${this.baseUrl}/setimage`, data);
  }

  updateprofile(data: any, dataid: any) {
    data = { data, id: dataid };
    return this.http.post(`${this.baseUrl}/updateprofile`, data);
  }

  getfile(data: any) {
    data = { id: data, practice_dbid: localStorage.getItem('practice_id') };
    return this.http.post(`${this.baseUrl}/getfile`, data, { responseType: 'blob' });
  }

  getfields(data: any, searchValue: any) {
    data = { set: data, searchValue: searchValue, practice_dbid: localStorage.getItem('practice_id') };
    return this.http.post(`${this.baseUrl}/getfields`, data);
  }

  setsetting(data: any) {
    data = { set: data, practice_dbid: localStorage.getItem('practice_id') };
    return this.http.post(`${this.baseUrl}/setsetting`, data);
  }
  template() {
    let data = { practice_dbid: localStorage.getItem('practice_id') };
    return this.http.post(`${this.baseUrl}/template`, data);
  }

  createpractice(data: any, data1: any) {
    data = { uid: data1, data: data };

    return this.http.post(`${this.baseUrl}/createpractice`, data);
  }

  createnewclaims(data: any, data1: any, id: any) {
    data = { claim: data, file: data1, user_id: id };
    // console.log("Create_dta",data);
    // return this.http.post(`${this.baseUrl}/createclaim`,data);

    let response = this.common_url('createclaim', data);

    return response;
  }

  mismatch(data: any) {
    data = { info: data };
    return this.http.post(`${this.baseUrl}/updatemismatch`, data);
  }

  overwrite(data: any, user_id: any) {
    data = { info: data, user_id: user_id };
    // return this.http.post(`${this.baseUrl}/overwrite`,data);

    let response = this.common_url('overwrite', data);

    return response;

  }

  overwrite_all(data: any, user_id: any) {
    data = { info: data, user_id: user_id };
    // return this.http.post(`${this.baseUrl}/overwrite_all`,data);

    let response = this.common_url('overwrite_all', data);

    return response;

  }
  getdata(claims: any, id: any, reassign: any) {
    let data = { user_id: id, claim_no: claims, reassign: reassign }
    let response = this.common_url('reassign', data);
    return response;
  }
  get_closed_claims(claims: any, id: any) {
    let data = { user_id: id, claim_no: claims }
    let response = this.common_url('closedClaims', data);
    return response;
  }
  getclaim_details(id: any, page: any, page_count: any, type: any, sort_code: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, search: any) {
    console.log(search);
    let data = { user_id: id, page_no: page, count: page_count, claim_type: type, sort_code: sort_code, sort_type: sort_type, sorting_name: sorting_name, sorting_method: sorting_method, assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh, search: search }
    // return this.http.post(`${this.baseUrl}/getclaim_details`, data);
    let response = this.common_url('getclaim_details', data);

    return response;
  }

  getclaim_details_new(id: any, type: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any) {
    let data = { user_id: id, claim_type: type,  assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh}
    // return this.http.post(`${this.baseUrl}/getclaim_details`, data);
    let response = this.common_url('getclaim_details', data);

    return response;
  }
  // getclaim_details_sort(id,page,page_count,type,sort_code,sort_type)
  // {
  //   let data={user_id:id,page_no:page,count:page_count,claim_type:type,sort_code:sort_code,sort_type:sort_type}
  //   // return this.http.post(`${this.baseUrl}/getclaim_details`, data);
  //   let response= this.common_url('getclaim_details',data);

  //   return response;
  // }

  getclaim_details_reasign(id: any, page: any, page_count: any, type: any) {
    let data = { user_id: id, page_no: page, count: page_count, claim_type: type }
    // return this.http.post(`${this.baseUrl}/getclaim_details`, data);
    let response = this.common_url('getclaim_details_reassign', data);

    return response;
  }

  process_note(id: any, notes: any, data: any, func_type: any, claim_status: any) {
    data = { userid: id, process_note: notes, claim_det: data, func: func_type, claim_status: claim_status };
    // return this.http.post(`${this.baseUrl}/process_note`, data);

    let response = this.common_url('process_note', data);
    return response;
  }

  getnotes(data: { claimid: any; }) {
    data = { claimid: data };
    // return this.http.post(`${this.baseUrl}/getnotes`, data);
    let response = this.common_url('getnotes', data);
    return response;

  }

  claim_note(id: any, notes: any, data: any, func_type: any) {
    data = { userid: id, claim_note: notes, claim_det: data, func: func_type };
    // return this.http.post(`${this.baseUrl}/claim_note`, data);

    let response = this.common_url('claim_note', data);
    return response;
  }


  qc_note(id: any, notes: any, data: any, func_type: any) {
    data = { userid: id, qc_note: notes, claim_det: data, func: func_type };
    //console.log(data);
    // return this.http.post(`${this.baseUrl}/qc_note`, data);
    let response = this.common_url('qc_note', data);
    return response;
  }

  create_category(data: any, id: any) {
    data = { data: data, id: id }
    // return this.http.post(`${this.baseUrl}/create_category`, data);
    let response = this.common_url('create_category', data);
    return response;
  }

  get_category(data: any) {
    data = { id: data };
    // return this.http.post(`${this.baseUrl}/get_category`, data);
    let response = this.common_url('get_category', data);
    return response;
  }
  create_questions(data: any, id: any, userid: any) {
    data = { data: data, cat_id: id, user_id: userid };
    // return this.http.post(`${this.baseUrl}/create_questions`, data);
    let response = this.common_url('create_questions', data);
    return response;
  }

  update_category(data: any, id: any, data_id: any) {
    data = { data: data, id: id, upd_id: data_id }
    // return this.http.post(`${this.baseUrl}/update_category`, data);
    let response = this.common_url('update_category', data);
    return response;
  }

  update_questions(data: any, userid: any, id: any) {
    data = { data: data, upd_id: id, user_id: userid };
    // return this.http.post(`${this.baseUrl}/update_questions`, data);
    let response = this.common_url('update_questions', data);
    return response;
  }

  create_followup(id: any, questions: any, data: { user_id: any; question_data: any; form_data: any; claim_no: any; cat: any; }, claim: any, category: any) {
    data = { user_id: id, question_data: questions, form_data: data, claim_no: claim, cat: category };
    let response = this.common_url('create_followup', data);
    return response;
  }

  update_followup_template(user_id: any, temp_id: any, questions: any, data: any, claim: any, category: any) {
    data = { user_id: user_id, temp_id: temp_id, question_data: questions, form_data: data, claim_no: claim, cat: category };
    let response = this.common_url('update_followup_template', data);
    return response;
  }

  get_followup(data: { claim_no: any; }) {
    data = { claim_no: data };
    // return this.http.post(`${this.baseUrl}/get_followup`, data);
    let response = this.common_url('get_followup', data);
    return response;
  }
  get_associates(data: any) {
    // return this.http.post(`${this.baseUrl}/get_associates`, data);

    data = { userId: data }
    let response = this.common_url('get_associates', data);
    return response;
  }

  get_associate_name(data: any) {
    data = { user_id: data };
    let response = this.common_url('get_associate_name', data);
    return response;
  }
  create_workorder(id: any, data: any, claim: any, wo_type: any) {
    data = { id: id, work: data, claim: claim, type: wo_type };
    // return this.http.post(`${this.baseUrl}/create_workorder`, data);

    let response = this.common_url('create_workorder', data);

    return response;


  }
  check_claims(data: any) {
    data = { claim: data }
    // return this.http.post(`${this.baseUrl}/check_claims`, data);
    let response = this.common_url('check_claims', data);

    return response;
  }

  // get_table_page(data:any, page: any, page_count: any, type: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
  //   data = { page_no: page, count: page_count, filter: data, sort_type: type, sorting_name: sorting_name, sorting_method: sorting_method, createsearch: createsearch, search: search };
  //   let response = this.common_url('get_new_claims', data);
  //   return response;
  // }

  // get_first_table_data(createsearch: any) {   // new fn..
  //   let data = { createsearch: createsearch };
  //   console.log('sasa', data);
  //   let response = this.common_url('get_table_page', data);
  //   return response;
  // }
  get_first_table_data(createsearch: any) {   // new fn..
    let data = { createsearch: createsearch };
    const promise = new Promise<void>(( resolve, reject) => {
      this.common_url('get_table_page', data).subscribe({
        next: (res: any) => {
          resolve(res);
          return res;
        },
        error: (err: any) => {
          reject(err);
        },
        complete: () => {
          console.log('complete');
        },
      });
    });
    return promise;
  }

  get_table_page(data: any, page: any, page_count: any, type: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
    data = { page_no: page, count: page_count, filter: data, sort_type: type, sorting_name: sorting_name, sorting_method: sorting_method, createsearch: createsearch, search: search };
    let response = this.common_url('get_table_page', data);
    return response;
  }

  get_table_page_sorting(data: any, page: any, page_count: any, type: any) {
    data = { page_no: page, count: page_count, filter: data, sort_type: type };
    let response = this.common_url('get_table_page_sorting', data);
    return response;
  }

  get_audit_table_page(data: any, page: any, page_count: any, type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_searh: any, search: any) {
    data = { page_no: page, count: page_count, filter: data, sort_type: type, sorting_name: sorting_name, sorting_method: sorting_method, assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh, audit_claim_searh: audit_claim_searh, search: search };
    let response = this.common_url('get_audit_table_page', data);
    return response;
  }

  get_audit_table_page_new(assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_searh: any, search: any) {
    let data = { assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh, audit_claim_searh: audit_claim_searh, search: search };
    let response = this.common_url('get_audit_table_page', data);
    return response;
  }


  get_related_calims(data: any, type: string, user: null) {
    data = { claim_no: data, type: type, user_id: user };
    let response = this.common_url('get_related_calims', data);
    return response;
  }

  get_upload_table_page(page: any, page_count: any) {
    let data = { page_no: page, count: page_count }
    let response = this.common_url('get_upload_table_page', data);
    return response;
  }

  create_status_code(data: any, id: any) {
    data = { data: data, id: id }
    // return this.http.post(`${this.baseUrl}/create_statuscode`, data);

    let response = this.common_url('create_statuscode', data);
    return response;
  }

  get_status_codes(data: any, mod: string) {
    data = { id: data, module: mod };
    // return this.http.post(`${this.baseUrl}/get_status_codes`, data);

    let response = this.common_url('get_status_codes', data);

    return response;
  }
  create_sub_status(data: any, id: any, status_id: any) {
    data = { data: data, id: id, status: status_id }
    // return this.http.post(`${this.baseUrl}/create_substatus_code`, data);

    let response = this.common_url('create_substatus_code', data);
    return response;

  }
  update_status_code(data: any, id: any, user: any) {
    data = { upd_data: data, upd_id: id, user_id: user, type: 'statuscode' }
    // return this.http.post(`${this.baseUrl}/update_status_code`, data);

    let response = this.common_url('update_status_code', data);
    return response;
  }
  update_sub_status_code(data: any, id: any, user: any) {
    data = { upd_data: data, upd_id: id, user_id: user, type: 'sub_statuscode' }
    // return this.http.post(`${this.baseUrl}/update_status_code`, data);

    let response = this.common_url('update_status_code', data);
    return response;
  }

  finish_followup(id: any, data: any, claim: any, type: any) {
    data = { user_id: id, status_code: data.status, audit_err_code: data.audit_err_code, claim_det: claim, followup_type: type };
    // return this.http.post(`${this.baseUrl}/create_followup_data`, data);
    let response = this.common_url('create_followup_data', data);
    return response;
  }

  get_audit_claim_details(id: any, page: any, page_count: any, claim_type: any, sort_code: any, sort_type: any, sorting_name: any, sorting_method: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, search: any) {
    let data = { user_id: id, page_no: page, count: page_count, type: claim_type, sort_code: sort_code, sort_type: sort_type, sorting_name: sorting_name, sorting_method: sorting_method, assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh, audit_claim_search: audit_claim_search, search };
    // return this.http.post(`${this.baseUrl}/get_audit_claim_details`, data);
    let response = this.common_url('get_audit_claim_details', data);
    return response;
  }

   get_audit_claim_details_new(id: any, claim_type: any, assign_claim_searh: any, reassign_claim_searh: any, closed_claim_searh: any, audit_claim_search: any, ){
    let data = {user_id: id, type: claim_type,assign_claim_searh: assign_claim_searh, reassign_claim_searh: reassign_claim_searh, closed_claim_searh: closed_claim_searh, audit_claim_search: audit_claim_search};
    let response = this.common_url('get_audit_claim_details', data);
    return response;
  }
  public get_auditors(data: any) {
    data = { user_id: data }
    // return this.http.post(`${this.baseUrl}/get_auditors`, data);

    let response = this.common_url('get_auditors', data);

    return response;
  }

  // create_audit_workorder(id,data,workorder)
  // {
  //   data={id:id,assign_data:data,wo_details:workorder};
  //   return this.http.post(`${this.baseUrl}/create_audit_workorder`, data);
  // }

  get_workorder(filter: any, from: any, to: any, wo_type: any, page_no: any, sort_type: any, sort_data: any, sorting_name: any, sorting_method: any, closedClaimsFind: any, workordersearch: any, search: any,) {
    let data = { filter_type: filter, from_date: from, to_date: to, type: wo_type, page: page_no, sort_type: sort_type, sort_data: sort_data, sorting_name: sorting_name, sorting_method: sorting_method, closedClaimsFind: closedClaimsFind, workordersearch: workordersearch, search: search };
    let response = this.common_url('get_workorder', data);
    return response;
  }

  get_workorder_new(filter: any, wo_type: any,page_no: any,closedClaimsFind: any, workordersearch: any) {
    let data = { filter_type:filter,page: page_no,type: wo_type,closedClaimsFind: closedClaimsFind, workordersearch: workordersearch};
    let response = this.common_url('get_workorder', data);
    return response;
  }

  get_workorder_details(id: any) {
    let data = { wo_id: id };
    let response = this.common_url('get_workorder_details', data);

    return response;

  }
  get_ca_claims(id: any, page: any, page_count: any, claim_type: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, claim_searh: any, search: any) {
    let data = { user_id: id, page_no: page, count: page_count, type: claim_type, sort_data: sort_data, sort_type: sort_type, sorting_name: sorting_name, sorting_method: sorting_method, claim_searh: claim_searh, search: search }
    let response = this.common_url('get_ca_claims', data);

    return response;
  }
  get_user_list(data: any) {
    data = { user_id: data }
    return this.http.post(`${this.baseUrl}/get_user_list`, data);
  }
  // create_ca_workorder(id,data)
  // {
  //   data={id:id,assign_data:data};
  //   return this.http.post(`${this.baseUrl}/create_ca_workorder`, data);
  // }
  client_notes(id: any, notes: any, data: any, func_type: any) {
    data = { practice_dbid: localStorage.getItem('practice_id'), userid: id, client_note: notes, claim_det: data, func: func_type };
    return this.http.post(`${this.baseUrl}/client_note`, data);
  }
  fetch_export_data(filter: any, s_code: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id };
    return this.http.post(`${this.baseUrl}/fetch_export_data`, data);
  }
  get_rcm_claims(id: any, page: any, page_count: any, sort_data: any, sort_type: any, sorting_name: any, sorting_method: any, claim_searh: any, search: any) {
    let data = { user_id: id, page_no: page, count: page_count, sort_data: sort_data, sort_type: sort_type, sorting_name: sorting_name, sorting_method: sorting_method, claim_searh: claim_searh, search: search }
    let response = this.common_url('get_rcm_claims', data);
    return response;
  }

  get_rcm_claims_sorting(id: any, page: any, page_count: any, type: any, filter: any) {
    let data = { user_id: id, page_no: page, count: page_count, type: type, filter: filter }
    let response = this.common_url('get_rcm_claims_sorting', data);
    return response;
  }

  get_rcm_team_list(data: any) {
    data = { user_id: data }
    return this.http.post(`${this.baseUrl}/get_rcm_team_list`, data);
  }

  // create_rcm_workorder(id,data)
  // {
  //   data={id:id,assign_data:data};
  //   // console.log(data);
  //   return this.http.post(`${this.baseUrl}/create_rcm_workorder`, data);
  // }
  // get_client_notes(data)
  // {
  //
  //   data={claimid:data};
  //   return this.http.post(`${this.baseUrl}/get_client_notes`, data);
  // }

  get_process_associates(data: any, claim_no: any, module: any) {
    let res1 = this.get_status_codes(data, module);
    let res2 = this.get_associates(data);
    // let res3 = this.get_note_details(claim_no)
    return forkJoin([res1, res2]);
  }

  get_note_details(claim_no: any) {
    let data = { claim: claim_no }
    // console.log("Notes details i/p",claim)
    // return this.http.post(`${this.baseUrl}/get_note_details`, claim);

    let response = this.common_url('get_note_details', data);

    return response;
  }


  claim_status_data_fork(data: any, page: any, page_count: any, type: any, id: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
    let status_data = this.get_status_codes(id, 'all');
    let page_data = this.get_table_page(data, page, page_count, type, sorting_name, sorting_method, createsearch, search)

    return forkJoin([page_data, status_data]);
  }

  fetch_calim_export_data(filter: any, s_code: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id };
    return this.common_url('fetch_claim_export_data', data);
  }



  fetch_wo_export_data(filter: any, s_code: any, wo_type: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id, wo: wo_type };
    return this.common_url('fetch_claim_export_data', data);
  }

  fetch_rcm_export_data(filter: any, s_code: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id };
    return this.http.post(`${this.baseUrl}/fetch_rcm_export_data`, data);
  }

  fetch_audit_export_data(filter: any, s_code: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id };
    return this.http.post(`${this.baseUrl}/fetch_audit_export_data`, data);
  }

  fetch_followup_export_data(filter: any, s_code: any, user_id: any) {
    let data = { filter: filter, status: s_code, user: user_id };
    return this.http.post(`${this.baseUrl}/fetch_followup_export_data`, data);
  }

  doc_name_validity(data: { name: any; check_type: any; id: any; }, type: any, doc_id: any) {
    data = { name: data, check_type: type, id: doc_id };
    return this.http.post(`${this.baseUrl}/doc_name_validity`, data);
  }

  upload_document_file(data: any) {
    return this.http.post(`${this.baseUrl}/upload_document_file`, data);

  }

  get_document_list(page: any, page_count: any, searchValue: any, sort_by: any, sort_name: any) {
    let data = { page_no: page, count: page_count, searchValue: searchValue, sort_by: sort_by, sort_name: sort_name };
    // return this.http.post(`${this.baseUrl}/get_document_list`, data);
    let response = this.common_url('get_document_list', data);

    return response;


  }
  download_doc_file(id: any, file: any) {
    let data = { doc_id: id, file_data: file };
    // return this.http.post(`${this.baseUrl}/download_doc_file`, data,{responseType: 'blob'});

    let response = this.common_url('download_doc_file', data);
    return response;
  }
  delete_doc_file(nos: any, data: any, page: any, count: any) {
    data = { file_name: data, id: nos, page_no: page, page_count: count };

    let response = this.common_url('delete_doc_file', data);
    return response;
  }

  get_selected_claim_details_fork(data: any) {
    let res1 = this.get_related_calims(data, 'claim', null);
    let res2 = this.get_line_items(data);
    return forkJoin([res1, res2]);
  }

  get_line_items(data: any) {
    data = { claim_no: data['claim_no'] };
    // return this.http.post(`${this.baseUrl}/get_line_items`, data);
    let response = this.common_url('get_line_items', data);
    return response;
  }


  reassign_calim(claim: any, id: any, mod_type: any) {
    let data = { claim_data: claim, user_id: id, type: mod_type };
    // return this.http.post(`${this.baseUrl}/reassign_calim`, data);
    let response = this.common_url('reassign_calim', data);
    return response;
  }

  check_edit_val(claim: any, type: any) {
    let data = { claim_data: claim, type: type };
    // return this.http.post(`${this.baseUrl}/check_edit_val`, data);
    let response = this.common_url('check_edit_val', data);
    return response;
  }

  check_notes_update(cliam_data: any, type: any, notes: any) {
    let data = { claim: cliam_data, note_type: type, note_data: notes };
    // console.log("I/p data",data);
    // return this.http.post(`${this.baseUrl}/check_notes_update`, data);
    let response = this.common_url('check_notes_update', data);
    return response;
  }

  get_users_list(user: any) {
    let data = { user_id: user, practicedb_id: localStorage.getItem('practice_id') };
    // console.log(data);
    //return this.http.post(`${this.baseUrl}/get_users_list`, data);
    let response = this.common_url('get_users_list', data);
    return response;
  }

  get_practice_user_list(user: any) {
    let data = { user_id: user, practicedb_id: localStorage.getItem('practice_id') };
    // console.log(data);
    //return this.http.post(`${this.baseUrl}/get_users_list`, data);
    let response = this.common_url('get_practice_user_list', data);
    return response;
  }

  // getting user list from aims database //
  get_aimsusers_list(user: any) {
    let data = {
      token: '1a32e71a46317b9cc6feb7388238c95d',
      department_id: 1
    };
    // console.log(data);
    let response = this.http.post('http://127.0.0.1:8080/api/product_api_v1/get_user_list', data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST'
      }
    });
    console.log(response);
    //let response= this.common_url('get_users_list', data);
    return response;
  }


  update_user_details(data: any, dataid: any, user_id: any) {
    data = { data, id: dataid, update_id: user_id };
    return this.http.post(`${this.baseUrl}/update_user_details`, data);


  }

  get_root_cause(data: any, mod: any) {
    data = { id: data, module: mod };
    // return this.http.post(`${this.baseUrl}/get_root_cause`, data);
    let response = this.common_url('get_root_cause', data);
    return response;
  }

  create_root_cause(user_id: any, data: any, func: any) {
    data = { id: user_id, form_data: data, type: func };
    // return this.http.post(`${this.baseUrl}/create_root_cause`, data);
    let response = this.common_url('create_root_cause', data);
    return response;
  }

  get_error_type(data: any, mod: any) {
    data = { id: data, module: mod };
    // return this.http.post(`${this.baseUrl}/get_error_type`, data);
    let response = this.common_url('get_error_type', data);
    return response;
  }

  create_error_type(user_id: any, data: any, func: any) {
    data = { id: user_id, form_data: data, type: func };
    // return this.http.post(`${this.baseUrl}/create_error_type`, data);
    let response = this.common_url('create_error_type', data);
    return response;
  }

  getDropDownText(id: _.Dictionary<any> | _.NumericDictionary<any> | null | undefined, object: any) {
    const selObj = _.filter(object, function (o) {
      return (_.includes(id, o.id));
    });
    return selObj;
  }

  get_audit_codes(data: any) {
    data = { id: data, practice_dbid: localStorage.getItem('practice_id') };
    // return this.http.post(`${this.baseUrl}/get_audit_codes`, data);
    let response = this.common_url('get_audit_codes', data);
    return response;
  }

  auto_assign_claims(data: any) {
    data = { id: data };
    // return this.http.post(`${this.baseUrl}/auto_assign_claims`, data);

    let response = this.common_url('auto_assign_claims', data);
    return response;
  }

  get_practice_stats() {
    return this.http.get(`${this.baseUrl}/get_practice_stats`);
  }

  update_prac_settings(data: any, id: any) {
    data = { form_data: data, user_id: id };
    return this.http.post(`${this.baseUrl}/update_prac_settings`, data);
  }

  get_work_order_details(id: any) {
    let data = { user_id: id };
    // return this.http.post(`${this.baseUrl}/get_work_order_details`, data);

    let response = this.common_url('get_work_order_details', data);

    return response;
  }

  delete_upload_file(id: any, user: any) {
    let data = { file_id: id, user_id: user }
    // return this.http.post(`${this.baseUrl}/delete_upload_file`, data);
    let response = this.common_url('delete_upload_file', data);

    return response;
  }

  process_upload_file(id: any, user: any) {
    let data = { file_id: id, user_id: user, practice_dbid: localStorage.getItem('practice_id') }
    // return this.http.post(`${this.baseUrl}/process_upload_file`, data);

    let response = this.common_url('process_upload_file', data);

    return response;
  }
  get_claim_graph_stats(id: any) {
    let data = { user: id };
    // return this.http.post(`${this.baseUrl}/get_claim_graph_stats`,data);
    let response = this.common_url('get_claim_graph_stats', data);

    return response;
  }
  get_claim_table_stats(id: any) {
    let data = { user: id };
    // return this.http.post(`${this.baseUrl}/get_claim_table_stats`,data);

    let response = this.common_url('get_claim_table_stats', data);
    return response;
  }
  get_detailed(id: any) {
    let data = { user: id };
    // return this.http.post(`${this.baseUrl}/get_detailed`,data);
    let response = this.common_url('get_detailed', data);
    return response;
  }

  get_graph_stats_fork(id: any) {
    let res1 = this.get_claim_graph_stats(id);
    let res2 = this.get_claim_table_stats(id);
    return forkJoin([res1, res2]);
  }

  get_summary_details(id: any) {
    let data = { user: id };
    // return this.http.post(`${this.baseUrl}/get_summary_details`,data);

    let response = this.common_url('get_summary_details', data);
    return response;
  }

  get_prod_qual(id: any, days: any) {
    let data = { user: id, day: days };
    // return this.http.post(`${this.baseUrl}/get_prod_qual`,data);

    let response = this.common_url('get_prod_qual', data);
    return response;
  }

  get_month_details() {
    return this.http.get(`${this.baseUrl}/get_month_details`);
  }

  // get_assigned_claims(id,page,page_count)
  // {
  //   let data={user_id:id,page_no:page,count:page_count}
  //   return this.http.post(`${this.baseUrl}/get_assigned_claims`, data);
  // }

  fork_user_month_det(id: any, assoc_id: any) {
    let res1 = this.get_detailed(assoc_id);
    let res2 = this.process_weekly_data(assoc_id);
    return forkJoin([res1, res2]);
  }

  process_weekly_data(assoc_id: any) {
    let data = { user: assoc_id };
    // return this.http.post(`${this.baseUrl}/process_weekly_data`,data);

    let response = this.common_url('process_weekly_data', data);
    return response;
  }

  createVendor(form_data: any, user: any) {
    let data = { form: form_data, user_id: user };
    return this.http.post(`${this.baseUrl}/createVendor`, data);
  }
  getVendor() {
    return this.http.get(`${this.baseUrl}/getVendor`);
  }
  updateVendor(update_data: any, update_id: any, user: any) {
    let data = { form: update_data, upd_id: update_id, user_id: user };
    return this.http.post(`${this.baseUrl}/updateVendor`, data);
  }

  getPractices(id: any) {
    let data = { user: id };
    return this.http.post(`${this.baseUrl}/getPractices`, data);
  }

  selectPractice(practice: any, user: any) {
    let data = { prac_id: practice, user_id: user };
    return this.http.post(`${this.baseUrl}/selectPractice`, data);

  }

  get_logs() {
    return this.http.get(`${this.baseUrl}/getLogs`);
  }

  viewLog(name: any) {
    let data = { file_name: name };
    return this.http.post(`${this.baseUrl}/viewLog`, data);
  }

  getPracticesList() {
    return this.http.get(`${this.baseUrl}/getPracticesList`);
  }

  get_audit_graph(id: any) {
    let data = { user: id };
    let response = this.common_url('get_audit_graph', data);
    return response;
  }

  userEdit(id: any) {
    let data = { user: id };
    let response = this.common_url('get_user_edit', data);
    return response;
  }

  createRoles(datas: any, id: any) {
    let data = { form_data: datas, user_id: id };
    let response = this.common_url('create_roles', data);
    return response;
  }

  updateRoles(datas: any, id: any, role_id: any) {
    let data = { form_data: datas, user_id: id, role_id: role_id };
    let response = this.common_url('update_roles', data);
    return response;
  }

  followup_process_notes_delete(claim_no: any, id: any) {
    let data = { claim_no: claim_no, user_id: id };
    let response = this.common_url('followup_process_notes_delete', data);
    return response;
  }

  reasigned_followup_process_notes_delete(claim_no: any, id: any) {
    let data = { claim_no: claim_no, user_id: id };
    let response = this.common_url('reasigned_followup_process_notes_delete', data);
    return response;
  }

  closed_followup_process_notes_delete(claim_no: any, id: any) {
    let data = { claim_no: claim_no, user_id: id };
    let response = this.common_url('closed_followup_process_notes_delete', data);
    return response;
  }


  audit_process_notes_delete(claim_no: any, id: any) {
    let data = { claim_no: claim_no, user_id: id };
    let response = this.common_url('audit_process_notes_delete', data);
    return response;
  }

  closed_audit_process_notes_delete(claim_no: any, id: any) {
    let data = { claim_no: claim_no, user_id: id };
    let response = this.common_url('closed_audit_process_notes_delete', data);
    return response;
  }

  template_edit(claim_id: any, id: any) {
    let data = { claim_id: claim_id, user_id: id };
    let response = this.common_url('template_edit', data);
    return response;
  }

  insurance_name_list() {
    let data = { all: 'data' };
    let response = this.common_url('insurance_name_list', data);
    return response;
  }


  claims_order_list(type: any, user_id: any, sortByAsc: any) {
    let data = { type: type, user_id: user_id, sortByAsc: sortByAsc };
    let response = this.common_url('claims_order_list', data);
    return response;
  }

  getclaim_details_order_list(user_id: any, page: any, page_count: any, type: any, sort_data: any, sort_type: any) {
    let data = { claim_type: type, user_id: user_id, page_no: page, count: page_count, sort_data: sort_data, sort_type: sort_type };
    let response = this.common_url('getclaim_details_order_list', data);
    return response;
  }

  audit_assigned_order_list(user_id: any, page: any, page_count: any, type: any, sort_data: any, sort_type: any) {
    let data = { claim_type: type, user_id: user_id, page_no: page, count: page_count, sort_data: sort_data, sort_type: sort_type };
    let response = this.common_url('audit_assigned_order_list', data);
    return response;
  }

  claims_tooltip(claim: any) {
    let data = { claim_no: claim };
    let response = this.common_url('claims_tooltip', data);
    return response;
  }

  get_insurance(user_id: any) {
    let data = { user_id: user_id };
    let response = this.common_url('get_insurance', data);
    return response;
  }

  get_claimno(claim_no: any, user_id: any, claim_type: any, type: any) {
    let data = { claim_no: claim_no, user_id: user_id, claim_type: claim_type, type: type };
    console.log(data);
    let response = this.common_url('get_claimno', data);
    return response;
  }

  get_audit_claimno(claim_no: any, user_id: any, claim_type: any, type: any) {
    let data = { claim_no: claim_no, user_id: user_id, claim_type: claim_type, type: type };
    console.log(data);
    let response = this.common_url('get_audit_claimno', data);
    return response;
  }

  get_rcm_claimno(claim_no: any, user_id: any, claim_type: any) {
    let data = { claim_no: claim_no, user_id: user_id, claim_type: claim_type };
    console.log(data);
    let response = this.common_url('get_rcm_claimno', data);
    return response;
  }

  get_client_claimno(claim_no: any, user_id: any, claim_type: any) {
    let data = { claim_no: claim_no, user_id: user_id, claim_type: claim_type };
    console.log(data);
    let response = this.common_url('get_client_claimno', data);
    return response;
  }

  get_buyer(insurance_name: any) {
    let data = { insurance_name: insurance_name };
    let response = this.common_url('get_buyer', data);
    return response;
  }

  get_report_claims(page: any, page_count: any, search_data: any, sort_type: any, type: any, startTime: any, endTime: any, trans_startDate: any, trans_endDate: any, dos_startDate: any, dos_endDate: any) {
    let data = { page: page, page_count: page_count, data: search_data, sort_type: sort_type, type: type, startTime: startTime, endTime: endTime, trans_startDate: trans_startDate, trans_endDate: trans_endDate, dos_startDate: dos_startDate, dos_endDate: dos_endDate };
    console.log(data);
    let response = this.common_url('get_report_claims', data);
    return response;
  }

  /* Report Export  */

  fetch_claims_report_export_data(filter: any, startTime: any, endTime: any, trans_startDate: any, trans_endDate: any, dos_startDate: any, dos_endDate: any, table_name: any) {
    let data = { filter: filter, startTime: startTime, endTime: endTime, trans_startDate: trans_startDate, trans_endDate: trans_endDate, dos_startDate: dos_startDate, dos_endDate: dos_endDate, table_name: table_name, practice_dbid: localStorage.getItem('practice_id') };
    let response = this.common_url('report_export_claims', data);
    return response;
  }

  fetch_create_claims_export_data(user_id: any, table_name: any, search: any, searchClaims: any, workordersearch: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims, workordersearch: workordersearch };
    let response = this.common_url('fetch_create_claims_export_data', data);
    return response;
  }

  fetch_all_claims_export_data(user_id:any, table_name:any, search:any, searchClaims:any, workordersearch:any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims, workordersearch: workordersearch };
    let response = this.common_url('fetch_all_claims_export_data', data);
    return response;
  }

  fetch_followup_claims_export_data(user_id: any, table_name: any, search: any, searchClaims: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims };
    let response = this.common_url('fetch_followup_claims_export_data', data);
    return response;
  }

  fetch_audit_claims_export_data(user_id: any, table_name: any, search: any, searchClaims: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims };
    let response = this.common_url('fetch_audit_claims_export_data', data);
    return response;
  }

  fetch_billing_claims_export_data(user_id: any, table_name: any, search: any, searchClaims: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims };
    let response = this.common_url('fetch_billing_claims_export_data', data);
    return response;
  }

  fetch_client_claims_export_data(user_id: any, table_name: any, search: any, searchClaims: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims };
    let response = this.common_url('fetch_client_claims_export_data', data);
    return response;
  }

  fetch_work_order_export_data(user_id: any, table_name: any, search: any, searchClaims: any) {
    let data = { user_id: user_id, table_name: table_name, search: search, searchClaims: searchClaims };
    let response = this.common_url('fetch_work_order_export_data', data);
    return response;
  }


  fetch_create_claims_export_data_pdf(user_id: any, table_name: any, search: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_create_claims_export_data_pdf', data);
    return response;
  }

  fetch_followup_claims_export_data_pdf(user_id: any, table_name: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_followup_claims_export_data_pdf', data);
    return response;
  }

  fetch_audit_claims_export_data_pdf(user_id: any, table_name: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_audit_claims_export_data_pdf', data);
    return response;
  }

  fetch_billing_claims_export_data_pdf(user_id: any, table_name: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_billing_claims_export_data_pdf', data);
    return response;
  }

  fetch_client_claims_export_data_pdf(user_id: any, table_name: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_client_claims_export_data_pdf', data);
    return response;
  }

  fetch_work_order_export_data_pdf(user_id: any, table_name: any) {
    let data = { user_id: user_id, table_name: table_name };
    let response = this.common_url('fetch_work_order_export_data_pdf', data);
    return response;
  }

  claims_closed_claim_search(user_id: any, searchValue: any) {
    let data = { user_id: user_id, searchValue: searchValue };
    let response = this.common_url('claims_closed_claim_search', data);
    return response;
  }

  updateingnore(upload_id: any) {
    let data = { upload_id: upload_id };
    let response = this.common_url('updateingnore', data);
    return response;
  }

  deletetemplate(delete_id: any) {
    let data = { delete_id: delete_id };
    let response = this.common_url('deletetemplate', data);
    return response;
  }

  getAlertNotification(user_id: string | null) {
    let data = { user_id: user_id };
    let response = this.common_url('getAlertNotification', data);
    //let response_touch = this.common_url('getAlertNotification', data);
    return response;
    //return response_touch;
  }

  get_setting_importsearch(searchValue: any) {
    let data = { searchValue: searchValue };
    let response = this.common_url('get_setting_importsearch', data);
    return response;
  }

  get_user_role(data: any) {
    let datas = { data: data };
    let response = this.common_url('getroles', datas);
    return response;
    // return this.http.post(`${this.baseUrl}/getroles`,{});
  }

  auto_assigned(user_id: any, claim_id: any, work: any, claim: any, type: any) {
    let data = { user_id: user_id, claim_id: claim_id, work: work, claim: claim, type: type };
    let response = this.common_url('auto_assigned', data);
    return response;
  }

  view_doc_file(id: any) {
    let data = { id: id };
    let response = this.common_url('view_doc_file', data);
    return response;
  }

  get_file_ready_count() {
    let data = { 'practice_dbid': localStorage.getItem('practice_id') };
    let response = this.http.post(`${this.baseUrl}/get_file_ready_count`, data);
    return response;
  }

  get_error_param_codes(data: any) {
    data = { id: data, practice_dbid: localStorage.getItem('practice_id') };
    // return this.http.post(`${this.baseUrl}/get_audit_codes`, data);
    let response = this.common_url('get_error_param_codes', data);
    return response;
  }

  get_error_sub_param_codes(data: any, p_id: any) {
    data = { id: data, practice_dbid: localStorage.getItem('practice_id'), parent_id: p_id };
    let response = this.common_url('get_sub_error_param_codes', data);
    return response;
  }

  all_claim_list(data: any, page: any, page_count: any, type: any, sorting_name: any, sorting_method: any, createsearch: any, search: any) {
    data = { page_no: page, count: page_count, filter: data, sort_type: type, sorting_name: sorting_name, sorting_method: sorting_method, createsearch: createsearch, search: search };
    let response = this.common_url('all_claim_list', data);
    return response;
  }

  all_claim_list_new( createsearch: any){
    let data = {createsearch: createsearch, };
    let response = this.common_url('all_claim_list', data);
    return response;
  }

  /* reallocation_list(data,page,page_count,type,sorting_name,sorting_method,createsearch,search)
  {
     data={page_no:page,count:page_count,filter:data,sort_type:type,sorting_name:sorting_name,sorting_method:sorting_method,reallocationsearch:createsearch,search:search};
     let response= this.common_url('reallocation_list',data);
     return response;
  } */
  get_payer_name() {
    let data = { practice_dbid: localStorage.getItem('practice_id') };
    let response = this.common_url('get_payer_name', data);
    return response;
  }

  get_ca_payer_name() {
    let data = { practice_dbid: localStorage.getItem('practice_id') };
    let response = this.common_url('get_ca_payer_name', data);
    return response;
  }
  file_reimport(formdata: any) {
    console.log(formdata);
    return this.http.post(`${this.baseUrl}/file_reimport`, formdata);
  }
  get_reimport_table_page(page: any, page_count: any) {
    let data = { page_no: page, count: page_count, practice_dbid: localStorage.getItem('practice_id') };
    let response = this.common_url('get_reimport_table_page', data);
    return response;
  }
  reimport_template() {
    let data = { practice_dbid: localStorage.getItem('practice_id') };
    let response = this.http.post(`${this.baseUrl}/reimport_template`, data, { responseType: 'blob' });
    return response;
  }
  getExecutiveList() {
    let data = { practice_dbid: localStorage.getItem('practice_id') };
    let response = this.common_url('get_executive_list', data);
    return response;
  }
  move_create_work_orders(formdata: any) {
    let res = this.http.post(`${this.baseUrl}/move_create_work_order`, formdata);
    return res;
  }

  getReassignedUsers(formdata: any) {
    let result = this.http.post(`${this.baseUrl}/get_reassigned_users`, formdata);
    return result;
  }
  audit_claims_found_user(formdata: any) {
    let result = this.http.post(`${this.baseUrl}/audit_claims_found_user`, formdata);
    return result;
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server Error");
  }
}

