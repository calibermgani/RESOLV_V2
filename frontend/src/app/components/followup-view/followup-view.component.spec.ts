import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowupViewComponent } from './followup-view.component';

describe('FollowupViewComponent', () => {
  let component: FollowupViewComponent;
  let fixture: ComponentFixture<FollowupViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowupViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowupViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
