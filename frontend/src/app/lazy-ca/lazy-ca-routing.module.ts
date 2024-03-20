import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientAssistanceComponent } from '../components/client-assistance/client-assistance.component';
import { AuthGuard } from '../Services/auth-guard.service';

const routes: Routes = [
  {path: '', component: ClientAssistanceComponent,canActivate: [AuthGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyCARoutingModule { }
