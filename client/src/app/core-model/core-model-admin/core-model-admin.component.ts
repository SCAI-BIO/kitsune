import { UpperCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { CoreModelBase } from '../base/core-model-base';
import { ApiError } from '../../interfaces/api-error';
import { CoreModel } from '../../interfaces/core-model';
import { SaveCdmDialogComponent } from '../../save-cdm-dialog/save-cdm-dialog.component';

@Component({
  selector: 'app-core-model-table',
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
    UpperCasePipe,
  ],
  templateUrl: './core-model-admin.component.html',
  styleUrl: './core-model-admin.component.scss',
})
export class CoreModelAdminComponent extends CoreModelBase implements OnInit, OnDestroy {
  override includeActions = true;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  confirmDeleteRow(row: CoreModel): void {
    const confirmed = confirm(`Are you sure you want to delete "${row.label}"?`);
    if (confirmed) {
      this.deleteRow(row);
    }
  }

  editRow(row: CoreModel): void {
    const existingLabels = this.dataSource.data.filter((r) => r.id !== row.id).map((r) => r.label);

    const dialogRef = this.dialogService.openExtendDialog(
      existingLabels,
      row,
      this.studyColumnNames
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updated: CoreModel = {
          id: result.id,
          label: result.label,
          description: result.description,
          ols: {
            id: result.olsId,
            label: result.olsLabel,
            description: result.olsDescription,
          },
          ohdsi: {
            id: result.ohdsiId,
            label: result.ohdsiLabel,
            domain: result.ohdsiDomain,
          },
          studies: this.studyColumnNames.map((studyName) => {
            const camel = this.tableService.toCamelCase(studyName);
            return {
              name: studyName,
              label: result[`${camel}Label`] ?? '',
              description: result[`${camel}Description`] ?? '',
            };
          }),
        };

        // Replace the existing row
        const index = this.dataSource.data.findIndex((r) => r.id === row.id);
        if (index > -1) {
          this.dataSource.data[index] = updated;
          this.dataSource._updateChangeSubscription(); // Refresh the table
        }
      }
    });
  }

  importCommonDataModel(formData: FormData): void {
    this.isLoading.set(true);
    const sub = this.cdmApiService.importCommonDataModel(formData).subscribe({
      error: (err: ApiError) => this.handleError(err),
      complete: () => this.isLoading.set(false),
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.init();
    });
  }

  onCsvUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    this.isLoading.set(true);
    reader.onload = () => {
      try {
        const csvText = reader.result as string;
        const parsedData = this.fileService.transformCsvToJson(csvText);
        this.initializeDataSource(parsedData);
      } catch (err) {
        this.isLoading.set(false);
        alert('Error parsing CSV file.');
        console.error(err);
      } finally {
        this.isLoading.set(false);
      }
    };

    reader.readAsText(file);
  }

  openExtendCdmDialog(): void {
    const existingLabels = this.dataSource.data.map((row) => row.label);
    const dialogRef = this.dialogService.openExtendDialog(
      existingLabels,
      undefined,
      this.studyColumnNames
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newCoreModel: CoreModel = {
          id: result.id,
          label: result.label,
          description: result.description,
          ols: {
            id: result.olsId,
            label: result.olsLabel,
            description: result.olsDescription,
          },
          ohdsi: {
            id: result.ohdsiId,
            label: result.ohdsiLabel,
            domain: result.ohdsiDomain,
          },
          studies: this.studyColumnNames.map((studyName) => {
            const camel = this.tableService.toCamelCase(studyName);
            return {
              name: studyName,
              label: result[`${camel}Label`] ?? '',
              description: result[`${camel}Description`] ?? '',
            };
          }),
        };

        this.initializeDataSource([...this.dataSource.data, newCoreModel]);
      }
    });
  }

  openSaveCdmDialog(): void {
    const dialogRef = this.dialog.open(SaveCdmDialogComponent, {
      data: {
        cdmName: this.selectedCdm,
        cdmVersion: this.selectedVersion,
        cdmOptions: this.cdmOptions,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      const { cdmName, cdmDescription, cdmVersion } = result;
      const csv = this.tableService.convertCoreModelsToCsv(this.dataSource.data);

      const blob = new Blob([csv], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, `${cdmName}_${cdmVersion}.csv`);
      formData.append('cdm_name', cdmName);
      formData.append('cdm_description', cdmDescription);
      formData.append('cdm_version', cdmVersion);

      this.importCommonDataModel(formData);

      this.isLoading.set(true);
    });
  }

  override setPaginator(): void {
    this.dataSource.paginator = this.paginator;
  }

  override setSort(): void {
    this.dataSource.sort = this.sort;
  }

  private deleteRow(row: CoreModel): void {
    const index = this.dataSource.data.findIndex((r) => r.id === row.id);
    if (index > -1) {
      this.dataSource.data.splice(index, 1);
      this.dataSource._updateChangeSubscription();
    }
  }
}
