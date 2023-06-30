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
    if (this.newPassword !== this.confirmPassword) {
      console.log("New password and confirm password do not match.");
      return;
    }

    if (!this.isPasswordStrong(this.newPassword)) {
      console.log("Password is not strong enough.");
      return;
    }


  }

  isPasswordStrong(password: string): boolean {

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    return passwordRegex.test(password);
  }

}
