import { computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { finalize } from 'rxjs';

import { ApiErrorHandler } from '@core/services/api-error-handler';
import { CdmApi } from '@core/services/cdm-api';
import { FileExporter } from '@core/services/file-exporter';
import type { CoreModel } from '@shared/interfaces/core-model';
import { MappingTable } from '../services/mapping-table';
import { GlossaryDialog } from '../components/glossary-dialog/glossary-dialog';
import { InfoKeys } from '../enums/info-keys';

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

  protected readonly mappingTable = inject(MappingTable);
  private readonly destroyRef = inject(DestroyRef);

  downloadTableAsCsv(): void {
    const filename = `${this.selectedCdm() || 'mapping'}_${this.selectedVersion() || 'export'}.csv`;
    this.fileExporter.downloadCsv(this.dataSource.data, filename, (row) =>
      this.mappingTable.flattenCoreModel(row),
    );
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
}
