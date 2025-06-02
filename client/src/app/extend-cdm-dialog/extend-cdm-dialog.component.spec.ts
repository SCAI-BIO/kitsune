import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtendCdmDialogComponent } from './extend-cdm-dialog.component';

describe('ExtendCdmDialogComponent', () => {
  let component: ExtendCdmDialogComponent;
  let fixture: ComponentFixture<ExtendCdmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtendCdmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtendCdmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
