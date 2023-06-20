import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimOpFooterComponent } from './claim-op-footer.component';

describe('ClaimOpFooterComponent', () => {
  let component: ClaimOpFooterComponent;
  let fixture: ComponentFixture<ClaimOpFooterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClaimOpFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaimOpFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
