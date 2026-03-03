import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import type { Mapping } from '../../../../shared/interfaces/mapping';
import type { TopMatchesDialogData } from '../../../../shared/interfaces/top-matches-dialog-data';
import { LinkBuilder } from '../../../../core/services/link-builder';

@Component({
  selector: 'app-top-matches-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule, MatTableModule],
  templateUrl: './top-matches-dialog.html',
  styleUrl: './top-matches-dialog.scss',
})
export class TopMatchesDialog {
  readonly displayedColumns = ['similarity', 'name', 'id', 'action'];
  private readonly dialogRef = inject(MatDialogRef<TopMatchesDialog>);
  private readonly dialogData = inject<TopMatchesDialogData>(MAT_DIALOG_DATA);
  private readonly linkBuilder = inject(LinkBuilder);

  readonly matches: Mapping[] = this.dialogData.matches;
  readonly terminology: string = this.dialogData.terminology;
  readonly variable: string = this.dialogData.variable;

  getExternalLink(termId: string): string {
    return this.terminology === 'OHDSI'
      ? this.linkBuilder.getAthenaLink(termId)
      : this.linkBuilder.getOlsLink(termId);
  }

  selectMapping(mapping: Mapping): void {
    this.dialogRef.close(mapping);
  }
}
