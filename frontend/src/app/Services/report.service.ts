import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ReportService {
  public id:number = 0;
   //private api = "http://127.0.0.1:8000/api";
   private api = `${environment.apiUrl}`;
   
  //private api = 'http://35.226.72.203/avecarm/backend/public/index.php/api';
  constructor(private http: HttpClient) { }

  

  public getdata(id:any) {
    id = localStorage.getItem('practice_id');
    return this.http.get(`${this.api}/dashboard?practice_dbid=`+id);
    
  }
}
