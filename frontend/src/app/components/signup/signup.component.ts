import { Component, OnInit } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { TokenService } from '../../Services/token.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  public form = {
    email: null, 
    password:null,
    repassword:null
  };

    public error = null;

  constructor(  private Jarwis: JarwisService,
    private Token: TokenService,
    private router: Router
    ) { 
  }

onSubmit() { 
    this.Jarwis.register(this.form,0).subscribe(
      data => this.handleResponse(data),
      error => this.handleError(error)
    );

  }

handleResponse(data){

    this.router.navigateByUrl('/login');

  }

onBlur()
{

	 this.Jarwis.validatemail(this.form).subscribe(
    
      message=> this.handleMessages(message),
      error => this.handleError(error)
    );
}

handleResponses(data){
    this.Token.handle(data.access_token); 
  }
handleMessages(data){
this.error="";
}

  handleError(error){
    this.error = error.error.error;
  }

checkPolicy: boolean = true;

onKeydown()
{
	if(this.form.password==this.form.repassword)
	{
this.error="";
  this.checkPolicy = true;
	}
	else
	{
	this.error="Passwords Mismatch";
	  this.checkPolicy = false;
	  
	}
}
  ngOnInit() {
  }

}
