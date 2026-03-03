import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingSaveDialog } from './mapping-save-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('SaveCdmDialogComponent', () => {
  let component: MappingSaveDialog;
  let fixture: ComponentFixture<MappingSaveDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingSaveDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            cdmName: '',
            cdmVersion: '',
            cdmOptions: [],
          },
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MappingSaveDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
