import { TestBed } from '@angular/core/testing';

import { CoreModelTableService } from './core-model-table.service';

describe('CoreModelTableService', () => {
  let service: CoreModelTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoreModelTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
