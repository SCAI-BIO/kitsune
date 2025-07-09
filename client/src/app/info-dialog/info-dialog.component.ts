import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InfoKeys } from '../enums/info-keys';

@Component({
  selector: 'app-info-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './info-dialog.component.html',
  styleUrl: './info-dialog.component.scss',
})
export class InfoDialogComponent {
  content: string;
  title: string;
  private readonly data = inject<{ key: InfoKeys }>(MAT_DIALOG_DATA);

  constructor() {
    this.content = this.getContent(this.data.key);
    this.title = this.getTitle(this.data.key);
  }

  private getTitle(key: string): string {
    switch (key) {
      case 'ohdsi':
        return 'What is OHDSI?';
      case 'ols':
        return 'What is OLS?';
      default:
        return 'Info';
    }
  }

  private getContent(key: string): string {
    switch (key) {
      case 'ohdsi':
        return this.getOhdsiIdContent();
      case 'ols':
        return this.getOlsIdContent();
      default:
        return '<p>No information available for this item.</p>';
    }
  }

  private getOhdsiIdContent(): string {
    return `
      <p>
        OHDSI (Observational Health Data Sciences and Informatics) is an international collaborative to bring out the value of health data through large-scale analytics.
      </p>
      <p>
        It provides tools and standards like the OMOP Common Data Model (CDM) to enable federated research across diverse clinical datasets.
      </p>
      <p>
        Learn more in the
        <a href="https://github.com/FhG-IHLAD-Collaboration/documentation/blob/main/technical/ohdsi_mapping_strategy/README.md" target="_blank" rel="noopener">
          OHDSI mapping documentation.
        </a>
      </p>
    `;
  }

  private getOlsIdContent(): string {
    return `
      <p>
        OLS (Ontology Lookup Service) is a repository and search interface for biomedical ontologies.
      </p>
      <p>
        It provides access to vocabularies such as MONDO, EFO, SNOMED, and others via a consistent web API and user interface.
      </p>
      <p>
        You can find more information in the
        <a href="https://www.ebi.ac.uk/ols4/about" target="_blank" rel="noopener">
          about section
        </a>
        of the OLS Website.
      </p>
      <p>
        You can explore available ontologies in the
        <a href="https://www.ebi.ac.uk/ols4/ontologies" target="_blank" rel="noopener">
          ontologies section
        </a>
        of the OLS Website.
      </p>
    `;
  }
}
