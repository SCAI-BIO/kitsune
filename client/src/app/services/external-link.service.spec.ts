import { TestBed } from '@angular/core/testing';

import { ExternalLinkService } from './external-link.service';

describe('ExternalLinkServicesService', () => {
  let service: ExternalLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExternalLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
