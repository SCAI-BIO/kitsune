import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { Subscription } from 'rxjs';

import { ApiError } from '../interfaces/api-error';
import { ChordData } from '../interfaces/chord-diagram';
import { CdmApiService } from '../services/cdm-api.service';
import { ChordDiagramService } from '../services/chord-diagram.service';

@Component({
  selector: 'app-mappings',
  imports: [MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './chord-diagram.component.html',
  styleUrl: './chord-diagram.component.scss',
})
export class ChordDiagramComponent implements OnInit, OnDestroy {
  cdmOptions: { name: string; version: string }[] = [];
  cdmVersions: string[] = [];
  currentIndex = 0;
  dataChunks: ChordData[] = [];
  loading = false;
  selectedCdm = '';
  selectedVersion = '';
  uniqueCdmNames: string[] = [];
  private cdmApiService = inject(CdmApiService);
  private cdr = inject(ChangeDetectorRef);
  private chordService = inject(ChordDiagramService);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.fetchCdms();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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

  fetchData(): void {
    this.loading = true;
    const sub = this.cdmApiService
      .fetchChordDiagramData(this.selectedCdm, this.selectedVersion)
      .subscribe({
        next: (v) => {
          this.currentIndex = 0;
          this.dataChunks = this.chordService.chunkData(v, 40);

          // Let Angular render the SVG first
          this.cdr.detectChanges();
          setTimeout(() => {
            this.chordService.createChordDiagrams(
              this.dataChunks,
              this.currentIndex
            );
          });
        },
        error: (err: ApiError) => this.handleError(err),
        complete: () => (this.loading = false),
      });
    this.subscriptions.push(sub);
  }

  getVersionForCdm(name: string): void {
    this.cdmVersions = this.cdmOptions
      .filter((option) => option.name === name)
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

  next(): void {
    if (this.currentIndex < this.dataChunks.length - 1) {
      this.currentIndex++;
      this.chordService.createChordDiagrams(this.dataChunks, this.currentIndex);
    }
  }

  onSubmit(): void {
    this.fetchData();
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.chordService.createChordDiagrams(this.dataChunks, this.currentIndex);
    }
  }
}
