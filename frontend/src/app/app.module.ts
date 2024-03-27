import { NgModule,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HeaderComponent } from './components/header/header.component';
import { CommonModuleModule } from './common-module/common-module.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {NgxPaginationModule} from 'ngx-pagination';
import { JarwisService } from './Services/jarwis.service';
import { NotifyService } from './Services/notify.service';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { PracticeListComponent } from './components/practice-list/practice-list.component';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsComponent } from './components/settings/settings.component';
import { ProfileComponent } from './components/profile/profile.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { SidebarModule } from 'ng-sidebar';
import { ReportComponent } from './components/report/report.component';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'ng2-tooltip-directive';
import { ModalModule } from 'ngx-bootstrap/modal';
import { AuthInterceptorService } from './auth-interceptor.service';
import { CustomerCreationComponent } from './components/customer-creation/customer-creation.component';
import { UsersComponent } from './components/users/users.component';
import { UserregistrationComponent } from './components/userregistration/userregistration.component';
import { ErrorLogComponent } from './components/error-log/error-log.component';
import { MedcubicsIntegComponent } from './components/medcubics-integ/medcubics-integ.component';
import { RolesComponent } from './components/roles/roles.component';
import { NgxUiLoaderHttpModule, NgxUiLoaderModule,NgxUiLoaderConfig, POSITION, SPINNER, NgxUiLoaderRouterModule } from 'ngx-ui-loader';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  // bgsColor: '#OOACC1',
  // bgsOpacity: 20,
  // bgsPosition: POSITION.centerCenter,
  // bgsSize: 60,
  // bgsType: SPINNER.threeStrings,
  fgsColor: '#00ACC1',
  fgsPosition: POSITION.centerCenter,
  fgsSize: 60,
  fgsType: SPINNER.threeStrings,
  // pbColor: '#00ACC1',
  // pbDirection: PB_DIRECTION.leftToRight,
  // pbThickness: 5,
};


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PracticeListComponent,
    ProfileComponent,
    SettingsComponent,
    ReportComponent,
    CustomerCreationComponent,
    UsersComponent,
    UserregistrationComponent,
    ErrorLogComponent,
    MedcubicsIntegComponent,
    RolesComponent,
    ResetPasswordComponent,
  ],
  imports: [
    NgIdleKeepaliveModule.forRoot(),
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    CommonModuleModule,
    BrowserModule,
    RouterModule,
    TooltipModule,
    BrowserAnimationsModule,
    LoadingBarModule,
    Ng2SearchPipeModule,
    SidebarModule.forRoot(),
    ModalModule.forRoot(),
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    NgxUiLoaderRouterModule, // import this module for showing loader automatically when navigating between app routes
    NgxUiLoaderHttpModule.forRoot({
      excludeRegexp:[
        '\/api\/getPermissions$',
      ],
      // exclude:["http://127.0.0.1:8000/api/checktoken","http://127.0.0.1:8000/api/getPermissions"],
      showForeground:true,
    }),
    // GooglePlaceModule,
  ],
  providers: [JarwisService,NotifyService,
    // {provide: HTTP_INTERCEPTORS,useClass:AuthInterceptorService,multi:true}

  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
