import { TestBed } from '@angular/core/testing';

import { ChordDiagramService } from './chord-diagram.service';

describe('ChordDiagramService', () => {
  let service: ChordDiagramService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChordDiagramService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
