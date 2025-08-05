import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ExtendCdmDialogComponent } from '../extend-cdm-dialog/extend-cdm-dialog.component';
import { CoreModel } from '../interfaces/core-model';

@Injectable({ providedIn: 'root' })
export class CoreModelDialogService {
  private dialog = inject(MatDialog);

  openExtendDialog(
    existingLabels: string[],
    initialData?: CoreModel
  ): MatDialogRef<ExtendCdmDialogComponent> {
    const ref = this.dialog.open(ExtendCdmDialogComponent, {
      width: '1800px',
      data: { existingLabels },
    });

    if (initialData) {
      ref.componentInstance.existingLabels = existingLabels;
      ref.componentInstance.form.patchValue({
        id: initialData.id,
        label: initialData.label,
        description: initialData.description,
        olsId: initialData.ols?.id ?? '',
        olsLabel: initialData.ols?.label ?? '',
        olsDescription: initialData.ols?.description ?? '',
        ohdsiId: initialData.ohdsi?.id ?? '',
        ohdsiLabel: initialData.ohdsi?.label ?? '',
        ohdsiDomain: initialData.ohdsi?.domain ?? '',
        study1Variable: initialData.studies?.[0]?.label ?? '',
        study1Description: initialData.studies?.[0]?.description ?? '',
        study2Variable: initialData.studies?.[1]?.label ?? '',
      });
    }

    return ref;
  }
}
