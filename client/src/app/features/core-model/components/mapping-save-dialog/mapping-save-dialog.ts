import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface MappingSaveData {
  cdmName: string;
  cdmVersion: string;
  cdmOptions: { name: string; description: string; version: string }[];
}

interface SaveFormControls {
  cdmName: FormControl<string>;
  cdmDescription: FormControl<string>;
  cdmVersion: FormControl<string>;
}

@Component({
  selector: 'app-mapping-save-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './mapping-save-dialog.html',
  styleUrl: './mapping-save-dialog.scss',
})
export class MappingSaveDialog {
  private readonly dialogRef = inject(MatDialogRef<MappingSaveDialog>);
  protected readonly data = inject<MappingSaveData>(MAT_DIALOG_DATA);

  readonly form = new FormGroup<SaveFormControls>({
    cdmName: new FormControl(this.data.cdmName || '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cdmDescription: new FormControl(
      this.data.cdmOptions.find((c) => c.name === this.data.cdmName)?.description || '',
      { nonNullable: true, validators: [Validators.required] },
    ),
    cdmVersion: new FormControl(this.bumpPatchVersion(this.data.cdmVersion), {
      nonNullable: true,
      validators: [
        Validators.required,
        this.semanticVersionValidator,
        this.uniqueVersionValidator(),
      ],
    }),
  });

  constructor() {
    // Re-validate version uniqueness if name changes
    this.form.controls.cdmName.valueChanges.subscribe(() => {
      this.form.controls.cdmVersion.updateValueAndValidity();
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }

  private bumpPatchVersion(version?: string): string {
    const match = version?.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!match) return 'v1.0.0';

    const [, major, minor, patch] = match;
    return `v${major}.${minor}.${parseInt(patch, 10) + 1}`;
  }

  private semanticVersionValidator(control: AbstractControl): ValidationErrors | null {
    const semverPattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    return semverPattern.test(control.value) ? null : { invalidSemver: true };
  }

  private uniqueVersionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const version = control.value?.trim();
      const name = this.form?.controls.cdmName.value?.trim();

      if (!name || !version) return null;

      const isDuplicate = this.data.cdmOptions.some(
        (cdm) => cdm.name === name && cdm.version === version,
      );

      return isDuplicate ? { versionExists: true } : null;
    };
  }
}
