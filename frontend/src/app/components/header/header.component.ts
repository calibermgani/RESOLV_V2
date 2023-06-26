import { Component, OnInit,ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../Services/auth.service';
import { Router } from '@angular/router';
import { TokenService } from '../../Services/token.service';
import { LoadingBarService } from '@ngx-loading-bar/core';
import { SetUserService } from '../../Services/set-user.service';
import { Subscription } from 'rxjs';
import { NotifyService } from '../../Services/notify.service';
import {NgbModal, ModalDismissReasons,NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { JarwisService } from '../../Services/jarwis.service';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit  {
  observalble: Subscription;
  subscibe:Subscription;
  subscription!: Subscription;
  subscription1 !: Subscription;
  public loggedIn !:boolean;
  public practiceLogIn !:boolean;
  public user :any;
  public user_type : any[] =[];
  public user_role !: any;
  public touch_count!:number;
  @ViewChild('confirm_modal') mymodal!: ElementRef;
  public practice_name:any;

  constructor(
    private Auth:AuthService,
    private router: Router,
    private Token: TokenService,
    private loadingBar: LoadingBarService,
    private setus: SetUserService,
    private notify_service:NotifyService,
    private modalService: NgbModal,
    private cd: ChangeDetectorRef,
    private Jarwis: JarwisService,
  ) {
    this.observalble=this.setus.update_role().subscribe(message => {this.user_type = message, this.update_user_role()} );

    this.subscibe=this.notify_service.get_notify_data().subscribe( (message:any) => {  this.notify_data = message,

      this.process_notify()

  });
  }
update_user_role()
{
  this.user=this.setus.getname();
    this.user_role=this.setus.get_role();

}

  open(content: any)
{
  if(this.modalService.hasOpenModals() == false)
  {
  this.modalService.open(content, { centered: true ,windowClass:'alert-class'});
}
}



  logout(event: MouseEvent){
    event.preventDefault();
    this.Token.remove();
    localStorage.clear();
    this.Auth.changeAuthStatus(false);
     this.changePractice();   // added..
    this.router.navigateByUrl('/login');
    this.subscibe.unsubscribe();
    // this.Auth.tokenValue.unsubscribe();
  }


  notify_data:any;

  process_notify()
  {
   if(this.notify_data == undefined)
    {
      this.notify_data=this.notify_service.manual_notify();


    }
    // console.log("note data",this.notify_data,this.loggedIn);

    if(this.notify_data != undefined && this.loggedIn == true)
    {
      // console.log(this.mymodal)
      // this.open(this.mymodal);
    }



  }


  monitor_change()
  {
    // console.log("Hit!!!",data)
  }

  changePractice()
  {
    this.practice_name = '';
    localStorage.removeItem('prac_storage');
    this.Auth.changePractice();
    this.router.navigateByUrl('/practiceList');
  }


  ngOnInit() {
    this.Auth.authStatus.subscribe(value => this.loggedIn = value);
    console.log('Updated loggedIn',this.loggedIn);

    this.Auth.practiceStatus.subscribe(value => this.practiceLogIn = value);
    console.log('updated practiceLogIn',this.practiceLogIn);

    this.loadingBar.start();
    // this.notify_service.getuser_Id();

    this.setus.get_prname();
    this.subscription1 = this.setus.pracname.subscribe(data => {
      console.log(data),
      this.practice_name = data;
    });
    //this.getpracname();
    // this.setus.change.subscribe(value => this.user_type = value,this.update_user_role());
    this.update_user_role();
    this.subscription=this.notify_service.fetch_touch_limit().subscribe((message:any) => {
    this.touch_count = message });

    console.log('practice_name', this.practice_name);
  }

  public alertValue(){

    this.Jarwis.getAlertNotification(this.setus.getId()).subscribe(
      data  => this.handleResponse(data),
      error => this.handleError(error)
    );

    // this.Jarwis.getAlertNotification(this.setus.getId()).subscribe(
    //   data  => this.handleResponse(data),
    //   error => this.handleError(error)
    // );
  }

  client_assistance_count: any;
  pending_claim_count: any;
  touch_counts: any;

  public handleResponse(data:any){
    console.log(data.client_assistance_count);

    this.client_assistance_count = data.client_assistance_count;
    this.pending_claim_count = data.pending_claim_count;
    this.touch_counts = data.touch_count;

  }

  public handleError(error:any){

  }

  ngOnDestroy(){
    if (this.subscription1){
      this.subscription1.unsubscribe;
    }
  }



}
