import { Component, OnInit } from '@angular/core';
import { LoadingBarService } from '@ngx-loading-bar/core';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor(
    private loadingBar: LoadingBarService) { }

  ngOnInit() {
    this.loadingBar.stop();
    this.copyrightYear();
  }

  copyrightYear(): number {
    return new Date().getFullYear();
  }

}
