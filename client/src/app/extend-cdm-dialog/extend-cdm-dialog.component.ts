import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { v5 as uuidv5 } from 'uuid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { OntologyApiService } from '../services/ontology-api.service';
import { Ohdsi } from '../interfaces/core-model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { debounceTime } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-extend-cdm-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
  ],
  templateUrl: './extend-cdm-dialog.component.html',
  styleUrl: './extend-cdm-dialog.component.scss',
})
export class ExtendCdmDialogComponent {
  form: FormGroup;
  ohdsiId: string;
  ohdsiLoading: boolean;
  ohdsiError: string | null;
  ohdsiData: Ohdsi | null;
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
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExtendCdmDialogComponent>,
    private ontologyApiService: OntologyApiService
  ) {
    this.ohdsiId = '';
    this.ohdsiLoading = false;
    this.ohdsiError = null;
    this.ohdsiData = null;
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

  submit(): void {
    this.dialogRef.close(this.form.value);
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
}
