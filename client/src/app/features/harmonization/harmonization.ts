import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, viewChild, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { forkJoin, finalize } from 'rxjs';

import type { ApiError } from '../../shared/interfaces/api-error';
import type { Mapping, Response, StreamingResponse } from '../../shared/interfaces/mapping';
import { ApiErrorHandler } from '../../core/services/api-error-handler';
import { LinkBuilder } from '../../core/services/link-builder';
import { MappingsApi } from '../../core/services/mappings-api';
import { FileExporter } from '../../core/services/file-exporter';
import { TopMatchesDialog } from './components/top-matches-dialog/top-matches-dialog';

@Component({
  selector: 'app-harmonize',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './harmonization.html',
  styleUrl: './harmonization.scss',
})
export class Harmonization implements OnInit {
  readonly dataSource = new MatTableDataSource<Response>([]);
  readonly displayedColumns = [
    'similarity',
    'variable',
    'description',
    'conceptID',
    'prefLabel',
    'actions',
  ];
  readonly embeddingModels = signal<string[]>([]);
  readonly expectedTotal = signal(0);
  readonly fileName = signal('');
  readonly fileToUpload = signal<File | null>(null);
  readonly harmonizeForm = new FormGroup({
    selectedTerminology: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    selectedEmbeddingModel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    variableField: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descriptionField: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    limit: new FormControl(1, { nonNullable: true }),
  });
  readonly isLoading = signal(false);
  readonly paginator = viewChild(MatPaginator);
  readonly processedCount = signal(0);
  readonly progressPercent = signal(0);
  readonly terminologies = signal<string[]>([]);
  readonly requiredFileType =
    '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  private readonly apiService = inject(MappingsApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly externalLinkService = inject(LinkBuilder);
  private readonly fileService = inject(FileExporter);

  constructor() {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
    });
  }

  clearCache(): void {
    this.isLoading.set(true);
    this.apiService.clearCache();
    this.fetchEmbeddingModelsAndTerminologies();
  }

  downloadTableAsCsv(): void {
    this.fileService.downloadCsv(this.dataSource.data, 'kitsune-harmonization.csv', (item) => ({
      similarity: item.mappings[0]?.similarity ?? 0,
      variable: item.variable,
      description: item.description,
      conceptId: item.mappings[0]?.concept?.id ?? '',
      conceptName: item.mappings[0]?.concept?.name ?? '',
    }));
  }

  getExternalLink(termId: string): string {
    const terminology = this.harmonizeForm.controls.selectedTerminology.value;
    return terminology === 'OHDSI'
      ? this.externalLinkService.getAthenaLink(termId)
      : this.externalLinkService.getOlsLink(termId);
  }

  fetchEmbeddingModelsAndTerminologies(): void {
    this.isLoading.set(true);

    forkJoin({
      terminologies: this.apiService.fetchTerminologies(),
      models: this.apiService.fetchEmbeddingModels(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ terminologies, models }) => {
          this.terminologies.set(terminologies.map((t) => t.name));
          this.embeddingModels.set(models);
        },
        error: (err: ApiError) =>
          this.errorHandler.handleError(err, 'fetching embedding models and terminologies'),
      });
  }

  fetchTopMatches(description: string, row: Response): void {
    const { selectedEmbeddingModel, selectedTerminology } = this.harmonizeForm.getRawValue();
    const queryFormData = new FormData();
    queryFormData.set('text', description);
    queryFormData.set('model', selectedEmbeddingModel);
    queryFormData.set('terminology_name', selectedTerminology);
    queryFormData.set('limit', '10');

    this.isLoading.set(true);
    this.apiService
      .fetchClosestMappingsQuery(queryFormData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (mappings) => {
          const dialogRef = this.dialog.open(TopMatchesDialog, {
            width: '1000px',
            data: {
              matches: mappings,
              terminology: selectedTerminology,
              variable: row.variable,
            },
          });

          dialogRef.afterClosed().subscribe((selectedMapping: Mapping | undefined) => {
            if (selectedMapping) {
              row.mappings[0] = selectedMapping;
              this.dataSource.data = [...this.dataSource.data];
            }
          });
        },
        error: (err: ApiError) => this.errorHandler.handleError(err, 'fetching top matches'),
      });
  }

  ngOnInit(): void {
    this.fetchEmbeddingModelsAndTerminologies();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.fileToUpload.set(file);
      this.fileName.set(file.name);
    }
  }

  onSubmit(): void {
    const file = this.fileToUpload();

    if (this.harmonizeForm.invalid || !file) {
      console.error('Form is invalid or no file selected:', this.harmonizeForm.value);
      return;
    }

    this.isLoading.set(true);
    this.expectedTotal.set(0);
    this.processedCount.set(0);
    this.progressPercent.set(0);
    this.dataSource.data = [];
    this.dataSource.paginator?.firstPage();

    const { variableField, descriptionField, selectedEmbeddingModel, selectedTerminology, limit } =
      this.harmonizeForm.getRawValue();

    this.apiService
      .streamClosestMappingsDictionary(file, {
        model: selectedEmbeddingModel,
        terminology_name: selectedTerminology,
        variable_field: variableField,
        description_field: descriptionField,
        limit,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // Centralized teardown logic eliminates the need for a 'complete' block
        finalize(() => {
          this.isLoading.set(false);
          this.progressPercent.set(100);
        }),
      )
      .subscribe({
        next: (message: StreamingResponse) => {
          if (message.type === 'error') {
            alert(`An error occurred: ${message.message}`);
            return;
          }

          if (message.type === 'metadata') {
            this.expectedTotal.set(message.expected_total);
            return;
          }

          if (message.type === 'result') {
            const resultChunk: Response = {
              variable: message.variable,
              description: message.description,
              mappings: message.mappings,
            };

            const currentData = this.dataSource.data;
            this.dataSource.data = [...currentData, resultChunk];

            this.processedCount.update((count) => count + 1);

            const total = this.expectedTotal();
            if (total > 0) {
              this.progressPercent.set(Math.round((this.processedCount() / total) * 100));
            }
          }
        },
        error: (err: ApiError) => this.errorHandler.handleError(err, 'streaming mappings'),
      });
  }
}
