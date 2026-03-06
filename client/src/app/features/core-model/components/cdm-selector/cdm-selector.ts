import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-cdm-selector',
  imports: [MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './cdm-selector.html',
  styleUrl: './cdm-selector.scss',
})
export class CdmSelector {
  readonly cdmNames = input.required<string[]>();
  readonly availableVersions = input.required<string[]>();
  readonly selectedCdm = input<string | null>(null);
  readonly selectedVersion = input<string | null>(null);
  readonly cdmChange = output<string>();
  readonly versionChange = output<string>();
  readonly submitClicked = output<void>();
}
