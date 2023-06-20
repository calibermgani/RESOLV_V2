import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { SettingsComponent } from '../components/settings/settings.component';
import { PracticeComponent } from '../components/practice/practice.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { DocumentsComponent } from '../components/documents/documents.component';
import { AuthGuard } from '../Services/auth-guard.service';

const routes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'practice', component: PracticeComponent},
  {path: 'documents', component: DocumentsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyRoutingModule { }
