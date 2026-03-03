import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { finalize, forkJoin } from 'rxjs';

import type { Mapping } from '../interfaces/mapping';
import { ApiErrorHandler } from '../services/api-error-handler';
import { LinkBuilder } from '../services/link-builder';
import { MappingsApi } from '../services/mappings-api';

@Component({
  selector: 'app-query',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './query.component.html',
  styleUrl: './query.component.scss',
})
export class QueryComponent implements OnInit {
  readonly dataSource = new MatTableDataSource<Mapping>([]);
  readonly displayedColumns = ['similarity', 'conceptName', 'conceptID'];
  readonly embeddingModels = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly paginator = viewChild(MatPaginator);
  readonly queryForm = new FormGroup({
    text: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    selectedTerminology: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    selectedEmbeddingModel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    limit: new FormControl(100, { nonNullable: true }),
  });
  readonly terminologies = signal<string[]>([]);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly linkBuilder = inject(LinkBuilder);
  private readonly mappingsApi = inject(MappingsApi);

  constructor() {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
    });
  }

  clearCache(): void {
    this.isLoading.set(true);
    this.mappingsApi.clearCache();
    this.fetchEmbeddingModelsAndTerminologies();
  }

  fetchClosestMappings(formData: FormData): void {
    this.isLoading.set(true);
    this.mappingsApi
      .fetchClosestMappingsQuery(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (mappings) => {
          this.dataSource.data = mappings;
          this.dataSource.paginator?.firstPage();
        },
        error: (err) => this.errorHandler.handleError(err, 'fetching closest mappings'),
      });
  }

  fetchEmbeddingModelsAndTerminologies(): void {
    this.isLoading.set(true);
    forkJoin({
      terminologies: this.mappingsApi.fetchTerminologies(),
      models: this.mappingsApi.fetchEmbeddingModels(),
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
        error: (err) =>
          this.errorHandler.handleError(err, 'fetching embedding models and terminologies'),
      });
  }

  getExternalLink(termId: string): string {
    const terminology = this.queryForm.controls.selectedTerminology.value;
    return terminology === 'OHDSI'
      ? this.linkBuilder.getAthenaLink(termId)
      : this.linkBuilder.getOlsLink(termId);
  }

  ngOnInit(): void {
    this.fetchEmbeddingModelsAndTerminologies();
  }

  onSubmit(): void {
    if (this.queryForm.invalid) {
      console.error('Form is invalid:', this.queryForm.value);
      return;
    }

    const { text, selectedEmbeddingModel, selectedTerminology, limit } =
      this.queryForm.getRawValue();

    const formData = new FormData();
    formData.set('text', text);
    formData.set('terminology_name', selectedTerminology);
    formData.set('model', selectedEmbeddingModel);
    formData.set('limit', limit.toString());

    this.fetchClosestMappings(formData);
  }
}
