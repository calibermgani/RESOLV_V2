import { NgModule,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TooltipModule} from 'ng2-tooltip-directive';
import { DatePipe } from '@angular/common'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
// import {NgbDateAdapter, NgbDateStruct, NgbDateNativeAdapter,NgbDateParserFormatter} from '@ng-bootstrap/ng-bootstrap';
// import { NgbDateCustomParserFormatter} from '../date_file';
// import { FusionChartsModule } from 'angular-fusioncharts';
// import * as FusionCharts from 'fusioncharts';
// import * as Charts from 'fusioncharts/fusioncharts.charts';
// import * as FusionTheme from 'fusioncharts/themes/fusioncharts.theme.fusion';
// import * as TimeSeries from 'fusioncharts/fusioncharts.timeseries';
// import * as PowerCharts from 'fusioncharts/fusioncharts.powercharts';
// import * as Widgets from 'fusioncharts/fusioncharts.widgets';
// import * as overlappedcolumn2d from 'fusioncharts/fusioncharts.overlappedcolumn2d';
import { NotifyService } from '../Services/notify.service';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import {AtomSpinnerModule} from 'angular-epic-spinners';
// import { NgKnifeModule } from 'ng-knife';
// import { SearchFilter } from '../search-filter.pipe';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
// import { ModelBasicComponent } from '../model-basic/model-basic.component';
// import { GooglePlaceModule } from "ngx-google-places-autocomplete";
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { LoadingBarModule } from '@ngx-loading-bar/core';
// import { LoadingBarHttpModule } from '@ngx-loading-bar/http';
// import { HttpModule } from '@angular/http';
import { NgxPaginationModule } from 'ngx-pagination';
// import { JarwisService } from '../Services/jarwis.service';
import { DatepickerModule } from 'ng2-datepicker';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
// import { NgxPrintModule } from 'ngx-print';

// import { NavbarComponent } from '../components/navbar/navbar.component';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { JarwisService } from '../Services/jarwis.service';
import { ToastrModule } from 'ng6-toastr-notifications';
import { RouterModule } from '@angular/router';
// import { FollowupTemplateComponent } from '../components/followup-template/followup-template.component';
// import { FollowupViewComponent } from '../components/followup-view/followup-view.component';
// import { ClientNotesComponent } from '../components/client-notes/client-notes.component';
// import { NotifyPopupComponent } from '../components/notify-popup/notify-popup.component';
// import { SummaryComponent } from '../components/summary/summary.component';
import { NgbDate, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgGridModule } from 'ag-grid-angular';
import { BsModalRef, ModalModule } from 'ngx-bootstrap/modal';
// import { FollowupViewComponent } from '../components/followup-view/followup-view.component';
// import { FollowupTemplateComponent } from '../components/followup-template/followup-template.component';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { AuthInterceptorService } from '../auth-interceptor.service';
import { ClaimOpFooterComponent } from '../components/claim-op-footer/claim-op-footer.component';
import { FollowupViewComponent } from '../components/followup-view/followup-view.component';
import { FollowupTemplateComponent } from '../components/followup-template/followup-template.component';
import { SummaryComponent } from '../components/summary/summary.component';

// export { LazyModule } from '../lazy/lazy.module'
// FusionChartsModule.fcRoot(FusionCharts,PowerCharts, Charts,Widgets,FusionTheme,TimeSeries,overlappedcolumn2d)
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatepickerModule,
      //  GooglePlaceModule,
       LoadingBarHttpClientModule,
       LoadingBarRouterModule,
       LoadingBarModule,
      //  HttpModule,
      //  LoadingBarHttpModule,
       NgxPaginationModule,
       NgxDaterangepickerMd,
      //  NgKnifeModule,
       SelectDropDownModule,
      //  AtomSpinnerModule,
       ToastrModule.forRoot(),
      //  NgxPrintModule,
      //  NgbModule.forRoot(),
      //  FusionChartsModule,
       TooltipModule,
       FormsModule,
       HttpClientModule,
       RouterModule,
       NgbModule,
       AgGridModule,
       ModalModule.forRoot(),
       CollapseModule,
       BsDatepickerModule,
  ],
  declarations: [
    // ModelBasicComponent,
    // NavbarComponent,
    HeaderComponent,
    FooterComponent,
    FollowupTemplateComponent,
    FollowupViewComponent,
    ClaimOpFooterComponent,
    // ClientNotesComponent,
    // SearchFilter,
    // NotifyPopupComponent,
    SummaryComponent
  ],
    providers: [
      JarwisService,
      NotifyService,
      DatePipe,
      // {
      //   provide: HTTP_INTERCEPTORS,
      //   useClass: AuthInterceptorService,
      //   multi:true
      // }
      // {provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter}
    ],
    exports:[
      HeaderComponent,
      FooterComponent,
      ClaimOpFooterComponent,
      // NavbarComponent,
      FollowupTemplateComponent,
      FollowupViewComponent,
      // ClientNotesComponent,
      // NotifyPopupComponent,
      SummaryComponent,
      // FusionChartsModule,
      LoadingBarHttpClientModule,
      // LoadingBarHttpModule,
      LoadingBarRouterModule,
      LoadingBarHttpClientModule,
      TooltipModule,
      FormsModule,
      ReactiveFormsModule,
      NgxPaginationModule,
      // AtomSpinnerModule,
      NgbModule,
      SelectDropDownModule,
      AgGridModule,
      ModalModule,
      CollapseModule,
      BsDatepickerModule,
    ]
})
export class CommonModuleModule { }
