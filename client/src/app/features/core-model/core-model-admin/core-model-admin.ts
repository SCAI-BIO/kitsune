import { Component, effect, OnInit, viewChild } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CoreModel } from '../../../shared/interfaces/core-model';
import { MappingSaveDialog } from '../components/mapping-save-dialog/mapping-save-dialog';
import { CoreModelBase } from '../base/core-model-base';

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
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    UpperCasePipe,
  ],
  templateUrl: './core-model-admin.html',
  styleUrl: './core-model-admin.scss',
})
export class CoreModelAdmin extends CoreModelBase implements OnInit {
  override includeActions = true;
  private readonly _paginator = viewChild(MatPaginator);
  private readonly _sort = viewChild(MatSort);

  constructor() {
    super();
    effect(() => {
      const paginator = this._paginator();
      const sort = this._sort();

      if (paginator) this.dataSource.paginator = paginator;
      if (sort) this.dataSource.sort = sort;
    });
  }

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
