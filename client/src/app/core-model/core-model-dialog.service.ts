import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { CoreModelTableService } from './core-model-table.service';
import { ExtendCdmDialogComponent } from '../extend-cdm-dialog/extend-cdm-dialog.component';
import { CoreModel } from '../interfaces/core-model';

@Injectable({ providedIn: 'root' })
export class CoreModelDialogService {
  private dialog = inject(MatDialog);
  private tableService = inject(CoreModelTableService);

  openExtendDialog(
    existingLabels: string[],
    initialData?: CoreModel,
    studyColumnNames: string[] = []
  ): MatDialogRef<ExtendCdmDialogComponent> {
    const ref = this.dialog.open(ExtendCdmDialogComponent, {
      width: '1800px',
      data: { existingLabels, studyColumnNames },
    });

    if (initialData) {
      // Base patch values
      const patchData: Record<string, string> = {
        id: initialData.id,
        label: initialData.label,
        description: initialData.description,
        olsId: initialData.ols?.id ?? '',
        olsLabel: initialData.ols?.label ?? '',
        olsDescription: initialData.ols?.description ?? '',
        ohdsiId: initialData.ohdsi?.id ?? '',
        ohdsiLabel: initialData.ohdsi?.label ?? '',
        ohdsiDomain: initialData.ohdsi?.domain ?? '',
      };

      for (const study of studyColumnNames) {
        const camel = this.tableService.toCamelCase(study);
        patchData[`${camel}Label`] =
          initialData.studies?.find((s) => s.name === study)?.label ?? '';
        patchData[`${camel}Description`] =
          initialData.studies?.find((s) => s.name === study)?.description ?? '';
      }

      ref.componentInstance.existingLabels = existingLabels;
      ref.componentInstance.form.patchValue(patchData);
    }

    return ref;
  }
}
