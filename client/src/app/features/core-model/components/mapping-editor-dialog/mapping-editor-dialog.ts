import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { debounceTime, finalize } from 'rxjs';
import { v5 as uuidv5 } from 'uuid';

import { OntologyApi } from './services/ontology-api';
import type { ExtendCdmDialogData } from '../../interfaces/mapping-editor-data';
import { CoreModelTableService } from '../../services/core-model-table.service';
import { ApiErrorHandler } from '../../../../core/services/api-error-handler';
import type { CoreModel } from '../../../../shared/interfaces/core-model';

interface MappingFormControls {
  id: FormControl<string>;
  label: FormControl<string>;
  description: FormControl<string>;
  olsId: FormControl<string | null>;
  olsLabel: FormControl<string | null>;
  olsDescription: FormControl<string | null>;
  ohdsiId: FormControl<string | null>;
  ohdsiLabel: FormControl<string | null>;
  ohdsiDomain: FormControl<string | null>;
  [key: string]: FormControl<string | null>;
}

@Component({
  selector: 'app-mapping-editor-dialog',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TitleCasePipe,
    UpperCasePipe,
  ],
  templateUrl: './mapping-editor-dialog.html',
  styleUrl: './mapping-editor-dialog.scss',
})
export class MappingEditorDialog implements OnInit {
  fieldLabels: Record<string, string> = {};

  readonly form = new FormGroup<MappingFormControls>({
    id: new FormControl('', { nonNullable: true }),
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.labelUniquenessValidator()],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    olsId: new FormControl(''),
    olsLabel: new FormControl(''),
    olsDescription: new FormControl(''),
    ohdsiId: new FormControl(''),
    ohdsiLabel: new FormControl(''),
    ohdsiDomain: new FormControl(''),
  });

  readonly isOhdsiLoading = signal(false);
  readonly isOlsLoading = signal(false);
  readonly ohdsiError = signal<string | null>(null);
  readonly olsError = signal<string | null>(null);

  protected readonly dialogData = inject<ExtendCdmDialogData>(MAT_DIALOG_DATA);
  protected readonly tableService = inject(CoreModelTableService);
  private readonly dialogRef = inject(MatDialogRef<MappingEditorDialog>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errorHandler = inject(ApiErrorHandler);
  private readonly ontologyApi = inject(OntologyApi);

  cancel(): void {
    this.dialogRef.close();
  }

  fetchOhdsiData(): void {
    const id = this.form.controls.ohdsiId.value?.trim();
    if (!id) return;

    this.isOhdsiLoading.set(true);
    this.ohdsiError.set(null);

    this.ontologyApi
      .getOhdsiConceptById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isOhdsiLoading.set(false)),
      )
      .subscribe({
        next: (data) => {
          if (!data || !data.label.trim() || data.label.toLowerCase() === 'no matching concept') {
            this.ohdsiError.set('Concept not found');
            return;
          }
          this.form.patchValue({ ohdsiLabel: data.label, ohdsiDomain: data.domain });
        },
        error: (err) => this.ohdsiError.set(this.errorHandler.handleError(err, 'OHDSI lookup')),
      });
  }

  fetchOlsData(): void {
    const id = this.form.controls.olsId.value?.trim();
    if (!id) return;

    this.isOlsLoading.set(true);
    this.olsError.set(null);

    this.ontologyApi
      .getOlsTermById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isOlsLoading.set(false)),
      )
      .subscribe({
        next: (result) => {
          if (result) {
            this.form.patchValue({ olsLabel: result.label, olsDescription: result.description });
          } else {
            this.olsError.set('No matching term found');
          }
        },
        error: (err) => this.olsError.set(this.errorHandler.handleError(err, 'OLS lookup')),
      });
  }

  submit(): void {
    if (this.form.invalid || this.ohdsiError() || this.olsError()) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  ngOnInit(): void {
    this.setupDynamicStudyFields();
    this.setupIdAutoGeneration();

    if (this.dialogData.initialData) {
      this.patchExistingData(this.dialogData.initialData);
    }
  }

  private labelUniquenessValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const label = control.value?.trim().toLowerCase();
      if (this.dialogData.initialData?.label.toLowerCase() === label) return null;
      if (label && this.dialogData.existingLabels.some((l) => l.trim().toLowerCase() === label)) {
        return { labelExists: true };
      }
      return null;
    };
  }

  private patchExistingData(data: CoreModel): void {
    const patchObj: Record<string, string | null> = {
      id: data.id,
      label: data.label,
      description: data.description,
      olsId: data.ols?.id ?? '',
      olsLabel: data.ols?.label ?? '',
      olsDescription: data.ols?.description ?? '',
      ohdsiId: data.ohdsi?.id ?? '',
      ohdsiLabel: data.ohdsi?.label ?? '',
      ohdsiDomain: data.ohdsi?.domain ?? '',
    };

    for (const name of this.dialogData.studyColumnNames) {
      const camel = this.tableService.toCamelCase(name);
      const studyMatch = data.studies?.find((s) => s.name === name);
      patchObj[`${camel}Label`] = studyMatch?.label ?? '';
      patchObj[`${camel}Description`] = studyMatch?.description ?? '';
    }

    this.form.patchValue(patchObj);
  }

  private setupDynamicStudyFields(): void {
    const labels: Record<string, string> = {};

    for (const name of this.dialogData.studyColumnNames) {
      const camel = this.tableService.toCamelCase(name);
      const labelKey = `${camel}Label`;
      const descKey = `${camel}Description`;

      this.form.addControl(labelKey, new FormControl(''));
      this.form.addControl(descKey, new FormControl(''));

      labels[labelKey] = `${name.toUpperCase()} Label`;
      labels[descKey] = `${name.toUpperCase()} Description`;
    }

    this.fieldLabels = {
      id: 'CDM ID',
      label: 'CDM Label',
      description: 'CDM Description',
      olsId: 'OLS ID',
      olsLabel: 'OLS Label',
      olsDescription: 'OLS Description',
      ohdsiId: 'OHDSI ID',
      ohdsiLabel: 'OHDSI Label',
      ohdsiDomain: 'OHDSI Domain',
      ...labels,
    };
  }

  private setupIdAutoGeneration(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const { label, description } = this.form.getRawValue();
        if (label && description) {
          const uuid = uuidv5(`${label}-${description}`, uuidv5.URL);
          this.form.controls.id.setValue(`SCAI-${uuid}`, { emitEvent: false });
        }
      });
  }
}
