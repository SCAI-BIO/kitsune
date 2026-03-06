import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Harmonization } from './harmonization';

describe('Harmonization', () => {
  let component: Harmonization;
  let fixture: ComponentFixture<Harmonization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Harmonization],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Harmonization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
