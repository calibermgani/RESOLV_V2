import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyClaimsRoutingModule } from './lazy-claims-routing.module';
import { ClaimsComponent } from '../components/claims/claims.component';
import { CommonModuleModule } from '../common-module/common-module.module';
import { SidebarModule } from 'ng-sidebar';
import {  AgGridModule } from 'ag-grid-angular';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxUiLoaderConfig, NgxUiLoaderModule, NgxUiLoaderRouterModule, POSITION, SPINNER } from 'ngx-ui-loader';

// const ngxUiLoaderConfig: NgxUiLoaderConfig = {
//   // bgsColor: '#OOACC1',
//   // bgsOpacity: 20,
//   // bgsPosition: POSITION.centerCenter,
//   // bgsSize: 60,
//   // bgsType: SPINNER.threeStrings,
//   fgsColor: '#00ACC1',
//   fgsPosition: POSITION.centerCenter,
//   fgsSize: 60,
//   fgsType: SPINNER.threeStrings,
//   // pbColor: '#00ACC1',
//   // pbDirection: PB_DIRECTION.leftToRight,
//   // pbThickness: 5,
// };

@NgModule({
  imports: [
    CommonModule,
    LazyClaimsRoutingModule,
    CommonModuleModule,
    SidebarModule.forRoot(),
    AgGridModule,
    // NgxDaterangepickerMd,
    FormsModule,
    ReactiveFormsModule,
    // NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    // NgxUiLoaderRouterModule,

  ],
  declarations: [ClaimsComponent]
})
export class LazyClaimsModule {}


