import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsneVisualization } from './tsne-visualization';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('TsneVisualization', () => {
  let component: TsneVisualization;
  let fixture: ComponentFixture<TsneVisualization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TsneVisualization],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TsneVisualization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
