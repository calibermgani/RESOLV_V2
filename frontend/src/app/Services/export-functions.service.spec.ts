import { TestBed, inject } from '@angular/core/testing';

import { ExportFunctionsService } from './export-functions.service';

describe('ExportFunctionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportFunctionsService]
    });
  });

  it('should be created', inject([ExportFunctionsService], (service: ExportFunctionsService) => {
    expect(service).toBeTruthy();
  }));
});
