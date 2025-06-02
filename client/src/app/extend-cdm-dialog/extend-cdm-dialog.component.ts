import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { debounceTime } from 'rxjs';
import { v5 as uuidv5 } from 'uuid';

import { Ohdsi } from '../interfaces/core-model';
import { OntologyApiService } from '../services/ontology-api.service';

@Component({
  selector: 'app-extend-cdm-dialog',
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: './extend-cdm-dialog.component.html',
  styleUrl: './extend-cdm-dialog.component.scss',
})
export class ExtendCdmDialogComponent {
  form: FormGroup;
  ohdsiData: Ohdsi | null;
  ohdsiError: string | null;
  ohdsiId: string;
  ohdsiLoading: boolean;
  olsError: string | null;
  olsLoading: boolean;

  fieldLabels: Record<string, string> = {
    id: 'CDM ID',
    label: 'CDM Label',
    description: 'CDM Description',
    olsId: 'OLS ID',
    olsLabel: 'OLS Label',
    olsDescription: 'OLS Description',
    ohdsiId: 'OHDSI ID',
    ohdsiLabel: 'OHDSI Label',
    ohdsiDomain: 'OHDSI Domain',
    study1Variable: 'Study1 Variable',
    study1Description: 'Study1 Description',
    study2Variable: 'Study2 Variable',
    study2Description: 'Study2 Description',
  };

  constructor(
    private dialogRef: MatDialogRef<ExtendCdmDialogComponent>,
    private fb: FormBuilder,
    private ontologyApiService: OntologyApiService
  ) {
    this.ohdsiData = null;
    this.ohdsiError = null;
    this.ohdsiId = '';
    this.ohdsiLoading = false;
    this.olsError = null;
    this.olsLoading = false;

    this.form = this.fb.group({
      id: [''],
      label: ['', Validators.required],
      description: ['', Validators.required],
      olsId: [''],
      olsLabel: [''],
      olsDescription: [''],
      ohdsiId: [''],
      ohdsiLabel: [''],
      ohdsiDomain: [''],
      study1Variable: [''],
      study1Description: [''],
      study2Variable: [''],
      study2Description: [''],
    });

    this.form
      .get('label')!
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => this.updateCdmId());
    this.form
      .get('description')!
      .valueChanges.pipe(debounceTime(300))
      .subscribe(() => this.updateCdmId());
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
        if (data) {
          this.form.patchValue({
            ohdsiLabel: data.label,
            ohdsiDomain: data.domain,
          });
        } else {
          this.ohdsiError = 'Concept not found';
        }
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

  private updateCdmId(): void {
    const label = this.form.get('label')?.value;
    const description = this.form.get('description')?.value;

    if (label && description) {
      const uuid = uuidv5(`${label}-${description}`, uuidv5.URL);
      this.form.patchValue({ id: `SCAI-${uuid}` }, { emitEvent: false });
    }
  }

  submit(): void {
    this.dialogRef.close(this.form.value);
  }
}
