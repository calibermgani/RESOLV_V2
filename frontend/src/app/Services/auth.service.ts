import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, of  } from 'rxjs';
import { TokenService } from './token.service';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {  map } from 'rxjs/operators';
import { SetUserService } from './set-user.service';
import { environment } from 'src/environments/environment';
import { AuthGuard } from './auth-guard.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import { ToastrManager } from 'ng6-toastr-notifications';
import { Keepalive } from '@ng-idle/keepalive';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public loggedIn = new BehaviorSubject<boolean>(this.Token.loggedIn());
  public tokenValue = new BehaviorSubject<boolean>(false);
  public PracticelogIn = new BehaviorSubject<boolean>(false);
  authStatus = this.loggedIn.asObservable();

  constructor(private Token: TokenService,private http: HttpClient,private myRoute: Router, private set_us :SetUserService,public loader: NgxUiLoaderService,private idle: Idle,public toastr: ToastrManager,private keepalive: Keepalive) { }
  practiceStatus = this.PracticelogIn.asObservable();

  public validate = new BehaviorSubject<boolean>(this.Token.isValid());
  //private url: string = 'http://localhost:8000/api';
  private url = `${environment.apiUrl}`;
  //private url = 'http://127.0.0.1:8000/api';
  // private url: string =  'http://35.226.72.203/avecarm/backend/public/index.php/api';

  reset() {
    this.idle.watch();
  }

    public errorhandler(data:any)
    {
      console.log('INNNNNNNNNNNNNNNNNNNNNN',data);
      // if(data.status)
      // {
      //   console.log('Token Error');
      //   }
      this.idle.stop();
    this.Token.remove();
    localStorage.clear();
     this.changePractice();   // added..
        this.changeAuthStatus(false); // removed
    }

  public login(user:any) {
    if(this.myRoute.url !='/login'){this.idle.watch();}
    // debugger
    let user_id=this.set_us.getId();

    user={token:user,id:user_id};

    console.log('old token',user?.token);
    console.log('USER ID',user?.id);

    // console.log("Before",user);
    // console.log("Before",this.authStatus);

    // setTimeout(()=>{
      console.log('tokenSubject.value',this.tokenValue.value);
      if(user_id!=null && this.tokenValue.value == true)
    {
      this.tokenValue.next(false);
      let response = this.http.post(`${this.url}/checktoken`, user).pipe(map(response => response))
      .subscribe({
          next : (message:any) => {
            // // sets an idle timeout of 30 seconds, for testing purposes.
            console.log('Expire Time',message.expires_in);
            this.idle.setIdle(message.expires_in);
            // // sets a timeout period of 5 seconds. after 10 seconds of inactivity, the user will be considered timed out.
            // this.idle.setTimeout(5);
            console.log('Running',this.idle.isRunning());
            console.log('New Token',message.access_token);

           this.afterUserLog(message);this.changeAuthStatus(true);
          },
          error:(error)=> this.errorhandler(error)
        });
    //   .subscribe(
    //     (message:any) => {
    //       // let parsed_data = JSON.parse(message);
    //       console.log('New Token',message.access_token);
    //       if(user?.token != message.access_token)
    //             {
    //             this.tokenValue.next(true);
    //             }
    //             else
    //             {
    //               this.tokenValue.next(false);
    //               // this.login();
    //             };this.afterUserLog(message);this.changeAuthStatus(true);},
    //     error => this.errorhandler(error)
    //  );

    }
    else{
      this.errorhandler('nulluser');
    }
    // },3000)




  }
  // public login(user: any) {
  //   let user_id = this.set_us.getId();

  //   user = { token: user, id: user_id };

  //   // console.log("Before",user);
  //   // console.log("Before",this.authStatus);
  //   if (user_id != null) {
  //  this.http.post(`${this.url}/checktoken`, user).pipe(map(response => response))
  //       .subscribe((message: any) => {
  //         console.log('Message', message);
  //         let x = localStorage.getItem('token');
  //         console.log('Alreday token', x);
  //         // if(x!=message)
  //         // {
  //         this.afterUserLog(message);
  //         this.changeAuthStatus(true);
  //         // }

  //         if(message.message='The token has been blacklisted')
  //         this.errorhandler(Error)
  //       });

  //   }
  //   else {
  //     this.errorhandler('nulluser');
  //   }
  // }




  afterUserLog(message:any)
  {
    console.log('Token Important shsdks',message)
    this.Token.set(message.access_token);
    let newData = localStorage.getItem('token');
    // console.log('newdasdas',newData);

    // if(newData === message.access_token)
    //         {
    //           // console.log('inansas');

    //         this.tokenValue.next(true);
    //         }
    //         else
    //         {
    //           this.tokenValue.next(false);
    //           // this.login();
    //         }
    // let newVal = this.myRoute.url.replace(/[^\w\s]/gi, '')
    // // let permission=message['permission'];
    // if(permission.includes(newVal))
    // {
    // this.Token.set(message['message']);
    // this.set_us.set_type(message['permission']);
    // this.set_us.set_edit_type(message['edit_permission']);
    // }
    // else{
    //   this.Token.set(message['message']);
    //   this.myRoute.navigate(["dashboard"]);
    //   this.set_us.dashboard_warning('No Access to the Page');

    // }

    // this.set_us.set_type(null);
    // this.set_us.set_edit_type(null);

    console.log('authStatus',this.authStatus);
    console.log('loggedIn',this.loggedIn);
    console.log('loggedIn.value',this.loggedIn.value);
    if(this.myRoute.url == '/practiceList')
    {
      console.log('token Value',this.tokenValue.value);

  this.tokenValue.next(true);

  console.log('token Value Updated',this.tokenValue.value);
    }

    if (this.loggedIn.value === true){
      console.log("already logged");
      this.loggedIn.next(true);
    }

    // if ( this.set_us.set_type(null);
    // this.set_us.set_edit_type(null);)

    if(localStorage.getItem('practice_id'))
    {
      this.practicePermission();   // removed
    }
    else if(localStorage.getItem('role'))
    {
      this.practicePermission();  // removed
    }

    if(!this.loggedIn.value)
    {
      this.errorhandler('error');
    }
  }





  practicePermission():any
  {
      console.log("all ok");
      let practice=localStorage.getItem('practice_id');
      let role=localStorage.getItem('role');
      console.log('ROLE',role);


      if(practice != null)
      {
        let user_id=this.set_us.getId();

        let user={id:user_id,practice_id:practice};
        console.log('User',user);
        return this.http.post(`${this.url}/getPermissions`, user).pipe(map(response => response))
        .subscribe(
            message => this.after_check(message),
            error => this.errorhandler(error)
         );

        //  return this.http.post(`${this.url}/getPermissions`,user).pipe(map(response => response)).subscribe((data:any) => {
        //   this.after_check(data);
        //   this.errorhandler(Error);
        //  })
      }
      else if(role == 'Admin')
      {
        let user_id=this.set_us.getId();

        let user={id:user_id,user_role:role};
        // console.log("In Hrar",user);
        return this.http.post(`${this.url}/getPermissions`, user).pipe(map(response => response))
        .subscribe(
            message => this.after_check(message),
            error => this.errorhandler(error)
         );
        //  return this.http.post(`${this.url}/getPermissions`,user).pipe(map(response => response)).subscribe((data:any) => {
        //   this.after_check(data);
        //   this.errorhandler(Error);
        //  })
      }


  }

  authPractice(status:boolean)
  {
    if(status==false)
    {
      localStorage.removeItem('practice_id');
      localStorage.removeItem('role_id');
      localStorage.removeItem('pr_name');
      localStorage.removeItem('prac_storage');
      this.myRoute.navigate(["practiceList"]);
    }
  }


  changePractice()
  {
    localStorage.removeItem('practice_id');
    localStorage.removeItem('role_id');
    localStorage.removeItem('pr_name');
    localStorage.removeItem('prac_storage');
    window.localStorage.removeItem('pr_name');
    this.set_us.set_type(null);
    this.set_us.set_edit_type(null);
      this.PracticelogIn.next(false);
  }





  public after_check(message:any)
  {
   console.log("AC",message);

    let newVal = this.myRoute.url.replace(/[^\w\s]/gi, '');
    let permission=message['permission'];
    console.log('newVal , Premission::::::::::',newVal,permission);

    if(permission.includes(newVal))
    {
      console.log('1');
      console.log(newVal);
    // this.Token.set(message['message']);
    this.set_us.set_type(message['permission']);
    this.set_us.set_edit_type(message['edit_permission']);
    // this.myRoute.navigate(["dashboard"]);
    // this.PracticelogIn.next(true);
    if(this.myRoute.url != '/practiceList'){this.PracticelogIn.next(true)};
    // console.log(this.PracticelogIn.value);
    }
    else if(newVal == 'practiceListdashboard' || localStorage.getItem('role') =='Admin' )
    {
      console.log('2');
      console.log("admin");
      this.set_us.set_type(message['permission']);
      this.set_us.set_edit_type(message['edit_permission']);
      this.myRoute.navigate(["/dashboard"]);      //edited..

      // if(localStorage.getItem('role') !='Admin' )
      // {
      //   this.myRoute.navigate(["/dashboard"]);
      // }
      // this.myRoute.navigateByUrl('/dashboard');
      //this.myRoute.navigate([this.myRoute.url]);
      this.PracticelogIn.next(true);
    }
    else{
      console.log("nothing");
      // this.Token.set(message['message']);
      this.set_us.set_type(null);
    this.set_us.set_edit_type(null);
    this.PracticelogIn.next(false);
    this.myRoute.navigate(["practiceList"]);
      this.set_us.dashboard_warning('No Access to the Page');

    }

    if(!this.loggedIn.value)
    {
      this.errorhandler('error');
    }
    console.log('token Value',this.tokenValue.value);

    this.tokenValue.next(true);

    console.log('token Value Updated',this.tokenValue.value);
  }

  changeAuthStatus(value:boolean){
   // console.log('called',value);
    if(value==false)
    {
      this.myRoute.navigate(["login"]);
      // localStorage.clear();

    }
    console.log('login Value',this.loggedIn.value);
    this.loggedIn.next(value);
  }


}
