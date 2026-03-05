import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';

import type { CoreModel } from '@shared/interfaces/core-model';
import { CdmTable } from './cdm-table';

describe('CdmTable', () => {
  let component: CdmTable;
  let fixture: ComponentFixture<CdmTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdmTable],
    }).compileComponents();

    fixture = TestBed.createComponent(CdmTable);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dataSource', new MatTableDataSource<CoreModel>([]));
    fixture.componentRef.setInput('displayedColumns', []);
    fixture.componentRef.setInput('studyColumnNames', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
