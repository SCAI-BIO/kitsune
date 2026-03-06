import { TestBed } from '@angular/core/testing';

import { MappingTable } from './mapping-table';

describe('MappingTable', () => {
  let service: MappingTable;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MappingTable);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
