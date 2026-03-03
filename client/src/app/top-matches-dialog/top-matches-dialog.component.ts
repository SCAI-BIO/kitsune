import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import type { Mapping } from '../interfaces/mapping';
import type { TopMatchesDialogData } from '../interfaces/top-matches-dialog-data';
import { LinkBuilder } from '../services/link-builder';

@Component({
  selector: 'app-top-matches-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule, MatTableModule],
  templateUrl: './top-matches-dialog.component.html',
  styleUrl: './top-matches-dialog.component.scss',
})
export class TopMatchesDialogComponent {
  readonly displayedColumns = ['similarity', 'name', 'id', 'action'];
  private readonly dialogRef = inject(MatDialogRef<TopMatchesDialogComponent>);
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
