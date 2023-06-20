import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/Services/auth.service';

@Component({
  selector: 'app-medcubics-integ',
  templateUrl: './medcubics-integ.component.html',
  styleUrls: ['./medcubics-integ.component.css']
})
export class MedcubicsIntegComponent implements OnInit {

  constructor(private auth : AuthService) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    console.log('LAST IN MEDCUBIS COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

}
