import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowupTemplateComponent } from './followup-template.component';

describe('FollowupTemplateComponent', () => {
  let component: FollowupTemplateComponent;
  let fixture: ComponentFixture<FollowupTemplateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowupTemplateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowupTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
