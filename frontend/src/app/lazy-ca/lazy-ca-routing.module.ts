import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClientAssistanceComponent } from '../components/client-assistance/client-assistance.component';

const routes: Routes = [
  {path: '', component: ClientAssistanceComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LazyCARoutingModule { }
