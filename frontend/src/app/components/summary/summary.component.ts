import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SetUserService } from '../../Services/set-user.service';
import { JarwisService } from '../../Services/jarwis.service';
@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {

  constructor(    private Jarwis: JarwisService,
    private setus: SetUserService,
    public router: Router,) { }


    public handleError(error:any)
    {
      console.log(error);
    }

  get_summary_details(type:any)
  {

    if(this.router.url == '/followup' || this.router.url == '/audit' || this.router.url == '/rcm')
    {

		this.Jarwis.get_summary_details(this.setus.getId()).subscribe(
			data  => this.set_summary_details(data),
			error => this.handleError(error)
			);
    }
  }
work_status:any=[];

set_summary_details(data:any)
{
	console.log(data);
  if(data ==null)
  {
    this.work_status['assigned']= 0;
    this.work_status['worked']=0;
    this.work_status['pending']=0;
    this.work_status['followup']=0;
    this.work_status['auditclaims']=0;
    this.work_status['3touches']=0;
  }
  else{
    this.work_status=data;
  }

//console.log(this.work_status);
}
  ngOnInit() {
      this.get_summary_details('followup');

  }

}
