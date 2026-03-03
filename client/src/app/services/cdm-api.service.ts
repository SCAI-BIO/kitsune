import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import type { CommonDataModel } from '../interfaces/cdm';
import type { ChordData } from '../interfaces/chord-diagram';
import type { CoreModel } from '../interfaces/core-model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CdmApiService {
  private readonly API_URL = environment.cdmApiUrl;
  private readonly http = inject(HttpClient);

  fetchChordDiagramData(cdm_name: string, cdm_version: string): Observable<ChordData> {
    return this.http.get<ChordData>(`${this.API_URL}/chord-diagram/`, {
      params: { cdm_name, cdm_version },
    });
  }

  fetchCommonDataModels(): Observable<CommonDataModel[]> {
    return this.http.get<CommonDataModel[]>(`${this.API_URL}/cdms/`);
  }

  fetchCoreModelData(cdm_name: string, cdm_version: string): Observable<CoreModel[]> {
    return this.http.get<CoreModel[]>(`${this.API_URL}/core-models/`, {
      params: { cdm_name, cdm_version },
    });
  }

  importCommonDataModel(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/imports/variable-dictionary`, formData);
  }
}
