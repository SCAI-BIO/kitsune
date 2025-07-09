import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChordDiagramComponent } from './chord-diagram.component';
import { provideHttpClient } from '@angular/common/http';

describe('ChordDiagramComponent', () => {
  let component: ChordDiagramComponent;
  let fixture: ComponentFixture<ChordDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordDiagramComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ChordDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
