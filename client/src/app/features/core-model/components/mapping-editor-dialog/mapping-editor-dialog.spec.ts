import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { of } from 'rxjs';

import { MappingEditorDialog } from './mapping-editor-dialog';
import { OntologyApi } from '../../services/ontology-api';

describe('MappingEditorDialog', () => {
  let component: MappingEditorDialog;
  let fixture: ComponentFixture<MappingEditorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingEditorDialog],
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
          provide: OntologyApi,
          useValue: {
            getOhdsiConceptById: () => of(null),
            getOlsTermById: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MappingEditorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
