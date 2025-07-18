import { CommonModule } from '@angular/common';
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
    CommonModule,
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
  ];
  readonly InfoKey = InfoKeys;
  loading = false;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  subscriptions: Subscription[] = [];
  studyColumnNames: string[] = [];
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
      // Handle static properties first
      const staticProps: Record<string, string | undefined> = {
        olsId: item.ols?.id,
        olsLabel: item.ols?.label,
        olsDescription: item.ols?.description,
        ohdsiId: item.ohdsi?.id,
        ohdsiLabel: item.ohdsi?.label,
        ohdsiDomain: item.ohdsi?.domain,
        id: item.id,
        label: item.label,
        description: item.description,
      };

      if (property in staticProps) {
        return staticProps[property] || 'ÿ';
      }

      // Handle dynamic study columns
      const match = property.match(/^([a-zA-Z0-9]+)(Variable|Description)$/);
      if (match) {
        const studyName = match[1];
        const field = match[2].toLowerCase(); // variable | description
        const study = item.studies?.find(
          (s) => this.toCamelCase(s.name) === studyName
        );
        return study?.[field as 'variable' | 'description'] || 'ÿ';
      }

      return 'ÿ';
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

    // Collect all unique study names
    const uniqueStudies = new Set<string>();
    data.forEach((model) => {
      model.studies?.forEach((study) => {
        if (study.name) {
          uniqueStudies.add(study.name);
        }
      });
    });

    this.studyColumnNames = Array.from(uniqueStudies);

    // Convert study names to camelCase column identifiers
    this.displayedColumns = [
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
      ...this.studyColumnNames.flatMap((name) => {
        const formattedName = this.toCamelCase(name);
        return [`${formattedName}Variable`, `${formattedName}Description`];
      }),
    ];

    this.dataSource.filterPredicate = (
      data: CoreModel,
      filter: string
    ): boolean => {
      const values: string[] = [];

      values.push(data.id ?? '', data.label ?? '', data.description ?? '');

      if (data.ols) {
        values.push(
          data.ols.id ?? '',
          data.ols.label ?? '',
          data.ols.description ?? ''
        );
      }

      if (data.ohdsi) {
        values.push(
          data.ohdsi.id ?? '',
          data.ohdsi.label ?? '',
          data.ohdsi.domain ?? ''
        );
      }

      if (data.studies?.length) {
        for (const study of data.studies) {
          values.push(
            study.name ?? '',
            study.variable ?? '',
            study.description ?? ''
          );
        }
      }

      const text = values.join(' ').toLowerCase();
      return text.includes(filter.trim().toLowerCase());
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

  toCamelCase(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  getStudyField(
    row: CoreModel,
    studyName: string,
    field: 'variable' | 'description'
  ): string {
    const study = row.studies?.find(
      (s) => this.toCamelCase(s.name) === studyName
    );
    return study?.[field] ?? '';
  }

  getStudyClass(studyName: string): string {
    return `cell-bg-${this.toCamelCase(studyName)}`;
  }
}
