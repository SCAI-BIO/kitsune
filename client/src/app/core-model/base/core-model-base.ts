import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { CoreModelDialogService } from '../core-model-dialog.service';
import { CoreModelTableService } from '../core-model-table.service';
import { InfoKeys } from '../../enums/info-keys';
import { InfoDialogComponent } from '../../info-dialog/info-dialog.component';
import { ApiError } from '../../interfaces/api-error';
import { CoreModel } from '../../interfaces/core-model';
import { ExternalLinkService } from '../../services/external-link.service';
import { FileService } from '../../services/file.service';

export class CoreModelBase {
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns: string[] = [];
  includeActions = false;
  readonly InfoKey = InfoKeys;
  loading = false;
  studyColumnNames: string[] = [];
  subscriptions: Subscription[] = [];
  protected dialog = inject(MatDialog);
  protected dialogService = inject(CoreModelDialogService);
  protected externalLinkService = inject(ExternalLinkService);
  protected fileService = inject(FileService);
  protected http = inject(HttpClient);
  protected tableService = inject(CoreModelTableService);

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  destroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  downloadTableAsCsv(): void {
    this.fileService.downloadCsv(
      this.dataSource.data,
      'core-model.csv',
      (model) => ({
        id: model.id,
        label: model.label,
        description: model.description,
        olsId: model.ols?.id ?? '',
        olsLabel: model.ols?.label ?? '',
        olsDescription: model.ols?.description ?? '',
        ohdsiId: model.ohdsi?.id ?? '',
        ohdsiLabel: model.ohdsi?.label ?? '',
        ohdsiDomain: model.ohdsi?.domain ?? '',
        study1Variable: model.studies?.[0]?.variable ?? '',
        study1Description: model.studies?.[0]?.description ?? '',
        study2Variable: model.studies?.[1]?.variable ?? '',
      })
    );
  }

  getAthenaLink(termId: string): string {
    return this.externalLinkService.getAthenaLink(termId);
  }

  getOlsLink(termId: string): string {
    return this.externalLinkService.getOlsLink(termId);
  }

  handleError(err: ApiError): void {
    console.error('Error fetching data:', err);
    this.loading = false;

    const detail = err.error?.detail;
    const message = err.error?.message || err.message;
    const errorMessage =
      detail && message
        ? `${message} — ${detail}`
        : detail || message || 'An unknown error occurred.';

    alert(`An error occurred while fetching data: ${errorMessage}`);
  }

  init(sort: MatSort, paginator: MatPaginator): void {
    const saved = localStorage.getItem('coreModel');
    if (saved) {
      this.initializeDataSource(JSON.parse(saved), sort, paginator);
    }
    this.loadCoreModelData(sort, paginator);
  }

  initializeDataSource(
    data: CoreModel[],
    sort: MatSort,
    paginator: MatPaginator
  ): void {
    this.studyColumnNames = this.tableService.getUniqueStudyNames(data);
    this.displayedColumns = this.tableService.getDisplayedColumns(
      this.studyColumnNames,
      this.includeActions
    );
    this.dataSource = this.tableService.setupDataSource(data);

    setTimeout(() => {
      this.dataSource.paginator = paginator;
      this.dataSource.sort = sort;
    });
  }

  loadCoreModelData(sort: MatSort, paginator: MatPaginator): void {
    this.loading = true;

    const sub = this.http.get<CoreModel[]>('assets/core_model.json').subscribe({
      next: (data) => this.initializeDataSource(data, sort, paginator),
      error: (err: ApiError) => this.handleError(err),
      complete: () => (this.loading = false),
    });

    this.subscriptions.push(sub);
  }

  openInfo(key: InfoKeys): void {
    this.dialog.open(InfoDialogComponent, {
      data: { key },
      width: '500px',
    });
  }
}
