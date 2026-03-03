import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModelComponent } from './core-model.component';
import { provideHttpClient } from '@angular/common/http';

describe('CoreModelTableComponent', () => {
  let component: CoreModelComponent;
  let fixture: ComponentFixture<CoreModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreModelComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(CoreModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
