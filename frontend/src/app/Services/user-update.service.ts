import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserUpdateService {
  private user = new Subject<any>();
  constructor() { }
private test=<any>[];

   selected_user(data:any)
{
  this.test=data;
   this.user.next(data);
}

get_user_det(): Observable<any> {
  return this.user.asObservable();
}
}
