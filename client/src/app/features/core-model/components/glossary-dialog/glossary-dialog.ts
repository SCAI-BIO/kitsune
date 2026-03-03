import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InfoKeys } from '../../../../shared/enums/info-keys';

interface GlossaryEntry {
  title: string;
  html: string;
}

const GLOSSARY_MAP: Record<InfoKeys, GlossaryEntry> = {
  [InfoKeys.OHDSI]: {
    title: 'What is OHDSI?',
    html: `
      <p>OHDSI (Observational Health Data Sciences and Informatics) is an international collaborative to bring out the value of health data through large-scale analytics.</p>
      <p>It provides tools and standards like the <strong>OMOP Common Data Model (CDM)</strong> to enable federated research across diverse clinical datasets.</p>
      <p>Learn more in the <a href="https://github.com/FhG-IHLAD-Collaboration/documentation/blob/main/technical/ohdsi_mapping_strategy/README.md" target="_blank" rel="noopener">OHDSI mapping documentation.</a></p>
    `,
  },
  [InfoKeys.OLS]: {
    title: 'What is OLS?',
    html: `
      <p>OLS (Ontology Lookup Service) is a repository and search interface for biomedical ontologies.</p>
      <p>It provides access to vocabularies such as <strong>MONDO, EFO, and SNOMED</strong> via a consistent web API and user interface.</p>
      <p>Explore more in the <a href="https://www.ebi.ac.uk/ols4/about" target="_blank" rel="noopener">OLS About section</a>.</p>
    `,
  },
};

@Component({
  selector: 'app-glossary-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './glossary-dialog.html',
  styleUrl: './glossary-dialog.scss',
})
export class GlossaryDialog {
  private readonly data = inject<{ key: InfoKeys }>(MAT_DIALOG_DATA);

  readonly info: GlossaryEntry = GLOSSARY_MAP[this.data.key] ?? {
    title: 'Information',
    html: '<p>No information available for this item.</p>',
  };
}
