import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlossaryDialog } from './glossary-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('InfoDialogComponent', () => {
  let component: GlossaryDialog;
  let fixture: ComponentFixture<GlossaryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlossaryDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlossaryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
