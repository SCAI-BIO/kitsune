import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import { Observable, of, tap } from 'rxjs';

import type {
  Mapping,
  Response,
  Terminology,
  StreamingResponse,
} from '../../shared/interfaces/mapping';
import { environment } from '../../../environments/environment';

interface CacheItem<T> {
  readonly data: T;
  readonly timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class MappingsApi {
  private readonly API_URL = environment.openApiUrl;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
  private readonly embeddingModelsCache = signal<CacheItem<string[]> | null>(null);
  private readonly http = inject(HttpClient);
  private readonly terminologiesCache = signal<CacheItem<Terminology[]> | null>(null);

  clearCache(): void {
    this.embeddingModelsCache.set(null);
    this.terminologiesCache.set(null);
  }

  fetchClosestMappingsDictionary(formData: FormData): Observable<Response[]> {
    return this.http.post<Response[]>(`${this.API_URL}/mappings/dict`, formData, {
      headers: new HttpHeaders({ Accept: 'application/json' }),
    });
  }

  fetchClosestMappingsQuery(formData: FormData): Observable<Mapping[]> {
    return this.http.post<Mapping[]>(`${this.API_URL}/mappings/`, formData, {
      headers: new HttpHeaders({ Accept: 'application/json' }),
    });
  }

  fetchEmbeddingModels(): Observable<string[]> {
    const cached = this.embeddingModelsCache();

    if (cached && Date.now() - cached.timestamp <= this.CACHE_TTL) {
      return of(cached.data);
    }

    return this.http
      .get<string[]>(`${this.API_URL}/models/`)
      .pipe(tap((data) => this.embeddingModelsCache.set({ data, timestamp: Date.now() })));
  }

  fetchTerminologies(): Observable<Terminology[]> {
    const cached = this.terminologiesCache();

    if (cached && Date.now() - cached.timestamp <= this.CACHE_TTL) {
      return of(cached.data);
    }

    return this.http
      .get<Terminology[]>(`${this.API_URL}/terminologies/`)
      .pipe(tap((data) => this.terminologiesCache.set({ data, timestamp: Date.now() })));
  }

  fetchTSNE(): Observable<string> {
    return this.http.get(`${this.API_URL}/visualization/`, {
      responseType: 'text',
    });
  }

  streamClosestMappingsDictionary(
    file: File,
    metadata: {
      model: string;
      terminology_name: string;
      variable_field: string;
      description_field: string;
      limit: number;
    },
  ): Observable<StreamingResponse> {
    const url = new URL(`${this.API_URL}/mappings/dict/ws`);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

    return new Observable<StreamingResponse>((observer) => {
      const socket = new WebSocket(url.toString());
      socket.binaryType = 'arraybuffer';

      socket.onopen = () => {
        file
          .arrayBuffer()
          .then((buffer) => {
            socket.send(buffer);

            const metadataPayload = {
              ...metadata,
              file_extension: `.${file.name.split('.').pop()}`,
            };
            socket.send(JSON.stringify(metadataPayload));
          })
          .catch((error) => observer.error(error));
      };

      socket.onmessage = (event) => observer.next(JSON.parse(event.data));
      socket.onerror = (error) => observer.error(error);
      socket.onclose = () => observer.complete();

      return () => socket.close();
    });
  }
}
