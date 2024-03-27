import { Component, OnInit, Renderer2 } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { TokenService } from '../../Services/token.service';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/auth.service';
import { SetUserService } from '../../Services/set-user.service';
import {HttpClient} from '@angular/common/http';
import { ToastrManager } from 'ng6-toastr-notifications';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public form = {
    user_name: null,
    password:null
  };

  usernameInputTouched:boolean = false;
  userpasswordInputTouched:boolean = false;

  public error = null;

  constructor(
    private Jarwis: JarwisService,
    private Token: TokenService,
    private router: Router,
    private auth: AuthService,
    private setus: SetUserService,
    private http: HttpClient,
    public toastr: ToastrManager,
  ) { }

  onSubmit() {
    this.Jarwis.login(this.form).subscribe(
      data => this.handleResponse(data),
      error => this.handleError(error)
    );
  }
  handleResponse(data:any){
    //console.log(data);
    this.Token.handle(data.access_token);
    //  localStorage.setItem('role_id',data.user.role_id);
    // this.setus.setId(data.user.id,data.user.firstname,data.role[0],data.user.role_id);
    this.setus.setId(data.user.id,data.user.firstname);
    this.auth.changeAuthStatus(true);
    if(data.role == 'Admin')
    {
      localStorage.setItem('role',data.role);
      this.router.navigateByUrl('/dashboard');
      // this.auth.practicePermission();
      this.setus.set_type(data.role);
    }
    else{
      this.router.navigateByUrl('/practiceList');
    }
    //console.log("Dat Per",data.permission);
    // this.setus.set_type(data.permission);
  }

  handleError(error:any){
    // console.log('error',error);

    // this.error = error.error.error;
    this.toastr.errorToastr( 'Please Check Username and Password','Login Error') ;
  }

  checkip()
  {
    // console.log(this.form.user_name);
    this.http.get<{ip:string}>('https://jsonip.com')
    .subscribe( data => {
      // console.log('th data', data);

    })
  }
  ngOnInit() {
    this.auth.tokenValue.next(true);
  }
  ngAfterViewInit() {
    console.log('LAST IN LOGIN COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

  // ngOnDestroy(){
  //   if (this.dynamicStylesheet) {
  //     document.head.removeChild(this.dynamicStylesheet);
  //   }
  // }
}
