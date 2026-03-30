export interface Terminology {
  readonly short_name: string;
  readonly name: string;
}

export interface Concept {
  readonly concept_identifier: string;
  readonly pref_label: string;
  readonly terminology: Terminology;
}

export interface Mapping {
  readonly concept: Concept;
  readonly text: string;
  readonly similarity: number;
}

export interface Response {
  readonly variable: string;
  readonly description: string;
  readonly mappings: Mapping[];
}

export type StreamingResponse =
  | { type: 'metadata'; expected_total: number }
  | ({ type: 'result' } & Response)
  | { type: 'error'; message: string };
