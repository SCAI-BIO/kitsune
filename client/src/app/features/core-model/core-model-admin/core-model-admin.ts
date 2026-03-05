import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import type { CoreModel } from '@shared/interfaces/core-model';
import { CoreModelBase } from '../base/core-model-base';
import { MappingSaveDialog } from '../components/mapping-save-dialog/mapping-save-dialog';
import { CdmSelector } from '../components/cdm-selector/cdm-selector';
import { CdmTable } from '../components/cdm-table/cdm-table';
import { MappingDialogs } from '../services/mapping-dialogs';

export interface MappingDialogResult {
  id: string;
  label: string;
  description: string;
  olsId: string;
  olsLabel: string;
  olsDescription: string;
  ohdsiId: string;
  ohdsiLabel: string;
  ohdsiDomain: string;
  [key: string]: string;
}

@Component({
  selector: 'app-core-model-admin',
  standalone: true,
  imports: [CdmSelector, CdmTable, LoadingSpinner, MatButtonModule, MatIconModule],
  templateUrl: './core-model-admin.html',
  styleUrl: './core-model-admin.scss',
})
export class CoreModelAdmin extends CoreModelBase implements OnInit {
  override includeActions = true;
  protected readonly mappingDialogs = inject(MappingDialogs);

  ngOnInit(): void {
    this.init();
  }

  confirmDeleteRow(row: CoreModel): void {
    if (confirm(`Are you sure you want to delete "${row.label}"?`)) {
      this.dataSource.data = this.dataSource.data.filter((r) => r.id !== row.id);
    }
  }

  editRow(row: CoreModel): void {
    const existingLabels = this.dataSource.data.filter((r) => r.id !== row.id).map((r) => r.label);

    this.mappingDialogs
      .openExtendDialog(existingLabels, row, this.studyColumnNames)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const updated = this.mapDialogResultToModel(result);
          const index = this.dataSource.data.findIndex((r) => r.id === row.id);

          if (index > -1) {
            const newData = [...this.dataSource.data];
            newData[index] = updated;
            this.dataSource.data = newData;
          }
        }
      });
  }

  openExtendCdmDialog(): void {
    const existingLabels = this.dataSource.data.map((row) => row.label);

    this.mappingDialogs
      .openExtendDialog(existingLabels, undefined, this.studyColumnNames)
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          const newModel = this.mapDialogResultToModel(result);
          this.initializeDataSource([...this.dataSource.data, newModel]);
        }
      });
  }

  openSaveCdmDialog(): void {
    this.dialog
      .open(MappingSaveDialog, {
        data: {
          cdmName: this.selectedCdm(),
          cdmVersion: this.selectedVersion(),
          cdmOptions: this.cdmOptions(),
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;

        const { cdmName, cdmDescription, cdmVersion } = result;
        const flattened = this.dataSource.data.map((row) =>
          this.mappingTable.flattenCoreModel(row),
        );
        const csv = this.fileExporter.generateCsvString(flattened);

        const formData = new FormData();
        formData.append(
          'file',
          new Blob([csv], { type: 'text/csv' }),
          `${cdmName}_${cdmVersion}.csv`,
        );
        formData.append('cdm_name', cdmName);
        formData.append('cdm_description', cdmDescription);
        formData.append('cdm_version', cdmVersion);

        this.isLoading.set(true);
        this.cdmApi.importCommonDataModel(formData).subscribe({
          next: () => alert('Model saved successfully.'),
          error: (err) => this.errorHandler.handleError(err, 'saving model'),
          complete: () => this.isLoading.set(false),
        });
      });
  }

  onCsvUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    this.isLoading.set(true);

    reader.onload = () => {
      try {
        const json = this.fileExporter.transformCsvToJson(reader.result as string);
        this.initializeDataSource(json);
      } catch {
        alert('Error parsing CSV.');
      } finally {
        this.isLoading.set(false);
      }
    };
    reader.readAsText(file);
  }

  private mapDialogResultToModel(result: MappingDialogResult): CoreModel {
    return {
      id: result.id,
      label: result.label,
      description: result.description,
      ols: { id: result.olsId, label: result.olsLabel, description: result.olsDescription },
      ohdsi: { id: result.ohdsiId, label: result.ohdsiLabel, domain: result.ohdsiDomain },
      studies: this.studyColumnNames.map((name) => {
        const camel = this.mappingTable.toCamelCase(name);
        return {
          name,
          label: result[`${camel}Label`] ?? '',
          description: result[`${camel}Description`] ?? '',
        };
      }),
    };
  }
}
