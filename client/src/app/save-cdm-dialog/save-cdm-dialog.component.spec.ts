import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveCdmDialogComponent } from './save-cdm-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('SaveCdmDialogComponent', () => {
  let component: SaveCdmDialogComponent;
  let fixture: ComponentFixture<SaveCdmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveCdmDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            cdmName: '',
            cdmVersion: '',
            cdmOptions: [],
          },
        },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveCdmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
