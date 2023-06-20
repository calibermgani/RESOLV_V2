import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LazyCARoutingModule } from './lazy-ca-routing.module';
import { ClientAssistanceComponent } from '../components/client-assistance/client-assistance.component';
import { CommonModuleModule } from '../common-module/common-module.module';
@NgModule({
  imports: [
    CommonModule,
    LazyCARoutingModule,
    CommonModuleModule,
    // SidebarModule.forRoot(),
    // NgxDaterangepickerMd
  ],
  declarations: [ClientAssistanceComponent]
})
export class LazyCAModule { }
