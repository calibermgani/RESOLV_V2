import { Injectable } from '@angular/core';
import { NgxUiLoaderConfig, NgxUiLoaderService } from 'ngx-ui-loader';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  config!: NgxUiLoaderConfig;

  constructor(private ngxUiLoaderService: NgxUiLoaderService) {
    // this.ngxUiLoaderService.start();
   }
}
