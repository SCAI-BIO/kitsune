import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import type { CoreModel } from '@shared/interfaces/core-model';
import { MappingEditorDialog } from '../components/mapping-editor-dialog/mapping-editor-dialog';

@Injectable({ providedIn: 'root' })
export class MappingDialogs {
  private dialog = inject(MatDialog);

  openExtendDialog(
    existingLabels: string[],
    initialData?: CoreModel,
    studyColumnNames: string[] = [],
  ): MatDialogRef<MappingEditorDialog> {
    return this.dialog.open(MappingEditorDialog, {
      width: '1800px',
      data: {
        existingLabels,
        initialData,
        studyColumnNames,
      },
    });
  }
}
