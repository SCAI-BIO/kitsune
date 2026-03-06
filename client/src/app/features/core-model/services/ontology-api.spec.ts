import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { OntologyApi } from './ontology-api';

describe('OntologyApi', () => {
  let service: OntologyApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(OntologyApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
