import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAssistanceComponent } from './client-assistance.component';

describe('ClientAssistanceComponent', () => {
  let component: ClientAssistanceComponent;
  let fixture: ComponentFixture<ClientAssistanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientAssistanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientAssistanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
