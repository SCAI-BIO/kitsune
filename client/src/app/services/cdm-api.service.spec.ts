import { TestBed } from '@angular/core/testing';

import { CdmApiService } from './cdm-api.service';

describe('CdmApiService', () => {
  let service: CdmApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CdmApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
