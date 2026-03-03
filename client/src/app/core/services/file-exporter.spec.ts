import { TestBed } from '@angular/core/testing';

import { FileExporter } from './file-exporter';

describe('FileExporter', () => {
  let service: FileExporter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileExporter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
