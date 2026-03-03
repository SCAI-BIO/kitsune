import { UpperCasePipe } from '@angular/common';
import { Component, OnInit, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { CoreModelBase } from '../base/core-model-base';

@Component({
  selector: 'app-core-model',
  standalone: true,
  imports: [
    UpperCasePipe,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './core-model.html',
  styleUrl: './core-model.scss',
})
export class CoreModel extends CoreModelBase implements OnInit {
  private readonly _paginator = viewChild(MatPaginator);
  private readonly _sort = viewChild(MatSort);

  ngOnInit(): void {
    this.init();
  }

  override setPaginator(): void {
    const p = this._paginator();
    if (p) this.dataSource.paginator = p;
  }

  override setSort(): void {
    const s = this._sort();
    if (s) this.dataSource.sort = s;
  }
}
