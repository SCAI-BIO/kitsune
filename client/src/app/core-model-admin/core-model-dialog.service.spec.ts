import { TestBed } from '@angular/core/testing';

import { CoreModelDialogService } from './core-model-dialog.service';

describe('CoreModelDialogService', () => {
  let service: CoreModelDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoreModelDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
