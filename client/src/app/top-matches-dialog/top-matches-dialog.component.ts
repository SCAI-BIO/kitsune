import { DecimalPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { Mapping } from '../interfaces/mapping';
import { ExternalLinkService } from '../services/external-link.service';

@Component({
  selector: 'app-top-matches-dialog',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './top-matches-dialog.component.html',
  styleUrl: './top-matches-dialog.component.scss',
})
export class TopMatchesDialogComponent {
  matches: Mapping[];
  terminology: string;
  variable: string;

  constructor(
    public dialogRef: MatDialogRef<TopMatchesDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { matches: Mapping[]; terminology: string; variable: string },
    private externalLinkService: ExternalLinkService
  ) {
    this.matches = data.matches;
    this.terminology = data.terminology;
    this.variable = data.variable;
  }

  selectMapping(mapping: Mapping): void {
    this.dialogRef.close(mapping);
  }

  getExternalLink(termId: string): string {
    switch (this.terminology) {
      case 'OHDSI':
        return this.externalLinkService.getAthenaLink(termId);
      default:
        return this.externalLinkService.getOlsLink(termId);
    }
  }
}
