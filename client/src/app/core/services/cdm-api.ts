import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import type { ChordData } from '@shared/interfaces/chord-diagram';
import type { CoreModel } from '@shared/interfaces/core-model';

interface CommonDataModel {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly time_stamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CdmApi {
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
