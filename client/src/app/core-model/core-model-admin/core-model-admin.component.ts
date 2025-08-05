import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { CoreModelBase } from '../base/core-model-base';
import { CoreModel } from '../../interfaces/core-model';

@Component({
  selector: 'app-core-model-table',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './core-model-admin.component.html',
  styleUrl: './core-model-admin.component.scss',
})
export class CoreModelAdminComponent
  extends CoreModelBase
  implements OnInit, OnDestroy
{
  override includeActions = true;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  confirmDeleteRow(row: CoreModel): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${row.label}"?`
    );
    if (confirmed) {
      this.deleteRow(row);
    }
  }

  editRow(row: CoreModel): void {
    const existingLabels = this.dataSource.data
      .filter((r) => r.id !== row.id)
      .map((r) => r.label);

    const dialogRef = this.dialogService.openExtendDialog(existingLabels, row);

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
          studies: [
            {
              name: 'Study1',
              label: result.study1Variable,
              description: result.study1Description,
            },
            {
              name: 'Study2',
              label: result.study2Variable,
            },
          ],
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

  ngOnDestroy(): void {
    this.destroy();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.init(this.sort, this.paginator);
    });
  }

  onCsvUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    this.loading = true;
    reader.onload = () => {
      try {
        const csvText = reader.result as string;
        const parsedData = this.fileService.transformCsvToJson(csvText);
        this.initializeDataSource(parsedData, this.sort, this.paginator);
      } catch (err) {
        this.loading = false;
        alert('Error parsing CSV file.');
        console.error(err);
      } finally {
        this.loading = false;
      }
    };

    reader.readAsText(file);
  }

  openExtendCdmDialog(): void {
    const existingLabels = this.dataSource.data.map((row) => row.label);
    const dialogRef = this.dialogService.openExtendDialog(existingLabels);

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
          studies: [
            {
              name: 'Study1',
              label: result.study1Variable,
              description: result.study1Description,
            },
            {
              name: 'Study2',
              label: result.study2Variable,
            },
          ],
        };

        this.initializeDataSource(
          [...this.dataSource.data, newCoreModel],
          this.sort,
          this.paginator
        );
      }
    });
  }

  private deleteRow(row: CoreModel): void {
    const index = this.dataSource.data.findIndex((r) => r.id === row.id);
    if (index > -1) {
      this.dataSource.data.splice(index, 1);
      this.dataSource._updateChangeSubscription();
    }
  }
}
