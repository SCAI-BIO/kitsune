import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonDataModel } from '../interfaces/cdm';

import { environment } from '../../environments/environment';
import { CoreModel } from '../interfaces/core-model';

@Injectable({
  providedIn: 'root',
})
export class CdmApiService {
  private API_URL = environment.cdmApiUrl;
  private http = inject(HttpClient);

  fetchCommonDataModels(): Observable<CommonDataModel[]> {
    return this.http.get<CommonDataModel[]>(`${this.API_URL}/cdms/`);
  }

  fetchCoreModelData(
    cdm_name: string,
    cdm_version: string
  ): Observable<CoreModel[]> {
    const params = new HttpParams()
      .set('cdm_name', cdm_name)
      .set('cdm_version', cdm_version);
    return this.http.get<CoreModel[]>(`${this.API_URL}/core-models`, {
      params,
    });
  }

  importCommonDataModel(formData: FormData): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/imports/variable-dictionary`,
      formData
    );
  }
}
