import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChordDiagram } from './chord-diagram';
import { provideHttpClient } from '@angular/common/http';

describe('ChordDiagram', () => {
  let component: ChordDiagram;
  let fixture: ComponentFixture<ChordDiagram>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordDiagram],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ChordDiagram);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
