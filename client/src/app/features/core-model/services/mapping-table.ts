import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import type { CoreModel } from '@shared/interfaces/core-model';

@Injectable({ providedIn: 'root' })
export class MappingTable {
  private readonly BLANK_SORT_VALUE = '\uffff';

  flattenCoreModel(model: CoreModel): Record<string, string> {
    const base: Record<string, string> = {
      id: model.id || '',
      label: model.label || '',
      description: model.description || '',
      olsId: model.ols?.id || '',
      olsLabel: model.ols?.label || '',
      olsDescription: model.ols?.description || '',
      ohdsiId: model.ohdsi?.id || '',
      ohdsiLabel: model.ohdsi?.label || '',
      ohdsiDomain: model.ohdsi?.domain || '',
    };

    // Dynamically add study columns
    model.studies?.forEach((study) => {
      if (!study.name) return;
      const camel = this.toCamelCase(study.name);
      base[`${camel}Label`] = study.label || '';
      base[`${camel}Description`] = study.description || '';
    });

    return base;
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

    if (includeActions) columns.unshift('actions');
    return columns;
  }

  getSortingDataAccessor() {
    return (item: CoreModel, property: string): string => {
      let value: string | number | undefined | null;

      switch (property) {
        case 'id':
          value = item.id;
          break;
        case 'label':
          value = item.label;
          break;
        case 'description':
          value = item.description;
          break;
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
        default: {
          const isLabel = property.endsWith('Label');
          const isDescription = property.endsWith('Description');

          if (isLabel || isDescription) {
            const suffix = isLabel ? 'Label' : 'Description';
            const camelName = property.replace(suffix, '');
            const study = item.studies?.find((s) => this.toCamelCase(s.name) === camelName);
            value = isLabel ? study?.label : study?.description;
          }
          break;
        }
      }

      return value != null ? String(value) : this.BLANK_SORT_VALUE;
    };
  }

  getStudyClass(studyName: string): string {
    if (!studyName) return '';
    return `cell-bg-${this.toCamelCase(studyName)}`;
  }

  getStudyField(row: CoreModel, studyName: string, field: 'label' | 'description'): string {
    const study = row.studies?.find((s) => s.name === studyName);
    return study?.[field] ?? '';
  }

  getUniqueStudyNames(data: CoreModel[]): string[] {
    const uniqueStudies = new Set<string>();
    data.forEach((model) => {
      model.studies?.forEach((s) => {
        if (s.name) uniqueStudies.add(s.name);
      });
    });
    return Array.from(uniqueStudies);
  }

  setupDataSource(data: CoreModel[]): MatTableDataSource<CoreModel> {
    const dataSource = new MatTableDataSource<CoreModel>(data);

    dataSource.filterPredicate = (model, filter) => {
      const searchStr = filter.toLowerCase();
      const coreInfo = (
        (model.id ?? '') +
        (model.label ?? '') +
        (model.description ?? '') +
        (model.ols?.id ?? '') +
        (model.ols?.label ?? '') +
        (model.ohdsi?.id ?? '') +
        (model.ohdsi?.label ?? '')
      ).toLowerCase();

      if (coreInfo.includes(searchStr)) return true;

      return !!model.studies?.some((s) =>
        (s.name + (s.label ?? '') + (s.description ?? '')).toLowerCase().includes(searchStr),
      );
    };

    dataSource.sortingDataAccessor = this.getSortingDataAccessor();

    dataSource.sortData = (dataArray, sort) => {
      const { active, direction } = sort;
      if (!active || !direction) return dataArray;

      return [...dataArray].sort((a, b) => {
        const valueA = dataSource.sortingDataAccessor(a, active) as string;
        const valueB = dataSource.sortingDataAccessor(b, active) as string;

        const isBlankA = valueA === this.BLANK_SORT_VALUE;
        const isBlankB = valueB === this.BLANK_SORT_VALUE;

        if (isBlankA && !isBlankB) return 1;
        if (!isBlankA && isBlankB) return -1;
        if (isBlankA && isBlankB) return 0;

        return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      });
    };

    return dataSource;
  }

  toCamelCase(name: string): string {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }
}
