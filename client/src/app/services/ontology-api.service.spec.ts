import { TestBed } from '@angular/core/testing';

import { OntologyApiService } from './ontology-api.service';

describe('OntologyApiService', () => {
  let service: OntologyApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OntologyApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
