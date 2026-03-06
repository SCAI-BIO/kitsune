import type { CoreModel } from '../../../shared/interfaces/core-model';

export interface ExtendCdmDialogData {
  existingLabels: string[];
  initialData?: CoreModel;
  studyColumnNames: string[];
}
