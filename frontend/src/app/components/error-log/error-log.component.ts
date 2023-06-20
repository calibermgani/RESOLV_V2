import { Component, OnInit } from '@angular/core';
import { JarwisService } from '../../Services/jarwis.service';
import { AuthService } from 'src/app/Services/auth.service';
@Component({
  selector: 'app-error-log',
  templateUrl: './error-log.component.html',
  styleUrls: ['./error-log.component.css']
})
export class ErrorLogComponent implements OnInit {

  constructor(
    private Jarwis: JarwisService,private auth :AuthService
  ) { }

  logs_list:any;
  public handleError(error:any)
  {
    console.log(error);
  }

public getLogs()
  {
    this.Jarwis.get_logs().subscribe(
      data => this.list_logs(data),
      error => this.handleError(error)
    );

  }

  list_logs(data:any)
  {
    //console.log(data);
    this.logs_list=data.data;
  }

  viewLog(fileName:any)
  {
    this.Jarwis.viewLog(fileName).subscribe(
      data => this.display_log(data),
      error => this.handleError(error)
    );
  }

  logInfo:string = '';
  display_log(data:any)
  {
    this.logInfo=data.data;
  }


  ngOnInit() {
    this.getLogs();
  }
  ngAfterViewInit() {
    console.log('LAST IN ERRORLOG COMP');

    // this.auth.tokenValue.next(true);
    if(this.auth.tokenValue.value == true)
    {let data = localStorage.getItem('token');
    this.auth.login(data);}
  }

}
