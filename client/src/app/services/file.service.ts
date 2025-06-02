import { Injectable } from '@angular/core';

import * as Papa from 'papaparse';

import { CoreModel, Study } from '../interfaces/core-model';
import { Response } from '../interfaces/mapping';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  convertToCSV(data: Response[]): string {
    const headers = [
      'Similarity',
      'Variable',
      'Description',
      'ConceptID',
      'PrefLabel',
    ];

    const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = data.map((item) =>
      [
        item.mappings[0].similarity,
        escapeCSV(item.variable),
        escapeCSV(item.description),
        escapeCSV(item.mappings[0].concept.id),
        escapeCSV(item.mappings[0].concept.name),
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  async downloadCSV(
    data: Response[],
    suggestedFileName: string
  ): Promise<void> {
    const csvData = this.convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv' });

    // Extend TypeScript to recognize showSaveFilePicker
    if ('showSaveFilePicker' in window) {
      try {
        const saveFilePicker = window.showSaveFilePicker;
        if (typeof saveFilePicker === 'function') {
          const handle = await saveFilePicker({
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
        }
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
      'ID',
      'Label',
      'Description',
      'OLS - ID',
      'OLS - Label',
      'OLS - Description',
      'OHDSI - ID',
      'OHDSI - Label',
      'OHDSI - Domain',
    ]);

    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const data = parsed.data as Record<string, string>[];

    return data.map((row): CoreModel => {
      const studiesMap: Record<string, Partial<Study>> = {};

      for (const [key, value] of Object.entries(row)) {
        if (fixedKeys.has(key)) continue;

        const match = key.match(/(.+?) - (Variable|Description)$/);
        if (match) {
          const studyName = match[1].trim();
          const rawField = match[2];
          const field = rawField === 'Description' ? 'description' : 'variable';

          if (!studiesMap[studyName]) {
            studiesMap[studyName] = { name: studyName };
          }
          studiesMap[studyName][field] = value;
        }
      }

      return {
        id: row['ID'],
        label: row['Label'],
        description: row['Description'],
        ols: {
          id: row['OLS - ID'],
          label: row['OLS - Label'],
          description: row['OLS - Description'],
        },
        ohdsi: {
          id: row['OHDSI - ID'],
          label: row['OHDSI - Label'],
          domain: row['OHDSI - Domain'],
        },
        studies: Object.values(studiesMap) as Study[],
      };
    });
  }
}
