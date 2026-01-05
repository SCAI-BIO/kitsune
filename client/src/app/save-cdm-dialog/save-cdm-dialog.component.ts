import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-save-cdm-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './save-cdm-dialog.component.html',
  styleUrl: './save-cdm-dialog.component.scss',
})
export class SaveCdmDialogComponent {
  form: FormGroup;
  protected data = inject(MAT_DIALOG_DATA) as {
    cdmName: string;
    cdmVersion: string;
    cdmOptions: { name: string; description: string; version: string }[];
  };
  private dialogRef = inject(MatDialogRef<SaveCdmDialogComponent>);
  private fb = inject(FormBuilder);

  constructor() {
    const bumpedVersion = this.bumpPatchVersion(this.data.cdmVersion);
    this.form = this.fb.group({
      cdmName: [this.data.cdmName || '', Validators.required],
      cdmDescription: [
        this.data.cdmOptions.find((cdm) => cdm.name === this.data.cdmName)?.description || '',
        Validators.required,
      ],
      cdmVersion: [
        bumpedVersion || '',
        [
          Validators.required,
          this.semanticVersionValidator,
          this.uniqueVersionValidator(this.data.cdmOptions),
        ],
      ],
    });

    this.form.get('cdmName')?.valueChanges.subscribe(() => {
      this.form.get('cdmVersion')?.updateValueAndValidity();
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  hasRequiredError(fieldKey: string): boolean {
    const control = this.form.get(fieldKey);
    return !!control?.hasError('required') && (control.dirty || control.touched);
  }

  semanticVersionValidator(control: AbstractControl): ValidationErrors | null {
    const semverPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    const value = control.value;
    return value && !semverPattern.test(value) ? { invalidSemver: true } : null;
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }

  uniqueVersionValidator(cdmOptions: { name: string; version: string }[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const cdmVersion = control.value?.trim();
      const parent = control.parent;
      const cdmName = parent?.get('cdmName')?.value?.trim();

      if (!cdmName || !cdmVersion) return null;

      const duplicate = cdmOptions.some(
        (cdm) => cdm.name === cdmName && cdm.version === cdmVersion
      );

      return duplicate ? { versionExists: true } : null;
    };
  }

  private bumpPatchVersion(version?: string): string {
    const semverRegex = /^v(\d+)\.(\d+)\.(\d+)$/;
    const match = version?.match(semverRegex);
    if (!match) {
      return 'v1.0.0'; // fallback default
    }

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = parseInt(match[3], 10) + 1;

    return `v${major}.${minor}.${patch}`;
  }
}
