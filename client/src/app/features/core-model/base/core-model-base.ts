import { HttpClient } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { Subscription } from 'rxjs';

import { MappingDialogs } from '../services/mapping-dialogs';
import { MappingTable } from '../services/mapping-table';
import { InfoKeys } from '../../../shared/enums/info-keys';
import { GlossaryDialog } from '../components/glossary-dialog/glossary-dialog';
import { ApiError } from '../../../shared/interfaces/api-error';
import { CoreModel } from '../../../shared/interfaces/core-model';
import { CdmApi } from '../../../core/services/cdm-api';
import { LinkBuilder } from '../../../core/services/link-builder';
import { FileExporter } from '../../../core/services/file-exporter';

export abstract class CoreModelBase {
  cdmOptions: { name: string; description: string; version: string }[] = [];
  cdmVersions: string[] = [];
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns: string[] = [];
  includeActions = false;
  readonly InfoKey = InfoKeys;
  isLoading = signal(false);
  selectedCdm = '';
  selectedVersion = '';
  studyColumnNames: string[] = [];
  subscriptions: Subscription[] = [];
  uniqueCdmNames: string[] = [];
  protected cdmApiService = inject(CdmApi);
  protected dialog = inject(MatDialog);
  protected dialogService = inject(MappingDialogs);
  protected externalLinkService = inject(LinkBuilder);
  protected fileService = inject(FileExporter);
  protected http = inject(HttpClient);
  protected mappingTable = inject(MappingTable);

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  destroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  downloadTableAsCsv(): void {
    this.fileService.downloadCsv(this.dataSource.data, 'core-model.csv', (row) =>
      this.mappingTable.flattenCoreModel(row),
    );
  }

  fetchCdms(): void {
    this.isLoading.set(true);

    const sub = this.cdmApiService.fetchCommonDataModels().subscribe({
      next: (cdms) => {
        this.cdmOptions = cdms.map((cdm) => ({
          name: cdm.name,
          description: cdm.description,
          version: cdm.version,
        }));
        const uniqueNames = Array.from(new Set(this.cdmOptions.map((opt) => opt.name)));
        this.uniqueCdmNames = uniqueNames;
      },
      error: (err: ApiError) => this.handleError(err),
      complete: () => this.isLoading.set(false),
    });

    this.subscriptions.push(sub);
  }

  fetchCoreModelData(): void {
    this.isLoading.set(true);
    const sub = this.cdmApiService
      .fetchCoreModelData(this.selectedCdm, this.selectedVersion)
      .subscribe({
        next: (data) => this.initializeDataSource(data),
        error: (err: ApiError) => this.handleError(err),
        complete: () => this.isLoading.set(false),
      });

    this.subscriptions.push(sub);
  }

  getAthenaLink(termId: string): string {
    return this.externalLinkService.getAthenaLink(termId);
  }

  getOlsLink(termId: string): string {
    return this.externalLinkService.getOlsLink(termId);
  }

  getVersionForCdm(name: string): void {
    this.cdmVersions = this.cdmOptions
      .filter((option) => option.name === name)
      .map((option) => option.version);
  }

  handleError(err: ApiError): void {
    console.error('Error fetching data:', err);
    this.isLoading.set(false);

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
    this.studyColumnNames = this.mappingTable.getUniqueStudyNames(data);
    this.displayedColumns = this.mappingTable.getDisplayedColumns(
      this.studyColumnNames,
      this.includeActions,
    );
    this.dataSource = this.mappingTable.setupDataSource(data);

    setTimeout(() => {
      this.setPaginator();
      this.setSort();
    });
  }

  onSubmit(): void {
    this.fetchCoreModelData();
  }

  openInfo(key: InfoKeys): void {
    this.dialog.open(GlossaryDialog, {
      data: { key },
      width: '500px',
    });
  }

  abstract setPaginator(): void;

  abstract setSort(): void;
}
