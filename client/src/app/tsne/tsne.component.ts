import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import { Subscription } from 'rxjs';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tsne',
  imports: [MatProgressSpinnerModule, RouterModule],
  templateUrl: './tsne.component.html',
  styleUrl: './tsne.component.scss',
})
export class TsneComponent implements OnDestroy, OnInit {
  loading: boolean;
  private subscriptions: Subscription[] = [];

  @ViewChild('tsneHost', { static: true }) tsneHost!: ElementRef;

  constructor(private apiService: ApiService) {
    this.loading = false;
  }

  fetchTsneData(): void {
    this.loading = true;
    const sub = this.apiService.fetchTSNE().subscribe({
      next: (html) => {
        this.insertHtmlAndRunScripts(html);
      },
      error: (err) => {
        console.error('Error fetching t-SNE data', err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    this.fetchTsneData();
  }

  private insertHtmlAndRunScripts(html: string): void {
    const container = this.tsneHost.nativeElement as HTMLElement;
    container.innerHTML = html;

    // Extract and execute scripts manually
    const scripts = Array.from(container.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');

      if (oldScript.src) {
        newScript.src = oldScript.src;
        newScript.async = false; // Preserve script order
      } else {
        newScript.textContent = oldScript.textContent;
      }

      // Replace the old script with the new one to execute it
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }
}
