import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModel } from './core-model';
import { provideHttpClient } from '@angular/common/http';

describe('CoreModel', () => {
  let component: CoreModel;
  let fixture: ComponentFixture<CoreModel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreModel],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(CoreModel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
