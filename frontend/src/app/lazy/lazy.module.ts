import { NgModule } from '@angular/core';
import { LazyRoutingModule } from './lazy-routing.module';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { PracticeComponent } from '../components/practice/practice.component';
import { DocumentsComponent } from '../components/documents/documents.component';
import { CommonModuleModule } from '../common-module/common-module.module';
import { SidebarModule } from 'ng-sidebar';
import { ReportService } from '../Services/report.service';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { FusionChartsModule } from 'angular-fusioncharts';
import * as FusionCharts from 'fusioncharts';
import * as Charts from 'fusioncharts/fusioncharts.charts';
// Load fusion theme
import * as FusionTheme from 'fusioncharts/themes/fusioncharts.theme.fusion';
FusionChartsModule.fcRoot(FusionCharts, Charts, FusionTheme)


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    LazyRoutingModule,
    CommonModuleModule,
    SidebarModule.forRoot(),
    Ng2SearchPipeModule,
    AgGridModule,
    FusionChartsModule
  ],
  declarations: [DashboardComponent,
    PracticeComponent,
    DocumentsComponent
  ],
    providers:[ReportService]
})
export class LazyModule { }
