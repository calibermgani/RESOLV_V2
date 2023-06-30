import { Component } from '@angular/core';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  resetPassword(){
    if(this.newPassword == this.confirmPassword){
      console.log('Password correct')
    }else{
      console.log('Check Your New and Confirm Password')
    }
  }
}
