import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { catchError, map, Observable, of, shareReplay } from 'rxjs';

import type { Ohdsi, Ols } from '../../../../../shared/interfaces/core-model';
import type { OhdsiApiResponse, OlsApiResponse } from '../../../../../shared/interfaces/ontology-api-response';

@Injectable({
  providedIn: 'root',
})
export class OntologyApi {
  private readonly ATHENA_API_BASE = 'https://athena.ohdsi.org/api/v1/concepts';
  private readonly OLS_API_BASE = 'https://www.ebi.ac.uk/ols4/api/ontologies';
  private readonly http = inject(HttpClient);
  private readonly ohdsiCache = new Map<string, Observable<Ohdsi | null>>();
  private readonly olsCache = new Map<string, Observable<Ols | null>>();

  getOhdsiConceptById(id: string): Observable<Ohdsi | null> {
    if (!id?.trim()) return of(null);

    const cleanId = id.trim();
    if (this.ohdsiCache.has(cleanId)) {
      return this.ohdsiCache.get(cleanId)!;
    }

    const request$ = this.http.get<OhdsiApiResponse>(`${this.ATHENA_API_BASE}/${cleanId}`).pipe(
      map(
        (response): Ohdsi => ({
          id: cleanId,
          label: response.name ?? '',
          domain: response.domainId ?? '',
        }),
      ),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.ohdsiCache.set(cleanId, request$);
    return request$;
  }

  getOlsTermById(id: string): Observable<Ols | null> {
    if (!id?.trim()) return of(null);

    const cleanId = id.trim();
    if (this.olsCache.has(cleanId)) {
      return this.olsCache.get(cleanId)!;
    }

    const colonIndex = cleanId.indexOf(':');
    if (colonIndex === -1) return of(null);

    const ontologyPrefix = cleanId.substring(0, colonIndex).toLowerCase();
    const url = `${this.OLS_API_BASE}/${ontologyPrefix}/terms?obo_id=${encodeURIComponent(cleanId)}`;

    const request$ = this.http.get<OlsApiResponse>(url).pipe(
      map((response): Ols | null => {
        const term = response._embedded?.terms?.[0];
        if (!term) return null;

        const description = Array.isArray(term.description)
          ? term.description[0]
          : (term.description ?? '');

        return {
          id: cleanId,
          label: term.label ?? '',
          description,
        };
      }),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.olsCache.set(cleanId, request$);
    return request$;
  }
}
