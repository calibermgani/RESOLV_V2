import { TestBed, inject } from '@angular/core/testing';

import { NotesHandlerService } from './notes-handler.service';

describe('NotesHandlerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotesHandlerService]
    });
  });

  it('should be created', inject([NotesHandlerService], (service: NotesHandlerService) => {
    expect(service).toBeTruthy();
  }));
});
