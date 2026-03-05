import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdmSelector } from './cdm-selector';

describe('CdmSelector', () => {
  let component: CdmSelector;
  let fixture: ComponentFixture<CdmSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdmSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CdmSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
