import { Injectable , Output , EventEmitter } from '@angular/core';
import { JarwisService } from './jarwis.service';
import { Observable, Subject } from 'rxjs';
import { SetUserService } from './set-user.service';
@Injectable({
  providedIn: 'root'
})
export class NotifyService {

  constructor(private Jarwis: JarwisService,
    private user_det:SetUserService) { 
    this.get_touch_limit();
    this.getuser_Id();
  }

  //Touch Notification Functions
  private touch_limit = new Subject<any>();
  public touch_count:number =0;

  public handleError(error:any)
  {
    console.log(error);
  }

get_touch_limit()
{
  this.Jarwis.get_practice_stats().subscribe(
    data => this.set_touch_limit(data),
    error => this.handleError(error)
    );
}

set_touch_limit(data:any)
{
  let prac_data=data.data;
this.touch_count=prac_data.touch_limit;
  this.touch_limit.next(this.touch_count)
}

fetch_touch_limit(): Observable<any> {
  return this.touch_limit.asObservable();
}

manual_touch_limit()
{
  return this.touch_count;
}


private deadline_claims = new Subject<any>();
notifications:any;
//Work Order Functions

  getuser_Id(){
    // return localStorage.getItem('id');
    // console.log("User id",this.user_det.getId())
    let id=this.user_det.getId();
if(localStorage.getItem('role') != 'Admin' && localStorage.getItem('practice_id') )
{
  if(id != undefined)
  {
    this.Jarwis.get_work_order_details(id).subscribe(
      data => this.set_wo_note(data),
      error => this.handleError(error)
      );
  }
}
 
  }

  set_wo_note(data:any)
  {

    this.notifications=data;
    this.deadline_claims.next(data)
  //console.log("Notifications",this.notifications,this.deadline_claims)
  }

  get_notify_data(): Observable<any> {
    return this.deadline_claims.asObservable();
  }
manual_notify()
{
  return this.notifications;
}



//   get_notify_data(data)
//   {
//     console.log(data.data);
// return data.data;
//   }

}
