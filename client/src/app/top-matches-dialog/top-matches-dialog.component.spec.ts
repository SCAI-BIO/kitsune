import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopMatchesDialogComponent } from './top-matches-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('TopMatchesDialogComponent', () => {
    let component: TopMatchesDialogComponent;
    let fixture: ComponentFixture<TopMatchesDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TopMatchesDialogComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: { close: vi.fn() },
                },
                { provide: MAT_DIALOG_DATA, useValue: { matches: [] } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TopMatchesDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
