import { Injectable,Output , EventEmitter } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
// import { idLocale } from 'ngx-bootstrap';
@Injectable({
  providedIn: 'root'
})
export class SetUserService {

  constructor() { }
  // @Output() change: EventEmitter<any> = new EventEmitter();
  private change = new BehaviorSubject<any>('');
  private edit_permission = new BehaviorSubject<any>('');
  public change_status = new BehaviorSubject<any>('');
  public user_role:any = [];
  public str:any;
  public pr_name = new BehaviorSubject<any>('');
  pracname = this.pr_name.asObservable();
  setId(token: any,data: any){
    localStorage.setItem('id', token);
    localStorage.setItem('name',data);
    // localStorage.setItem('role',role);
    // localStorage.setItem('role_id',role_id);

    // this.change.emit(role);
// this.set_type(role);
  }

  getId():any{
    return localStorage.getItem('id');
  }
  getname(){
    return localStorage.getItem('name');
  }
  set_type(data: null)
  {
    this.user_role=data;
    if(this.user_role!=undefined)
    {
      this.change.next(this.user_role);
    }
  }
  update_role() : Observable<any> {
    return this.change.asObservable();
  }

  set_edit_type(data: null | undefined)
  {
    if(data != undefined)
    {
      this.edit_permission.next(data);
    }

  }
  update_edit_perm() : Observable<any> {
    return this.edit_permission.asObservable();
  }



  get_type()
  {
    return this.user_role;
  }
  get_role()
  {
    return localStorage.getItem('role');
  }

  get_role_id()
  {
    return localStorage.getItem('role_id');
  }

  setPractice(prac_id: any)
  {
    console.log('123');
    localStorage.setItem('practice_id',prac_id.data);
    localStorage.setItem('pr_name',prac_id.practice_name);
    localStorage.setItem('role_id',prac_id.role);
    this.get_prname();
  }




  public display_error:string|undefined;

  public dashboard_warning(data: string | undefined)
  {
    this.display_error=data;
  }
  public get_error()
    {
    return this.display_error;
    }


  public get_prname(){
    if (localStorage.getItem('pr_name') !=undefined && localStorage.getItem('pr_name') !=null && localStorage.getItem('pr_name') !=''){
      this.str = localStorage.getItem('pr_name');
      this.str = this.str[0].toUpperCase() + this.str.slice(1);
    }
    else {
      this.str = null;
    }

    this.pr_name.next(this.str);
  }
}
