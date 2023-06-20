import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FollowupComponent } from '../components/followup/followup.component';
const routes: Routes = [
  {path: '', component: FollowupComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyFollowupRoutingModule { }
