import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModelAdminComponent } from './core-model-admin.component';
import { provideHttpClient } from '@angular/common/http';

describe('CoreModelTableComponent', () => {
  let component: CoreModelAdminComponent;
  let fixture: ComponentFixture<CoreModelAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoreModelAdminComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(CoreModelAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
