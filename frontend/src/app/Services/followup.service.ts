import { Injectable, Output , EventEmitter } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FollowupService {
  @Output() change: EventEmitter<any> = new EventEmitter();
  reset: EventEmitter<any> = new EventEmitter();

    private followup_assign = new Subject<any>();
  constructor() { 

  }
  public click:string[] = [];
    public reassign:string[] = [];
 public setvalue(value:any)
 { console.log(value);
   this.click=value;
   this.change.emit(this.click);
   }
   
 public refresh(claim:any)
 {
   this.click=claim;
   this.reset.emit( this.click);
   }

 public getvalue()
 {
   return this.click; 
   }
  //  public getfollowup(reassign){
  //    this.followup_assign.next(reassign);
  //    console.log(reassign);
  //  }
}
