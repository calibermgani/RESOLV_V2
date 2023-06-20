import { TestBed, inject } from '@angular/core/testing';

import { UserUpdateService } from './user-update.service';

describe('UserUpdateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserUpdateService]
    });
  });

  it('should be created', inject([UserUpdateService], (service: UserUpdateService) => {
    expect(service).toBeTruthy();
  }));
});
