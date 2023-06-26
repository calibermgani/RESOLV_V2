import { Component} from '@angular/core';
import { AuthService } from './Services/auth.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontend';
  isLoading:boolean = true;

  loggedIn :any;
  waitingForeground: any;

  constructor(private Auth:AuthService){
  this.Auth.authStatus.subscribe(value => this.loggedIn = value);
  // this.new_auth._loggedIn.subscribe(value => this.loggedIn = value);
  console.log('loggin',this.loggedIn);
  let data = localStorage.getItem('token');
  this.Auth.tokenValue.next(true);
  // this.Auth.login(data);
  }

}
