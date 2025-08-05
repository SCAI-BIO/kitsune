import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';

import { CoreModelTableService } from './core-model-table.service';
import { CoreModelDialogService } from './core-model-dialog.service';
import { InfoKeys } from '../enums/info-keys';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { ApiError } from '../interfaces/api-error';
import { CoreModel } from '../interfaces/core-model';
import { ExternalLinkService } from '../services/external-link.service';
import { FileService } from '../services/file.service';

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
    RouterModule,
  ],
  templateUrl: './core-model-admin.component.html',
  styleUrl: './core-model-admin.component.scss',
})
export class CoreModelAdminComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns: string[] = [];
  readonly InfoKey = InfoKeys;
  loading = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  subscriptions: Subscription[] = [];
  studyColumnNames: string[] = [];
  protected tableService = inject(CoreModelTableService);
  private dialog = inject(MatDialog);
  private dialogService = inject(CoreModelDialogService);
  private externalLinkService = inject(ExternalLinkService);
  private fileService = inject(FileService);
  private http = inject(HttpClient);

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  confirmDeleteRow(row: CoreModel): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${row.label}"?`
    );
    if (confirmed) {
      this.deleteRow(row);
    }
  }

  downloadTableAsCsv(): void {
    this.fileService.downloadCsv(
      this.dataSource.data,
      'core-model.csv',
      (model) => ({
        id: model.id,
        label: model.label,
        description: model.description,
        olsId: model.ols?.id ?? '',
        olsLabel: model.ols?.label ?? '',
        olsDescription: model.ols?.description ?? '',
        ohdsiId: model.ohdsi?.id ?? '',
        ohdsiLabel: model.ohdsi?.label ?? '',
        ohdsiDomain: model.ohdsi?.domain ?? '',
        study1Variable: model.studies?.[0]?.variable ?? '',
        study1Description: model.studies?.[0]?.description ?? '',
        study2Variable: model.studies?.[1]?.variable ?? '',
      })
    );
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
              variable: result.study1Variable,
              description: result.study1Description,
            },
            {
              name: 'Study2',
              variable: result.study2Variable,
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

  getAthenaLink(termId: string): string {
    return this.externalLinkService.getAthenaLink(termId);
  }

  getOlsLink(termId: string): string {
    return this.externalLinkService.getOlsLink(termId);
  }

  handleError(err: ApiError): void {
    console.error('Error fetching data:', err);
    this.loading = false;

    const detail = err.error?.detail;
    const message = err.error?.message || err.message;
    const errorMessage =
      detail && message
        ? `${message} — ${detail}`
        : detail || message || 'An unknown error occurred.';

    alert(`An error occurred while fetching data: ${errorMessage}`);
  }

  initializeDataSource(data: CoreModel[]): void {
    this.studyColumnNames = this.tableService.getUniqueStudyNames(data);
    this.displayedColumns = this.tableService.getDisplayedColumns(
      this.studyColumnNames
    );
    this.dataSource = this.tableService.setupDataSource(data);

    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadCoreModelData(): void {
    this.loading = true;

    const sub = this.http.get<CoreModel[]>('assets/core_model.json').subscribe({
      next: (data) => this.initializeDataSource(data),
      error: (err: ApiError) => this.handleError(err),
      complete: () => (this.loading = false),
    });

    this.subscriptions.push(sub);
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('coreModel');
    if (saved) {
      this.initializeDataSource(JSON.parse(saved));
    }
    this.loadCoreModelData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
        this.initializeDataSource(parsedData);
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

  openInfo(key: InfoKeys): void {
    this.dialog.open(InfoDialogComponent, {
      data: { key },
      width: '500px',
    });
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
              variable: result.study1Variable,
              description: result.study1Description,
            },
            {
              name: 'Study2',
              variable: result.study2Variable,
            },
          ],
        };

        this.initializeDataSource([...this.dataSource.data, newCoreModel]);
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
