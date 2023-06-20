import { TestBed, inject } from '@angular/core/testing';

import { SetUserService } from './set-user.service';

describe('SetUserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SetUserService]
    });
  });

  it('should be created', inject([SetUserService], (service: SetUserService) => {
    expect(service).toBeTruthy();
  }));
});
