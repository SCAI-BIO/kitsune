import { TestBed } from '@angular/core/testing';

import { MappingDialogs } from './mapping-dialogs';

describe('MappingDialogs', () => {
  let service: MappingDialogs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MappingDialogs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
