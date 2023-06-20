import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyClaimOpFooterRoutingModule } from './lazy-claim-op-footer-routing.module';
import { CommonModuleModule } from '../common-module/common-module.module';
import { SidebarModule } from 'ng-sidebar';
import * as moment from 'moment';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ClaimOpFooterComponent } from '../components/claim-op-footer/claim-op-footer.component';

@NgModule({
  imports: [
    CommonModule,
    LazyClaimOpFooterRoutingModule,
    CommonModuleModule,
    SidebarModule.forRoot(),
    NgxDaterangepickerMd
  ],
  declarations: []
})
export class LazyClaimOpFooterModule {

  constructor(){ }


 }


