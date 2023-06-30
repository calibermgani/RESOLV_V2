import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BeforeLoginService } from './Services/before-login.service';
import { PracticeListComponent } from './components/practice-list/practice-list.component';
import { AuthGuard } from './Services/auth-guard.service';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { ReportComponent } from './components/report/report.component';
import { CustomerCreationComponent } from './components/customer-creation/customer-creation.component';
import { UsersComponent } from './components/users/users.component';
import { UserregistrationComponent } from './components/userregistration/userregistration.component';
import { ErrorLogComponent } from './components/error-log/error-log.component';
import { MedcubicsIntegComponent } from './components/medcubics-integ/medcubics-integ.component';
import { RolesComponent } from './components/roles/roles.component';
import { ClientAssistanceComponent } from './components/client-assistance/client-assistance.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const approutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [BeforeLoginService],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'dashboard',
  //   component: DashboardComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'claims',
  //   component: ClaimsComponent,
  //   canActivate: [AuthGuard]
  // },
   {
      path: 'registration',
      component: UserregistrationComponent,
      canActivate: [BeforeLoginService]
    },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
    {
      path: 'vendorCreation',
      component: CustomerCreationComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'users',
      component: UsersComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'errorlog',
      component: ErrorLogComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'medcubics',
      component: MedcubicsIntegComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'roles',
      component: RolesComponent,
      canActivate: [AuthGuard]
    },
  {
    path: 'practiceList',
    component: PracticeListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    component: ReportComponent,
    canActivate: [AuthGuard]
  },

  // {
  //   path: 'practice',
  //   component: PracticeComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'followup',
  //   component: FollowupComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'audit',
  //   component: AuditComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'client_assistance',
  //   component: ClientAssistanceComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'rcm',
  //   component: RcmComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'documents',
  //   component: DocumentsComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: '',
  //   component: DashboardComponent,
  //   canActivate: [AuthGuard]
  // },
  // { path: '', loadChildren: './lazy/lazy.module#LazyModule', canActivate: [AuthGuard] },
  {
    path: '',
    loadChildren: () => import('./lazy/lazy.module').then(x => x.LazyModule),
    canActivate: [AuthGuard]
  },
  // {path: 'settings', loadChildren: './lazy/lazy.module#LazyModule',canActivate: [AuthGuard]},
  // {path: 'profile', loadChildren: './lazy/lazy.module#LazyModule',canActivate: [AuthGuard]},
  {
    path: 'practice',
    loadChildren: () => import('./lazy/lazy.module').then(x => x.LazyModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'documents',
    loadChildren: () => import('./lazy/lazy.module').then(x => x.LazyModule),
    canActivate: [AuthGuard]
  },
  // {path: 'documents', loadChildren: './lazy/lazy.module#LazyModule'},
    {path: 'audit',  loadChildren: () => import('./lazy-audit/lazy-audit.module').then(x => x.LazyAuditModule),canActivate: [AuthGuard]},
    {path: 'client_assistance', loadChildren:() => import('./lazy-ca/lazy-ca.module').then(x=>x.LazyCAModule),canActivate: [AuthGuard]},
  {
    path: 'claims',
    loadChildren: () => import('./lazy-claims/lazy-claims.module').then(x => x.LazyClaimsModule),
    canActivate: [AuthGuard]
  },
  { path: 'followup', loadChildren: () => import('./lazy-followup/lazy-followup.module').then(x => x.LazyFollowupModule), canActivate: [AuthGuard] },
    // {path: 'rcm', loadChildren:()=> import('./lazy-rcm/lazy-rcm.module').then(x=>x.LazyRCMModule),canActivate: [AuthGuard]},
  {
    path: 'dashboard',
    loadChildren: () => import('./lazy/lazy.module').then(x => x.LazyModule),
    canActivate: [AuthGuard]
  },
  { path: '**', component: PracticeListComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(approutes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
