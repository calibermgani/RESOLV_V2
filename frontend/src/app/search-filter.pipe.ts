import { Pipe, PipeTransform } from '@angular/core';
import { JarwisService } from './Services/jarwis.service';
// import { transformAll } from '@angular/compiler/src/render3/r3_ast';
@Pipe({ name: 'SearchFilter' })
export class SearchFilter implements PipeTransform {

    constructor(private Jarwis: JarwisService) {

    }
public results:any;
  transform( items: any, filter: any, defaultFilter: boolean) {
      let access:Boolean=false;
 

    //   console.log("Search data", items,"filter",filter,"df",defaultFilter);
      if (!filter || filter.name == undefined || filter.name == ''){
          console.log('returning...')
        access = true;
        console.log(items);
          return items;
     
      }
  
      if (!Array.isArray(items)){
        console.log('returning ITS...')
        access = true;
        return items;
     
      }
    
      
      if(access==false)
      {
          
console.log("Search:",filter.name);

// this.Jarwis.get_table_page(filter.name,1,15).subscribe(
//     data  => this.results=data['data'],
//     error => console.log(error)  
//     ); 
// let op=this.get_details(filter.name);
// console.log("check Hewer",op);
      }

  }

//  get_details(name)
// {
//     let x:any;
//    this.Jarwis.get_table_page(name,1,15).subscribe(
//         data  => {x= data},
//         error => console.log(error)
//         ); 
// console.log("check here",x);
// }

}