import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MedcubicsIntegComponent } from './medcubics-integ.component';

describe('MedcubicsIntegComponent', () => {
  let component: MedcubicsIntegComponent;
  let fixture: ComponentFixture<MedcubicsIntegComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MedcubicsIntegComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MedcubicsIntegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
