import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CdmSelector } from './cdm-selector';

describe('CdmSelector', () => {
  let component: CdmSelector;
  let fixture: ComponentFixture<CdmSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdmSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(CdmSelector);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cdmNames', []);
    fixture.componentRef.setInput('availableVersions', []);
    fixture.componentRef.setInput('selectedCdm', '');
    fixture.componentRef.setInput('selectedVersion', '');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
