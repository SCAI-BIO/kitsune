import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CdmApi } from './cdm-api';

describe('CdmApi', () => {
  let service: CdmApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(CdmApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
