import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdmTable } from './cdm-table';

describe('CdmTable', () => {
  let component: CdmTable;
  let fixture: ComponentFixture<CdmTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdmTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdmTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
