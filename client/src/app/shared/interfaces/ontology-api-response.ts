export interface OhdsiApiResponse {
  readonly name?: string;
  readonly domainId?: string;
}

export interface OlsApiEmbeddedTerm {
  readonly label: string;
  readonly description: string | string[];
}

export interface OlsApiEmbedded {
  readonly terms: OlsApiEmbeddedTerm[];
}

export interface OlsApiResponse {
  readonly _embedded: OlsApiEmbedded;
}
