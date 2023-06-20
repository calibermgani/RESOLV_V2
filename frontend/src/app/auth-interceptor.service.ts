import { LoaderService } from './Services/loader.service';
import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { TokenService } from './Services/token.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {

  constructor(private token: TokenService,private loader : NgxUiLoaderService) {

  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // debugger;
   const id = localStorage.getItem('token');
  //  this.loader.start();
  //  this.loader.config.
    // if (id) {
      req = req.clone({
        headers: req.headers.set("Authorization", "Bearer " + id),
      });
      return next.handle(req).pipe(
        // finalize(()=> this.loader.stop())
      );
    // }
    // else{
    //   return next.handle(req);
    // }
  }
}

// export const AuthInterceptorprovider = {
//   provide: HTTP_INTERCEPTORS,
//   useClass: AuthInterceptorService,
//   multi: true
// }


