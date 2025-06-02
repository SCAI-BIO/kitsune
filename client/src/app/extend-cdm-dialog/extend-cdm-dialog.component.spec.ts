import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

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
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy() } },
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
