import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from '../Services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent  implements OnInit,AfterViewInit{
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private Auth : AuthService){}
  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      console.log("New password and confirm password do not match.");
      return;
    }

    if (!this.isPasswordStrong(this.newPassword)) {
      console.log("Password is not strong enough.");
      return;
    }
  }

  ngOnInit(): void {
    this.Auth.PracticelogIn.next(true);
  }
  ngAfterViewInit(): void {
    let data = localStorage.getItem('token');
    this.Auth.login(data);
  }



  isPasswordStrong(password: string): boolean {

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    return passwordRegex.test(password);
  }

}
