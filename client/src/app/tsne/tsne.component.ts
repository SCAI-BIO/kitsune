import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { finalize } from 'rxjs';

import { ApiErrorHandler } from '../services/api-error-handler';
import { MappingsApi } from '../services/mappings-api';

@Component({
  selector: 'app-tsne',
  imports: [MatProgressSpinnerModule, RouterModule],
  templateUrl: './tsne.component.html',
  styleUrl: './tsne.component.scss',
})
export class TsneComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly tsneHost = viewChild.required<ElementRef<HTMLElement>>('tsneHost');
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly mappingsApi = inject(MappingsApi);

  fetchTsneData(): void {
    this.isLoading.set(true);
    this.mappingsApi
      .fetchTSNE()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (html) => this.insertHtmlAndRunScripts(html),
        error: (err) => this.errorHandler.handleError(err, 'fetchins t-SNE data'),
      });
  }

  ngOnInit(): void {
    this.fetchTsneData();
  }

  private insertHtmlAndRunScripts(html: string): void {
    const container = this.tsneHost().nativeElement;
    container.innerHTML = html;

    // Extract and execute scripts manually
    const scripts = Array.from(container.querySelectorAll('script'));
    for (const oldScript of scripts) {
      const newScript = document.createElement('script');

      if (oldScript.src) {
        newScript.src = oldScript.src;
        newScript.async = false; // Preserve execution order
      } else {
        newScript.textContent = oldScript.textContent;
      }

      oldScript.parentNode?.replaceChild(newScript, oldScript);
    }
  }
}
