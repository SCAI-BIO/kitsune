import { TestBed } from '@angular/core/testing';

import { ChordBuilder } from './chord-builder';

describe('ChordBuilder', () => {
  let service: ChordBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChordBuilder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
