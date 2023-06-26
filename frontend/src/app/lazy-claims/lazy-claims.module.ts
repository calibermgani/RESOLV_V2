import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyClaimsRoutingModule } from './lazy-claims-routing.module';
import { ClaimsComponent } from '../components/claims/claims.component';
import { CommonModuleModule } from '../common-module/common-module.module';
import { SidebarModule } from 'ng-sidebar';
import {  AgGridModule } from 'ag-grid-angular';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  ],
  declarations: [ClaimsComponent]
})
export class LazyClaimsModule {}


