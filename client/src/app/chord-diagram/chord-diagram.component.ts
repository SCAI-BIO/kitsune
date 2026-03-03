import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
  DestroyRef,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { finalize } from 'rxjs';

import type { ChordData } from '../interfaces/chord-diagram';
import { CdmApi } from '../services/cdm-api';
import { ChordBuilder } from '../services/chord-builder';
import { ApiErrorHandler } from '../services/api-error-handler';

@Component({
  selector: 'app-mappings',
  imports: [MatFormFieldModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './chord-diagram.component.html',
  styleUrl: './chord-diagram.component.scss',
})
export class ChordDiagramComponent implements OnInit {
  readonly cdmOptions = signal<{ name: string; version: string }[]>([]);
  readonly cdmVersions = computed(() =>
    this.cdmOptions()
      .filter((option) => option.name === this.selectedCdm())
      .map((option) => option.version),
  );
  readonly chordContainer = viewChild<ElementRef<HTMLElement>>('chordContainer');
  readonly currentIndex = signal(0);
  readonly dataChunks = signal<ChordData[]>([]);
  readonly isLoading = signal(false);
  readonly selectedCdm = signal('');
  readonly selectedVersion = signal('');
  readonly uniqueCdmNames = computed(() =>
    Array.from(new Set(this.cdmOptions().map((opt) => opt.name))),
  );
  private readonly cdmApi = inject(CdmApi);
  private readonly chordBuilder = inject(ChordBuilder);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const chunks = this.dataChunks();
      const index = this.currentIndex();
      const container = this.chordContainer()?.nativeElement;

      if (chunks.length > 0 && container) {
        this.chordBuilder.createChordDiagram(container, chunks[index]);
      }
    });
  }

  fetchCdms(): void {
    this.isLoading.set(true);

    this.cdmApi
      .fetchCommonDataModels()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (cdms) =>
          this.cdmOptions.set(cdms.map((cdm) => ({ name: cdm.name, version: cdm.version }))),
        error: (err) => this.errorHandler.handleError(err, 'fetching CDMs'),
      });
  }

  fetchData(): void {
    this.isLoading.set(true);
    this.cdmApi
      .fetchChordDiagramData(this.selectedCdm(), this.selectedVersion())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (v) => {
          this.chordBuilder.setGlobalColorDomain(v);
          this.dataChunks.set(this.chordBuilder.chunkData(v, 40));
          this.currentIndex.set(0);
        },
        error: (err) => this.errorHandler.handleError(err, 'fetching data'),
      });
  }

  next(): void {
    if (this.currentIndex() < this.dataChunks().length - 1) {
      this.currentIndex.update((i) => i + 1);
    }
  }

  ngOnInit(): void {
    this.fetchCdms();
  }

  onSubmit(): void {
    this.fetchData();
  }

  previous(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
  }
}
