import { HostListener, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, NavigationStart, } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private myRoute: Router,@Inject(PLATFORM_ID) private platformId: object) { }
  public str: string = '';
  public maan = null;
  public man = null;
  public goos = null;
  public result(value: any, value2: any) {
    if (value.message == value2.token) {
      this.str = "True";
      return true;
    }
    else {
      this.str = "False";
      return false;
    }
  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean  {
    let data = localStorage.getItem('token');
    // if(this.myRoute.url == '/login')
    // {
    //   this.auth.tokenValue.next(true);
    // }
    // else
    // {this.auth.tokenValue.next(false);}

    // this.auth.login(data);  // removed..
    // if (isPlatformBrowser(this.platformId)) {
    //   console.log('Application reloaded');
    //   // Perform additional actions as needed
    //   this.auth.tokenValue.next(true);
    //   this.auth.login(data);
    // }

    console.log("Auth", this.auth.loggedIn.value);

    // setTimeout(() => {
      if (this.auth.loggedIn.value && this.auth.tokenValue.value == true  ) {
        let newData = localStorage.getItem('token');
        console.log('localStorage Token',newData);
        // this.auth.tokenValue.next(false);
        return true;
      } else {
        this.myRoute.navigate(["login"]);
        return false;
      }
    // }, 4000);

  }
}
