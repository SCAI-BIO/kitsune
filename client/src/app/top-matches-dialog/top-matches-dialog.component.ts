import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { Mapping } from '../interfaces/mapping';
import { ExternalLinkService } from '../services/external-link.service';

@Component({
  selector: 'app-top-matches-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule, MatTableModule],
  templateUrl: './top-matches-dialog.component.html',
  styleUrl: './top-matches-dialog.component.scss',
})
export class TopMatchesDialogComponent {
  private dialogRef = inject(MatDialogRef<TopMatchesDialogComponent>);
  private data = inject<{
    matches: Mapping[];
    terminology: string;
    variable: string;
  }>(MAT_DIALOG_DATA);
  private externalLinkService = inject(ExternalLinkService);

  matches: Mapping[] = this.data.matches;
  terminology: string = this.data.terminology;
  variable: string = this.data.variable;

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
