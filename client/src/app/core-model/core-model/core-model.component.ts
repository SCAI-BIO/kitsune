import { UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { CoreModelBase } from '../base/core-model-base';
import { CoreModel } from '../../interfaces/core-model';

@Component({
  selector: 'app-core-model-table',
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
  templateUrl: './core-model.component.html',
  styleUrl: './core-model.component.scss',
})
export class CoreModelComponent
  extends CoreModelBase
  implements OnInit, OnDestroy
{
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  override initializeDataSource(data: CoreModel[]): void {
    this.studyColumnNames = this.tableService.getUniqueStudyNames(data);
    this.displayedColumns = this.tableService.getDisplayedColumns(
      this.studyColumnNames,
      this.includeActions
    );
    this.dataSource = this.tableService.setupDataSource(data);

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.init();
    });
  }
}
