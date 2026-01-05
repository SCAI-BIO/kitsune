import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { forkJoin, Subscription } from 'rxjs';

import { Mapping } from '../interfaces/mapping';
import { ApiService } from '../services/api.service';
import { ExternalLinkService } from '../services/external-link.service';

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
export class QueryComponent implements OnDestroy, OnInit {
  closestMappings: Mapping[] = [];
  dataSource = new MatTableDataSource<Mapping>([]);
  displayedColumns = ['similarity', 'conceptName', 'conceptID'];
  embeddingModels: string[] = [];
  formData = new FormData();
  isLoading = signal(false);
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }
  queryForm: FormGroup;
  terminologies: string[] = [];
  private apiService = inject(ApiService);
  private externalLinkService = inject(ExternalLinkService);
  private fb = inject(FormBuilder);
  private subscriptions: Subscription[] = [];

  constructor() {
    this.queryForm = this.fb.group({
      text: ['', Validators.required],
      selectedTerminology: ['', Validators.required],
      selectedEmbeddingModel: ['', Validators.required],
      limit: [100],
    });
  }

  clearCache(): void {
    this.isLoading.set(true);
    this.apiService.clearCache();
    this.fetchEmbeddingModelsAndTerminologies();
  }

  fetchClosestMappings(): void {
    if (!this.queryForm.valid) {
      console.error('Form is invalid:', this.queryForm.value);
      return;
    }

    this.isLoading.set(true);
    const sub = this.apiService.fetchClosestMappingsQuery(this.formData).subscribe({
      next: (mappings) => {
        this.closestMappings = mappings;
        this.dataSource.data = mappings;

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Error fetching closest mappings', err);
        this.isLoading.set(false);
        const detail = err.error?.detail;
        const message = err.error?.message || err.message;

        let errorMessage = 'An unknown error occurred.';
        if (detail && message) {
          errorMessage = `${message} — ${detail}`;
        } else if (detail || message) {
          errorMessage = detail || message;
        }

        alert(`An error occurred while fetching mappings: ${errorMessage}`);
      },
      complete: () => this.isLoading.set(false),
    });
    this.subscriptions.push(sub);
  }

  fetchEmbeddingModelsAndTerminologies(): void {
    this.isLoading.set(true);
    const sub = forkJoin({
      terminologies: this.apiService.fetchTerminologies(),
      models: this.apiService.fetchEmbeddingModels(),
    }).subscribe({
      next: ({ terminologies, models }) => {
        this.terminologies = terminologies.map((t) => t.name);
        this.embeddingModels = models;
      },
      error: (err) => {
        console.error('Error fetching language models and terminologies', err);
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
    this.subscriptions.push(sub);
  }

  getExternalLink(termId: string): string {
    const { selectedTerminology } = this.queryForm.value;
    switch (selectedTerminology) {
      case 'OHDSI':
        return this.externalLinkService.getAthenaLink(termId);
      default:
        return this.externalLinkService.getOlsLink(termId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.fetchEmbeddingModelsAndTerminologies();
  }

  onSubmit(): void {
    if (this.queryForm.valid) {
      const { text, selectedEmbeddingModel, selectedTerminology, limit } = this.queryForm.value;

      this.formData.set('text', text);
      this.formData.set('terminology_name', selectedTerminology);
      this.formData.set('model', selectedEmbeddingModel);
      this.formData.set('limit', limit.toString());
      this.fetchClosestMappings();
    } else {
      console.error('Form is invalid:', this.queryForm.value);
    }
  }
}
