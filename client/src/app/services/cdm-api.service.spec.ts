import { TestBed } from '@angular/core/testing';

import { CdmApiService } from './cdm-api.service';
import { provideHttpClient } from '@angular/common/http';

describe('CdmApiService', () => {
  let service: CdmApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(CdmApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
