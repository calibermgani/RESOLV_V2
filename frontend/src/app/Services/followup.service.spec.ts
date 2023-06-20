import { TestBed, inject } from '@angular/core/testing';

import { FollowupService } from './followup.service';

describe('FollowupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FollowupService]
    });
  });

  it('should be created', inject([FollowupService], (service: FollowupService) => {
    expect(service).toBeTruthy();
  }));
});
