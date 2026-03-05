import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InfoKeys } from '@features/core-model/enums/info-keys';
import { MappingTable } from '@features/core-model/services/mapping-table';
import type { CoreModel } from '@shared/interfaces/core-model';

@Component({
  selector: 'app-cdm-table',
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './cdm-table.html',
  styleUrl: './cdm-table.scss',
})
export class CdmTable {
  readonly dataSource = input.required<MatTableDataSource<CoreModel>>();
  readonly displayedColumns = input.required<string[]>();
  readonly studyColumnNames = input.required<string[]>();
  readonly isAdminMode = input<boolean>(false);
  readonly downloadClicked = output<void>();
  readonly editClicked = output<CoreModel>();
  readonly deleteClicked = output<CoreModel>();
  readonly infoClicked = output<InfoKeys>();
  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);
  protected readonly mappingTable = inject(MappingTable);
  protected readonly InfoKeys = InfoKeys;

  constructor() {
    effect(() => {
      const ds = this.dataSource();
      if (ds) {
        ds.paginator = this.paginator();
        ds.sort = this.sort();
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    const ds = this.dataSource();

    if (ds) {
      ds.filter = filterValue.trim().toLowerCase();
      if (ds.paginator) {
        ds.paginator.firstPage();
      }
    }
  }

  handleInfoClick(key: InfoKeys, event: Event): void {
    event.stopPropagation();
    this.infoClicked.emit(key);
  }

  getOlsLink(id: string): string {
    return `https://www.ebi.ac.uk/ols4/search?q=${encodeURIComponent(id)}`;
  }

  getAthenaLink(id: string): string {
    return `https://athena.ohdsi.org/search-terms/terms/${encodeURIComponent(id)}`;
  }
}
