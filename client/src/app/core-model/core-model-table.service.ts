import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { CoreModel } from '../interfaces/core-model';

@Injectable({ providedIn: 'root' })
export class CoreModelTableService {
  readonly BLANK_SORT_VALUE = 'ÿ';

  convertCoreModelsToCsv(data: CoreModel[]): string {
    if (!data.length) return '';

    const flattenRow = (row: CoreModel): Record<string, string> => {
      const base = {
        id: row.id ?? '',
        label: row.label ?? '',
        description: row.description ?? '',
        olsId: row.ols?.id ?? '',
        olsLabel: row.ols?.label ?? '',
        olsDescription: row.ols?.description ?? '',
        ohdsiId: row.ohdsi?.id ?? '',
        ohdsiLabel: row.ohdsi?.label ?? '',
        ohdsiDomain: row.ohdsi?.domain ?? '',
      };

      const studies = (row.studies ?? []).reduce((acc, study) => {
        if (!study.name) return acc;
        acc[`${study.name}Label`] = study.label ?? '';
        acc[`${study.name}Description`] = study.description ?? '';
        return acc;
      }, {} as Record<string, string>);

      return { ...base, ...studies };
    };

    const rows = data.map(flattenRow);
    const headers = Object.keys(rows[0]);
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const csvRows = rows.map((row) => headers.map((h) => escape(row[h] ?? '')).join(','));

    return [headers.join(','), ...csvRows].join('\n');
  }

  getDisplayedColumns(studyNames: string[], includeActions: boolean): string[] {
    const columns = [
      'id',
      'label',
      'description',
      'olsId',
      'olsLabel',
      'olsDescription',
      'ohdsiId',
      'ohdsiLabel',
      'ohdsiDomain',
      ...studyNames.flatMap((name) => {
        const camel = this.toCamelCase(name);
        return [`${camel}Label`, `${camel}Description`];
      }),
    ];

    if (includeActions) {
      columns.unshift('actions');
    }

    return columns;
  }

  getSortingDataAccessor() {
    return (item: CoreModel, property: string): string => {
      const staticProps: Record<string, string | undefined> = {
        id: item.id,
        label: item.label,
        description: item.description,
        olsId: item.ols?.id,
        olsLabel: item.ols?.label,
        olsDescription: item.ols?.description,
        ohdsiId: item.ohdsi?.id,
        ohdsiLabel: item.ohdsi?.label,
        ohdsiDomain: item.ohdsi?.domain,
      };

      if (property in staticProps) {
        return staticProps[property] || this.BLANK_SORT_VALUE;
      }

      const match = property.match(/^([a-zA-Z0-9]+)(Label|Description)$/);
      if (match) {
        const camelName = match[1];
        const field = match[2];
        const study = item.studies?.find((s) => this.toCamelCase(s.name) === camelName);
        return study?.[field.toLowerCase() as 'label' | 'description'] || this.BLANK_SORT_VALUE;
      }

      return this.BLANK_SORT_VALUE;
    };
  }

  getStudyClass(studyName: string): string {
    return `cell-bg-${this.toCamelCase(studyName)}`;
  }

  getStudyField(row: CoreModel, studyName: string, field: 'label' | 'description'): string {
    const study = row.studies?.find((s) => this.toCamelCase(s.name) === studyName);
    return study?.[field] ?? '';
  }

  getUniqueStudyNames(data: CoreModel[]): string[] {
    const uniqueStudies = new Set<string>();
    data.forEach((model) => {
      model.studies?.forEach((study) => {
        if (study.name) uniqueStudies.add(study.name);
      });
    });
    return Array.from(uniqueStudies);
  }

  setupDataSource(data: CoreModel[]): MatTableDataSource<CoreModel> {
    const dataSource = new MatTableDataSource<CoreModel>(data);

    dataSource.filterPredicate = (model, filter) => {
      const values: string[] = [
        model.id ?? '',
        model.label ?? '',
        model.description ?? '',
        model.ols?.id ?? '',
        model.ols?.label ?? '',
        model.ols?.description ?? '',
        model.ohdsi?.id ?? '',
        model.ohdsi?.label ?? '',
        model.ohdsi?.domain ?? '',
      ];

      model.studies?.forEach((s) => {
        values.push(s.name ?? '', s.label ?? '', s.description ?? '');
      });

      return values.join(' ').toLowerCase().includes(filter.trim().toLowerCase());
    };

    dataSource.sortingDataAccessor = this.getSortingDataAccessor();

    dataSource.sortData = (dataArray, sort) => {
      const active = sort.active;
      const direction = sort.direction;
      const accessor = dataSource.sortingDataAccessor;

      if (!active || direction === '') return dataArray;

      return [...dataArray].sort((a, b) => {
        const valueA = accessor(a, active);
        const valueB = accessor(b, active);

        const isBlankA = valueA === this.BLANK_SORT_VALUE;
        const isBlankB = valueB === this.BLANK_SORT_VALUE;

        if (isBlankA && !isBlankB) return 1;
        if (!isBlankA && isBlankB) return -1;
        if (isBlankA && isBlankB) return 0;

        const comparison = String(valueA).localeCompare(String(valueB));
        return direction === 'asc' ? comparison : -comparison;
      });
    };

    return dataSource;
  }

  toCamelCase(name: string): string {
    return name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}
