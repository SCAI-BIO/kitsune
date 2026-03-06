import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopMatchesDialog } from './top-matches-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('TopMatchesDialog', () => {
  let component: TopMatchesDialog;
  let fixture: ComponentFixture<TopMatchesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopMatchesDialog],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: vi.fn() },
        },
        { provide: MAT_DIALOG_DATA, useValue: { matches: [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopMatchesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
