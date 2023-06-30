import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
import { AuthService } from '../../Services/auth.service';
@Component({
  selector: 'app-practice-list',
  templateUrl: './practice-list.component.html',
  styleUrls: ['./practice-list.component.css']
})
export class PracticeListComponent implements OnInit {

  constructor(private setus: SetUserService,
    private Jarwis: JarwisService,
    private Auth:AuthService,private router : Router) { }

  user_name:any;
  practice_list:any;

  public handleError(error:any)
  {
    console.log(error);
  }

  get_practices()
  {
    this.Jarwis.getPractices(this.setus.getId()).subscribe(
      (data:any) => this.list_practice(data),
      error => this.handleError(error)
    );

  }

  list_practice(data: any)
  {
    //console.log(data);


    this.practice_list=data.data;

  }

  selectPractice(Practice_id: any)
  {
    this.Jarwis.selectPractice(Practice_id,this.setus.getId()).subscribe(
      data => this.set_practice(data),
      error => this.handleError(error)
    );
  }

  set_practice(data: any)
  {
    console.log('data',data);
    this.setus.setPractice(data);
    // this.Auth.practicePermission();
    this.router.navigate(["/dashboard"]);
  }


  ngOnInit() {
    // this.Auth.reset();
    // this.Auth.tokenValue.next(false);
    this.user_name=this.setus.getname();
    this.get_practices();

  }
  ngAfterViewInit() {

    console.log('LAST IN PRACTICELIST COMP');

    // this.Auth.tokenValue.next(true);
    if(this.Auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.Auth.login(data);}

    // if(this.router.url =='/practiceList/dashboard')
    // {
    //   this.router.navigate(["/dashboard"]);
    // }
  }

}
