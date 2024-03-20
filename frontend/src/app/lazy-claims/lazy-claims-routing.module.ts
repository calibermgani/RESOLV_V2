import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClaimsComponent } from '../components/claims/claims.component';
import { AuthGuard } from '../Services/auth-guard.service';

const routes: Routes = [
  {path: '', component: ClaimsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyClaimsRoutingModule { }
