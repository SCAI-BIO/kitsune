import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
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

import { debounceTime } from 'rxjs';
import { v5 as uuidv5 } from 'uuid';

import { OntologyApiService } from '../services/ontology-api.service';
import { CoreModelTableService } from '../core-model/core-model-table.service';

@Component({
  selector: 'app-extend-cdm-dialog',
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
  templateUrl: './extend-cdm-dialog.component.html',
  styleUrl: './extend-cdm-dialog.component.scss',
})
export class ExtendCdmDialogComponent {
  existingLabels: string[] = [];
  fieldLabels: Record<string, string> = {};
  form: FormGroup;
  ohdsiError: string | null = null;
  ohdsiLoading = false;
  olsError: string | null = null;
  olsLoading = false;
  protected data = inject(MAT_DIALOG_DATA) as {
    existingLabels: string[];
    studyColumnNames?: string[];
  };
  protected tableService = inject(CoreModelTableService);
  private dialogRef = inject(MatDialogRef<ExtendCdmDialogComponent>);
  private fb = inject(FormBuilder);
  private ontologyApiService = inject(OntologyApiService);

  constructor() {
    this.existingLabels = this.data.existingLabels;
    const studyFields: Record<string, FormControl> = {};
    const labels: Record<string, string> = {};

    for (const name of this.data.studyColumnNames ?? []) {
      const camel = this.tableService.toCamelCase(name);
      studyFields[`${camel}Label`] = new FormControl('');
      studyFields[`${camel}Description`] = new FormControl('');
      labels[`${camel}Label`] = `${name.toUpperCase()} Label`;
      labels[`${camel}Description`] = `${name.toUpperCase()} Description`;
    }

    // Store field labels for template
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

    this.form = this.fb.group({
      id: [''],
      label: ['', [Validators.required, this.labelUniquenessValidator()]],
      description: ['', Validators.required],
      olsId: [''],
      olsLabel: [''],
      olsDescription: [''],
      ohdsiId: [''],
      ohdsiLabel: [''],
      ohdsiDomain: [''],
      ...studyFields,
    });

    // Subscribe to updates
    this.form
      .get('label')!
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => this.updateCdmId());
    this.form
      .get('description')!
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => this.updateCdmId());
    this.form
      .get('ohdsiId')!
      .valueChanges.subscribe(() => (this.ohdsiError = null));
    this.form
      .get('olsId')!
      .valueChanges.subscribe(() => (this.olsError = null));
  }

  cancel(): void {
    this.dialogRef.close();
  }

  fetchOhdsiData(): void {
    const id = this.form.get('ohdsiId')?.value?.trim();
    if (!id) return;

    this.ohdsiLoading = true;
    this.ohdsiError = null;

    this.ontologyApiService.getOhdsiConceptById(id).subscribe({
      next: (data) => {
        if (
          !data ||
          data.label.toLowerCase() === 'no matching concept' ||
          !data.label.trim()
        ) {
          this.ohdsiError = 'Concept not found';
          this.form.patchValue({
            ohdsiLabel: '',
            ohdsiDomain: '',
          });
          return;
        }

        this.form.patchValue({
          ohdsiLabel: data.label,
          ohdsiDomain: data.domain,
        });
      },
      error: () => {
        this.ohdsiLoading = false;
        this.ohdsiError = 'Error fetching concept';
      },
      complete: () => (this.ohdsiLoading = false),
    });
  }

  fetchOlsData(): void {
    const id = this.form.get('olsId')?.value;
    if (!id) return;

    this.olsLoading = true;
    this.olsError = null;

    this.ontologyApiService.getOlsTermById(id).subscribe({
      next: (result) => {
        if (result) {
          this.form.patchValue({
            olsLabel: result.label,
            olsDescription: result.description,
          });
        } else {
          this.olsError = 'No matching term found.';
        }
      },
      error: () => {
        this.olsLoading = false;
        this.olsError = 'Failed to fetch OLS data.';
      },
      complete: () => (this.olsLoading = false),
    });
  }

  getControl(key: string): FormControl {
    return this.form.get(key) as FormControl;
  }

  hasRequiredError(fieldKey: string): boolean {
    const control = this.form.get(fieldKey);
    return (
      !!control?.hasError('required') && (control.dirty || control.touched)
    );
  }

  submit(): void {
    if (this.form.invalid || this.ohdsiError || this.olsError) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  private labelUniquenessValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const label = control.value?.trim().toLowerCase();
      if (
        label &&
        this.existingLabels.some((l) => l.trim().toLowerCase() === label)
      ) {
        return { labelExists: true };
      }
      return null;
    };
  }

  private updateCdmId(): void {
    const label = this.form.get('label')?.value;
    const description = this.form.get('description')?.value;

    if (label && description) {
      const uuid = uuidv5(`${label}-${description}`, uuidv5.URL);
      this.form.patchValue({ id: `SCAI-${uuid}` }, { emitEvent: false });
    }
  }
}
