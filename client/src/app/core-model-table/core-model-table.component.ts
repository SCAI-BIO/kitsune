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

import { InfoKeys } from '../enums/info-keys';
import { ExtendCdmDialogComponent } from '../extend-cdm-dialog/extend-cdm-dialog.component';
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
  templateUrl: './core-model-table.component.html',
  styleUrl: './core-model-table.component.scss',
})
export class CoreModelTableComponent implements OnInit, OnDestroy {
  dataSource = new MatTableDataSource<CoreModel>([]);
  displayedColumns = [
    'actions',
    'id',
    'label',
    'description',
    'olsId',
    'olsLabel',
    'olsDescription',
    'ohdsiId',
    'ohdsiLabel',
    'ohdsiDomain',
    'study1Variable',
    'study1Description',
    'study2Variable',
  ];
  readonly InfoKey = InfoKeys;
  loading = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  subscriptions: Subscription[] = [];
  private dialog = inject(MatDialog);
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

    const dialogRef = this.dialog.open(ExtendCdmDialogComponent, {
      width: '1800px',
      data: { existingLabels },
    });

    // Pre-fill form after dialog is created
    dialogRef.componentInstance.existingLabels = existingLabels;
    dialogRef.componentInstance.form.patchValue({
      id: row.id,
      label: row.label,
      description: row.description,
      olsId: row.ols?.id ?? '',
      olsLabel: row.ols?.label ?? '',
      olsDescription: row.ols?.description ?? '',
      ohdsiId: row.ohdsi?.id ?? '',
      ohdsiLabel: row.ohdsi?.label ?? '',
      ohdsiDomain: row.ohdsi?.domain ?? '',
      study1Variable: row.studies?.[0]?.variable ?? '',
      study1Description: row.studies?.[0]?.description ?? '',
      study2Variable: row.studies?.[1]?.variable ?? '',
    });

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

  getSortingDataAccessor(): (item: CoreModel, property: string) => string {
    return (item: CoreModel, property: string): string => {
      let value: string | undefined;

      switch (property) {
        case 'olsId':
          value = item.ols?.id;
          break;
        case 'olsLabel':
          value = item.ols?.label;
          break;
        case 'olsDescription':
          value = item.ols?.description;
          break;
        case 'ohdsiId':
          value = item.ohdsi?.id;
          break;
        case 'ohdsiLabel':
          value = item.ohdsi?.label;
          break;
        case 'ohdsiDomain':
          value = item.ohdsi?.domain;
          break;
        case 'study1Variable':
          value = item.studies?.[0]?.variable;
          break;
        case 'study1Description':
          value = item.studies?.[0]?.description;
          break;
        case 'study2Variable':
          value = item.studies?.[1]?.variable;
          break;
        case 'id':
          value = item.id;
          break;
        case 'label':
          value = item.label;
          break;
        case 'description':
          value = item.description;
          break;
        default:
          value = '';
      }

      return value === null || value === undefined || value.trim() === ''
        ? 'ÿ' // blank values sort last
        : value.toLowerCase();
    };
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
    this.dataSource.data = data;

    this.dataSource.filterPredicate = (
      data: CoreModel,
      filter: string
    ): boolean => {
      const text = [
        data.id,
        data.label,
        data.description,
        data.ols.id,
        data.ols.label,
        data.ols.description,
        data.ohdsi.id,
        data.ohdsi.label,
        data.ohdsi.domain,
        data.studies[0].variable,
        data.studies[0].description,
        data.studies[1].variable,
      ]
        .filter((v): v is string => !!v)
        .join('')
        .toLowerCase();

      return text.includes(filter);
    };

    this.dataSource.sortingDataAccessor = this.getSortingDataAccessor();

    this.dataSource.sortData = (
      dataArray: CoreModel[],
      sort: MatSort
    ): CoreModel[] => {
      const active = sort.active;
      const direction = sort.direction;

      if (!active || direction === '') return dataArray;

      const accessor = this.getSortingDataAccessor();

      return [...dataArray].sort((a, b) => {
        const valueA = accessor(a, active);
        const valueB = accessor(b, active);

        const isBlankA = valueA === 'ÿ';
        const isBlankB = valueB === 'ÿ';

        // Blank values always sort last
        if (isBlankA && !isBlankB) return 1;
        if (!isBlankA && isBlankB) return -1;
        if (isBlankA && isBlankB) return 0;

        const comparison = valueA.localeCompare(valueB);
        return direction === 'asc' ? comparison : -comparison;
      });
    };

    // Wait for view to initialize
    setTimeout(() => {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
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
        console.log(parsedData);
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

    const dialogRef = this.dialog.open(ExtendCdmDialogComponent, {
      width: '1800px',
      data: { existingLabels },
    });

    dialogRef.componentInstance.existingLabels = existingLabels;

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
