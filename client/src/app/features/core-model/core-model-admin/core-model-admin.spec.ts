import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModelAdmin } from './core-model-admin';
import { provideHttpClient } from '@angular/common/http';

describe('CoreModelAdmin', () => {
  let component: CoreModelAdmin;
  let fixture: ComponentFixture<CoreModelAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreModelAdmin],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(CoreModelAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
