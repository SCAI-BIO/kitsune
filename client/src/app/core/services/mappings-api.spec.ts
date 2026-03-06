import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { MappingsApi } from './mappings-api';

describe('MappingsApi', () => {
  let service: MappingsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(MappingsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
