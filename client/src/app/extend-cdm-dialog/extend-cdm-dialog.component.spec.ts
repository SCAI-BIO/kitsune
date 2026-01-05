import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of } from 'rxjs';

import { ExtendCdmDialogComponent } from './extend-cdm-dialog.component';
import { OntologyApiService } from '../services/ontology-api.service';

describe('ExtendCdmDialogComponent', () => {
  let component: ExtendCdmDialogComponent;
  let fixture: ComponentFixture<ExtendCdmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendCdmDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            existingLabels: [],
            studyColumnNames: [],
          },
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        {
          provide: OntologyApiService,
          useValue: {
            getOhdsiConceptById: () => of(null),
            getOlsTermById: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtendCdmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
