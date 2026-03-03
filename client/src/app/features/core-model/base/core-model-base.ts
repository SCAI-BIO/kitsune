import { computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { finalize } from 'rxjs';

import { MappingDialogs } from '../services/mapping-dialogs';
import { MappingTable } from '../services/mapping-table';
import { GlossaryDialog } from '../components/glossary-dialog/glossary-dialog';
import { ApiErrorHandler } from '../../../core/services/api-error-handler';
import { CdmApi } from '../../../core/services/cdm-api';
import { FileExporter } from '../../../core/services/file-exporter';
import { LinkBuilder } from '../../../core/services/link-builder';
import { InfoKeys } from '../../../shared/enums/info-keys';
import { CoreModel } from '../../../shared/interfaces/core-model';

export abstract class CoreModelBase {
  readonly availableVersions = computed(() =>
    this.cdmOptions()
      .filter((opt) => opt.name === this.selectedCdm())
      .map((opt) => opt.version),
  );
  readonly cdmOptions = signal<{ name: string; description: string; version: string }[]>([]);
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns: string[] = [];
  includeActions = false;
  readonly InfoKey = InfoKeys;
  readonly isLoading = signal(false);
  readonly selectedCdm = signal('');
  readonly selectedVersion = signal('');
  studyColumnNames: string[] = [];
  readonly uniqueCdmNames = computed(() =>
    Array.from(new Set(this.cdmOptions().map((c) => c.name))),
  );
  protected readonly cdmApi = inject(CdmApi);
  protected readonly dialog = inject(MatDialog);
  protected readonly errorHandler = inject(ApiErrorHandler);
  protected readonly fileExporter = inject(FileExporter);
  protected readonly linkBuilder = inject(LinkBuilder);
  protected readonly mappingDialogs = inject(MappingDialogs);
  protected readonly mappingTable = inject(MappingTable);
  private readonly destroyRef = inject(DestroyRef);

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  downloadTableAsCsv(): void {
    const filename = `${this.selectedCdm() || 'mappping'}_${this.selectedVersion() || 'export'}.csv`;
    this.fileExporter.downloadCsv(this.dataSource.data, filename, (row) =>
      this.mappingTable.flattenCoreModel(row),
    );
  }

  getAthenaLink(id: string): string {
    return this.linkBuilder.getAthenaLink(id);
  }

  getOlsLink(id: string): string {
    return this.linkBuilder.getOlsLink(id);
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
    this.setPaginator();
    this.setSort();
  }

  onSubmit(): void {
    const cdm = this.selectedCdm();
    const version = this.selectedVersion();

    if (!cdm || !version) return;

    this.isLoading.set(true);
    this.cdmApi
      .fetchCoreModelData(cdm, version)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => this.initializeDataSource(data),
        error: (err) => this.errorHandler.handleError(err, 'fetching core model data'),
      });
  }

  openInfo(key: InfoKeys): void {
    this.dialog.open(GlossaryDialog, {
      data: { key },
      width: '500px',
    });
  }

  protected fetchCdms(): void {
    this.isLoading.set(true);
    this.cdmApi
      .fetchCommonDataModels()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (cdms) => this.cdmOptions.set(cdms),
        error: (err) => this.errorHandler.handleError(err, 'fetching CDMs'),
      });
  }

  abstract setPaginator(): void;

  abstract setSort(): void;
}
