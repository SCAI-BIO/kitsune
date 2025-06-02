export interface OhdsiApiResponse {
  name?: string;
  domainId?: string;
}

export interface OlsApiEmbeddedTerm {
  label: string;
  description: string | string[];
}

export interface OlsApiEmbedded {
  terms: OlsApiEmbeddedTerm[];
}

export interface OlsApiResponse {
  _embedded: OlsApiEmbedded;
}
