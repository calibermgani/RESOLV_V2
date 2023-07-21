import { Component, AfterViewInit, Renderer2 } from '@angular/core';
import { AuthService } from './Services/auth.service';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import { Keepalive } from '@ng-idle/keepalive';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TokenService } from './Services/token.service';
import { Subscription, filter } from 'rxjs';
import { ToastrManager } from 'ng6-toastr-notifications';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'frontend';
  isLoading: boolean = true;

  loggedIn: any;
  waitingForeground: any;
  subscibe!: Subscription;
  URL :any

  constructor(private Auth: AuthService, private idle: Idle, private keepalive: Keepalive, private route: Router,private activated_route:ActivatedRoute, private Token: TokenService, public toastr: ToastrManager,private renderer: Renderer2) {
    this.Auth.authStatus.subscribe(value => this.loggedIn = value);
    // this.new_auth._loggedIn.subscribe(value => this.loggedIn = value);
    console.log('loggin', this.loggedIn);
    let data = localStorage.getItem('token');
    this.Auth.tokenValue.next(true);
    // this.Auth.login(data);

    this.route.events.pipe(
      filter((event:any) => event instanceof NavigationEnd)
  ).subscribe((event: NavigationEnd) => {
    console.log('ROuting Event',event.url);
    this.URL = event.url;
    if (this.URL == '/login') {
      this.idle.stop();
    }
  });

  // sets an idle timeout of 30 seconds, for testing purposes.

  // sets a timeout period of 5 seconds. after 10 seconds of inactivity, the user will be considered timed out.
  this.idle.setTimeout(5);
  // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
  this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

  this.idle.onTimeout.subscribe(() => {
    this.Token.remove();
    localStorage.clear();
    this.Auth.changeAuthStatus(false);
    this.Auth.changePractice();
    this.route.navigateByUrl('/login');
    // this.subscibe.unsubscribe();
  });
  this.idle.onTimeoutWarning.subscribe((countdown) => {
    // this.toastr.errorToastr('You will time out in ' + countdown + ' seconds!')
    console.log('Due to Idle error in app component')
    if(countdown<=1 ){
      this.toastr.infoToastr('You have logged out because of inactivity!','',{
        toastTimeout:10000,
      });
    }
  });


  // sets the ping interval to 15 seconds
  this.keepalive.interval(15);
  }
  private dynamicStylesheet: HTMLLinkElement | null = null;
  ngOnInit(){
    // this.dynamicStylesheet = document.createElement('link');
    // this.dynamicStylesheet.rel = 'stylesheet';
    // this.dynamicStylesheet.type = 'text/css';
    // this.dynamicStylesheet.href = '/assets/bower_components/bootstrap/dist/css/bootstrap.min.css';
    // document.head.appendChild(this.dynamicStylesheet);
  }

  ngAfterViewInit(): void {
  }



}
