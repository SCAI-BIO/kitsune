import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { catchError, map, Observable, of } from 'rxjs';

import { Ohdsi, Ols } from '../interfaces/core-model';
import { OhdsiApiResponse, OlsApiResponse } from '../interfaces/ontology-api-response';

@Injectable({
  providedIn: 'root',
})
export class OntologyApiService {
  olsApiBaseLink = 'https://www.ebi.ac.uk/ols4/api/ontologies';
  private http = inject(HttpClient);

  getOhdsiConceptById(id: string): Observable<Ohdsi | null> {
    if (!id || !id.trim()) return of(null);

    return this.http.get<OhdsiApiResponse>(`https://athena.ohdsi.org/api/v1/concepts/${id}`).pipe(
      map(
        (response): Ohdsi => ({
          id: id,
          label: response.name ?? '',
          domain: response.domainId ?? '',
        })
      ),
      catchError(() => of(null))
    );
  }

  getOlsTermById(id: string): Observable<Ols | null> {
    if (!id || !id.trim()) return of(null);

    const match = id.match(/^([A-Za-z0-9_-]+):.+$/);
    const ontologyPrefix = match ? match[1].toLowerCase() : null;

    if (!ontologyPrefix) return of(null);

    const url = `${this.olsApiBaseLink}/${ontologyPrefix}/terms?obo_id=${encodeURIComponent(id)}`;

    console.log(url);

    return this.http.get<OlsApiResponse>(url).pipe(
      map((response): Ols | null => {
        const term = response._embedded?.terms?.[0];
        if (!term) return null;

        const description = Array.isArray(term.description)
          ? term.description[0]
          : term.description ?? '';

        return {
          id: id,
          label: term.label ?? '',
          description,
        };
      }),
      catchError(() => of(null))
    );
  }
}
