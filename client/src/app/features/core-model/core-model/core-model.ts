import { Component, effect, OnInit, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { CoreModelBase } from '../base/core-model-base';
import { CdmSelector } from '../components/cdm-selector/cdm-selector';
import { CdmTable } from '../components/cdm-table/cdm-table';

@Component({
  selector: 'app-core-model',
  standalone: true,
  imports: [
    CdmSelector,
    CdmTable,
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

  constructor() {
    super();
    effect(() => {
      const paginator = this._paginator();
      const sort = this._sort();

      if (paginator) this.dataSource.paginator = paginator;
      if (sort) this.dataSource.sort = sort;
    });
  }

  ngOnInit(): void {
    this.init();
  }
}
