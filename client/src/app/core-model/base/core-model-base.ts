import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
import { CdmApiService } from '../../services/cdm-api.service';

export abstract class CoreModelBase {
  cdmOptions: { name: string; version: string }[] = [];
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns: string[] = [];
  includeActions = false;
  readonly InfoKey = InfoKeys;
  loading = false;
  selectedCdm = '';
  selectedVersion = '';
  studyColumnNames: string[] = [];
  subscriptions: Subscription[] = [];
  uniqueCdmNames: string[] = [];
  protected cdmApiService = inject(CdmApiService);
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
      (model) => {
        const base = {
          id: model.id,
          label: model.label,
          description: model.description,
          olsId: model.ols?.id ?? '',
          olsLabel: model.ols?.label ?? '',
          olsDescription: model.ols?.description ?? '',
          ohdsiId: model.ohdsi?.id ?? '',
          ohdsiLabel: model.ohdsi?.label ?? '',
          ohdsiDomain: model.ohdsi?.domain ?? '',
        };

        const studies = (model.studies ?? []).reduce((acc, study) => {
          if (!study.name) return acc;
          acc[`${study.name}Label`] = study.label ?? '';
          acc[`${study.name}Description`] = study.description ?? '';
          return acc;
        }, {} as Record<string, string>);

        return { ...base, ...studies };
      }
    );
  }

  fetchCdms(): void {
    this.loading = true;

    const sub = this.cdmApiService.fetchCommonDataModels().subscribe({
      next: (cdms) => {
        this.cdmOptions = cdms.map((cdm) => ({
          name: cdm.name,
          version: cdm.version,
        }));
        const uniqueNames = Array.from(
          new Set(this.cdmOptions.map((opt) => opt.name))
        );
        this.uniqueCdmNames = uniqueNames;
      },
      error: (err: ApiError) => this.handleError(err),
      complete: () => (this.loading = false),
    });

    this.subscriptions.push(sub);
  }

  fetchCoreModelData(): void {
    this.loading = true;
    const sub = this.cdmApiService
      .fetchCoreModelData(this.selectedCdm, this.selectedVersion)
      .subscribe({
        next: (data) => this.initializeDataSource(data),
        error: (err: ApiError) => this.handleError(err),
        complete: () => (this.loading = false),
      });

    this.subscriptions.push(sub);
  }

  getAthenaLink(termId: string): string {
    return this.externalLinkService.getAthenaLink(termId);
  }

  getOlsLink(termId: string): string {
    return this.externalLinkService.getOlsLink(termId);
  }

  getVersionForCdm(name: string): string[] {
    return this.cdmOptions
      .filter((option) => option, name === name)
      .map((option) => option.version);
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

  init(): void {
    this.fetchCdms();
  }

  initializeDataSource(data: CoreModel[]): void {
    this.studyColumnNames = this.tableService.getUniqueStudyNames(data);
    this.displayedColumns = this.tableService.getDisplayedColumns(
      this.studyColumnNames,
      this.includeActions
    );
    this.dataSource = this.tableService.setupDataSource(data);

    setTimeout(() => {
      this.setPaginator();
      this.setSort();
    });
  }

  onSubmit(): void {
    this.fetchCoreModelData();
  }

  openInfo(key: InfoKeys): void {
    this.dialog.open(InfoDialogComponent, {
      data: { key },
      width: '500px',
    });
  }

  abstract setPaginator(): void;

  abstract setSort(): void;
}
