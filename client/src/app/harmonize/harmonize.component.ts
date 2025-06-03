import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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

import { forkJoin, Subscription } from 'rxjs';

import { Mapping, Response, StreamingResponse } from '../interfaces/mapping';
import { ApiService } from '../services/api.service';
import { FileService } from '../services/file.service';
import { TopMatchesDialogComponent } from '../top-matches-dialog/top-matches-dialog.component';
import { ExternalLinkService } from '../services/external-link.service';

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
  templateUrl: './harmonize.component.html',
  styleUrl: './harmonize.component.scss',
})
export class HarmonizeComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  closestMappings: Response[] = [];
  dataSource = new MatTableDataSource<Response>([]);
  displayedColumns: string[] = [
    'similarity',
    'variable',
    'description',
    'conceptID',
    'prefLabel',
    'actions',
  ];
  embeddingModels: string[] = [];
  expectedTotal: number;
  fileName: string;
  fileToUpload: File | null = null;
  harmonizeFormData = new FormData();
  harmonizeForm: FormGroup;
  loading: boolean;
  processedCount: number;
  progressPercent: number;
  requiredFileType: string;
  terminologies: string[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private externalLinkService: ExternalLinkService,
    private fileService: FileService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.harmonizeForm = this.fb.group({
      selectedTerminology: ['', Validators.required],
      selectedEmbeddingModel: ['', Validators.required],
      variableField: ['', Validators.required],
      descriptionField: ['', Validators.required],
      limit: [1],
    });
    this.expectedTotal = 0;
    this.fileName = '';
    this.loading = false;
    this.processedCount = 0;
    this.progressPercent = 0;
    this.requiredFileType =
      '.csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  clearCache(): void {
    this.loading = true;
    this.apiService.clearCache();
    this.fetchEmbeddingModelsAndTerminologies();
  }

  downloadTableAsCsv(): void {
    this.fileService.downloadCsv(
      this.closestMappings,
      'kitsune-harmonization.csv',
      (item) => ({
        similarity: item.mappings[0]?.similarity ?? 0,
        variable: item.variable,
        description: item.description,
        conceptId: item.mappings[0]?.concept.id ?? '',
        conceptName: item.mappings[0]?.concept.name ?? '',
      })
    );
  }

  getExternalLink(termId: string): string {
    const { selectedTerminology } = this.harmonizeForm.value;
    switch (selectedTerminology) {
      case 'OHDSI':
        return this.externalLinkService.getAthenaLink(termId);
      default:
        return this.externalLinkService.getOlsLink(termId);
    }
  }

  streamClosestMappings(): void {
    if (!this.harmonizeForm.valid || !this.fileToUpload) {
      console.error(
        'Form is invalid or no file selected:',
        this.harmonizeForm.value
      );
      return;
    }

    // Reset values
    this.loading = true;
    this.expectedTotal = 0;
    this.processedCount = 0;
    this.progressPercent = 0;
    this.closestMappings = [];
    this.dataSource.data = [];

    const {
      variableField,
      descriptionField,
      selectedEmbeddingModel,
      selectedTerminology,
      limit,
    } = this.harmonizeForm.value;

    const file = this.fileToUpload;

    let firstChunk = true;
    const sub = this.apiService
      .streamClosestMappingsDictionary(file, {
        model: selectedEmbeddingModel,
        terminology_name: selectedTerminology,
        variable_field: variableField,
        description_field: descriptionField,
        limit: limit,
      })
      .subscribe({
        next: (message: StreamingResponse) => {
          if (message.type === 'error') {
            this.loading = false;
            alert(`An error occurred: ${message.message}`);
            this.progressPercent = 100;
            return;
          }

          if (message.type === 'metadata') {
            this.expectedTotal = message.expected_total;
            return;
          }

          if (message.type === 'result') {
            const resultChunk: Response = {
              variable: message.variable,
              description: message.description,
              mappings: message.mappings,
            };

            if (firstChunk) {
              this.loading = false;
              firstChunk = false;
            }

            this.closestMappings.push(resultChunk);
            this.dataSource.data = [...this.closestMappings];

            this.processedCount++;
            if (this.expectedTotal > 0) {
              this.progressPercent = Math.round(
                (this.processedCount / this.expectedTotal) * 100
              );
            }

            if (!this.dataSource.paginator && this.paginator) {
              this.dataSource.paginator = this.paginator;
            }

            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('WebSocket error fetching closest mappings', err);

          let errorMessage = 'An unknown error occurred.';
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err?.error?.message || err?.message) {
            errorMessage = err.error?.message || err.message;
          }

          alert(`An error occurred while fetching mappings: ${errorMessage}`);
          this.progressPercent = 100;
        },
      });
    this.subscriptions.push(sub);
  }

  fetchEmbeddingModelsAndTerminologies(): void {
    this.loading = true;
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
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
    this.subscriptions.push(sub);
  }

  fetchTopMatches(description: string, row: Response): void {
    const { selectedEmbeddingModel, selectedTerminology } =
      this.harmonizeForm.value;
    const queryFormData = new FormData();
    queryFormData.set('text', description);
    queryFormData.set('model', selectedEmbeddingModel);
    queryFormData.set('terminology_name', selectedTerminology);
    queryFormData.set('limit', '10');

    this.loading = true;
    const sub = this.apiService
      .fetchClosestMappingsQuery(queryFormData)
      .subscribe({
        next: (mappings) => {
          const { selectedTerminology } = this.harmonizeForm.value;
          const dialogRef = this.dialog.open(TopMatchesDialogComponent, {
            width: '1000px',
            data: {
              matches: mappings,
              terminology: selectedTerminology,
              variable: row.variable,
            },
          });

          dialogRef.afterClosed().subscribe((selectedMapping: Mapping) => {
            if (selectedMapping) {
              row.mappings[0] = selectedMapping;
              this.dataSource.data = [...this.closestMappings];
            }
          });
        },
        error: (err) => {
          console.error('Error fetching closest mappings', err);
          this.loading = false;
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
        complete: () => (this.loading = false),
      });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.fetchEmbeddingModelsAndTerminologies();
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
      this.fileName = this.fileToUpload.name;
      this.harmonizeFormData.set('file', this.fileToUpload);
    }
  }

  onSubmit(): void {
    if (this.harmonizeForm.valid) {
      const {
        variableField,
        descriptionField,
        selectedEmbeddingModel,
        selectedTerminology,
      } = this.harmonizeForm.value;

      this.harmonizeFormData.set('variable_field', variableField);
      this.harmonizeFormData.set('description_field', descriptionField);
      this.harmonizeFormData.set('model', selectedEmbeddingModel);
      this.harmonizeFormData.set('terminology_name', selectedTerminology);

      this.streamClosestMappings();
    } else {
      console.error('Form is invalid:', this.harmonizeForm.value);
    }
  }
}
