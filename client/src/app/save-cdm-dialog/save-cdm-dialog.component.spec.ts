import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveCdmDialogComponent } from './save-cdm-dialog.component';

describe('SaveCdmDialogComponent', () => {
  let component: SaveCdmDialogComponent;
  let fixture: ComponentFixture<SaveCdmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveCdmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveCdmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
