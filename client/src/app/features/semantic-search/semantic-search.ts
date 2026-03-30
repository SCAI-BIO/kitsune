import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { finalize, forkJoin } from 'rxjs';

import { ApiErrorHandler } from '@core/services/api-error-handler';
import { LinkBuilder } from '@core/services/link-builder';
import { MappingsApi } from '@core/services/mappings-api';
import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import type { Mapping } from '@shared/interfaces/mapping';

@Component({
  selector: 'app-semantic-search',
  imports: [
    CommonModule,
    LoadingSpinner,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './semantic-search.html',
  styleUrl: './semantic-search.scss',
})
export class SemanticSearch implements OnInit {
  readonly dataSource = new MatTableDataSource<Mapping>([]);
  readonly displayedColumns = ['similarity', 'conceptName', 'conceptID'];
  readonly vectorizers = signal<string[]>([]);
  readonly isLoading = signal(false);
  readonly paginator = viewChild(MatPaginator);

  readonly queryForm = new FormGroup({
    text: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    selectedTerminology: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    selectedVectorizer: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    limit: new FormControl(10, { nonNullable: true }),
  });
  readonly terminologies = signal<string[]>([]);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly hasInitializedPaginator = signal(false);
  private readonly isLastPage = signal(false);
  private readonly linkBuilder = inject(LinkBuilder);
  private readonly loadedMappings = signal<Mapping[]>([]);
  private readonly mappingsApi = inject(MappingsApi);

  constructor() {
    effect(
      () => {
        const p = this.paginator();
        if (p && !this.hasInitializedPaginator()) {
          this.hasInitializedPaginator.set(true);

          p.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            if (event.pageSize !== this.queryForm.controls.limit.value) {
              this.queryForm.controls.limit.setValue(event.pageSize);
              this.onSubmit();
            } else {
              this.loadPage(event.pageIndex);
            }
          });
        }
      },
      { allowSignalWrites: true },
    );
  }

  clearCache(): void {
    this.isLoading.set(true);
    this.mappingsApi.clearCache();
    this.fetchVectorizersAndTerminologies();
  }

  fetchVectorizersAndTerminologies(): void {
    this.isLoading.set(true);
    forkJoin({
      terminologies: this.mappingsApi.fetchTerminologies(),
      vectorizers: this.mappingsApi.fetchVectorizers(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: ({ terminologies, vectorizers }) => {
          this.terminologies.set(terminologies.map((t) => t.name));
          this.vectorizers.set(vectorizers);
        },
        error: (err) =>
          this.errorHandler.handleError(err, 'fetching vectorizers and terminologies'),
      });
  }

  getExternalLink(termId: string): string {
    const terminology = this.queryForm.controls.selectedTerminology.value;
    return terminology === 'OHDSI'
      ? this.linkBuilder.getAthenaLink(termId)
      : this.linkBuilder.getOlsLink(termId);
  }

  ngOnInit(): void {
    this.fetchVectorizersAndTerminologies();
  }

  onSubmit(): void {
    if (this.queryForm.invalid) {
      console.error('Form is invalid:', this.queryForm.value);
      return;
    }

    this.loadedMappings.set([]);
    this.isLastPage.set(false);

    const p = this.paginator();
    if (p) {
      p.pageIndex = 0;
      p.pageSize = this.queryForm.controls.limit.value;
    }

    this.loadPage(0);
  }

  private loadPage(pageIndex: number): void {
    const limit = this.queryForm.controls.limit.value;
    const offset = pageIndex * limit;

    if (this.loadedMappings().length >= offset + limit || this.isLastPage()) {
      this.updateTable(pageIndex, limit);
      return;
    }

    const { text, selectedVectorizer, selectedTerminology } = this.queryForm.getRawValue();

    const formData = new FormData();
    formData.set('text', text);
    formData.set('terminology_name', selectedTerminology);
    formData.set('vectorizer', selectedVectorizer);
    formData.set('limit', limit.toString());
    formData.set('offset', offset.toString());

    this.isLoading.set(true);
    this.mappingsApi
      .fetchClosestMappingsQuery(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (mappings) => {
          this.loadedMappings.update((current) => [...current, ...mappings]);

          if (mappings.length < limit) {
            this.isLastPage.set(true);
          }

          this.updateTable(pageIndex, limit);
        },
        error: (err) => this.errorHandler.handleError(err, 'fetching closest mappings'),
      });
  }

  private updateTable(pageIndex: number, limit: number): void {
    const startIndex = pageIndex * limit;
    this.dataSource.data = this.loadedMappings().slice(startIndex, startIndex + limit);

    const p = this.paginator();
    if (p) {
      p.length = this.loadedMappings().length + (this.isLastPage() ? 0 : 1);
      p.pageIndex = pageIndex;
    }
  }
}
