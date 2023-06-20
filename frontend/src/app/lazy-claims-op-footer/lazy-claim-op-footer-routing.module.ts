import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClaimOpFooterComponent } from '../components/claim-op-footer/claim-op-footer.component';

const routes: Routes = [
  {path: '', component: ClaimOpFooterComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyClaimOpFooterRoutingModule { }
