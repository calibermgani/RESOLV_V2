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
  resetPassword(): void {}

  ngOnInit(): void {
    this.Auth.PracticelogIn.next(true);
  }
  ngAfterViewInit(): void {
    let data = localStorage.getItem('token');
    this.Auth.login(data);
  }
}
