import { TestBed } from '@angular/core/testing';

import { LinkBuilder } from './link-builder';

describe('LinkBuilder', () => {
  let service: LinkBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinkBuilder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
