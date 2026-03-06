import { Injectable } from '@angular/core';

import * as Papa from 'papaparse';

import type { CoreModel, Study } from '@shared/interfaces/core-model';
import type { Response } from '@shared/interfaces/mapping';

declare global {
  interface FileSystemWritableFileStream {
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface Window {
    showSaveFilePicker?(options?: {
      suggestedName?: string;
      types?: {
        description?: string;
        accept: Record<string, string[]>;
      }[];
    }): Promise<FileSystemFileHandle>;
  }
}

@Injectable({
  providedIn: 'root',
})
export class FileExporter {
  convertToCSV(data: Response[]): string {
    const rows = data.map((item) => {
      const firstMapping = item.mappings?.[0];
      return {
        Similarity: firstMapping?.similarity ?? '',
        Variable: item.variable,
        Description: item.description,
        ConceptID: firstMapping?.concept?.id ?? '',
        PrefLabel: firstMapping?.concept?.name ?? '',
      };
    });

    return Papa.unparse(rows);
  }

  async downloadCsv<T>(
    data: T[],
    suggestedFileName: string,
    transformFn?: (item: T) => Record<string, unknown>,
  ): Promise<void> {
    if (!data.length) return;

    const items = transformFn ? data.map(transformFn) : data;
    const csvData = Papa.unparse(items as Record<string, unknown>[]);
    const blob = new Blob([csvData], { type: 'text/csv' });

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedFileName,
          types: [
            {
              description: 'CSV file',
              accept: { 'text/csv': ['.csv'] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (error) {
        console.warn('File saving canceled or failed:', error);
        return;
      }
    }

    // Fallback: create a temporary anchor element and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', suggestedFileName);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  transformCsvToJson(csvText: string): CoreModel[] {
    const fixedKeys = new Set([
      'id',
      'label',
      'description',
      'olsId',
      'olsLabel',
      'olsDescription',
      'ohdsiId',
      'ohdsiLabel',
      'ohdsiDomain',
    ]);

    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const data = parsed.data as Record<string, string>[];

    return data.map((row): CoreModel => {
      const studiesData = new Map<string, { label?: string; description?: string }>();

      for (const [key, value] of Object.entries(row)) {
        if (fixedKeys.has(key)) continue;

        const match = key.match(/^([a-zA-Z0-9]+)(Label|Description)$/);
        if (!match) continue;

        const studyName = match[1];
        const field = match[2].toLowerCase() as 'label' | 'description';

        const currentProps = studiesData.get(studyName) ?? {};
        currentProps[field] = value;
        studiesData.set(studyName, currentProps);
      }

      const studies: Study[] = Array.from(studiesData.entries()).map(([name, props]) => ({
        name,
        label: props.label ?? '',
        ...(props.description && { description: props.description }),
      }));

      return {
        id: row['id'],
        label: row['label'],
        description: row['description'],
        ols: {
          id: row['olsId'],
          label: row['olsLabel'],
          description: row['olsDescription'],
        },
        ohdsi: {
          id: row['ohdsiId'],
          label: row['ohdsiLabel'],
          domain: row['ohdsiDomain'],
        },
        studies,
      };
    });
  }

  generateCsvString(data: Record<string, unknown>[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);

    const escape = (val: unknown) => {
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvRows = data.map((row) => headers.map((header) => escape(row[header])).join(','));

    return [headers.join(','), ...csvRows].join('\r\n');
  }
}
