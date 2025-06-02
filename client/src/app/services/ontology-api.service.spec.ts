import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { OntologyApiService } from './ontology-api.service';

describe('OntologyApiService', () => {
  let service: OntologyApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(OntologyApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
