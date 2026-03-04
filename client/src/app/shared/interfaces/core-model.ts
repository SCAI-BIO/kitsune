export interface Ols {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export interface Ohdsi {
  readonly id: string;
  readonly label: string;
  readonly domain: string;
}

export interface Study {
  readonly name: string;
  label: string;
  description?: string;
}

export interface CoreModel {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly ols: Ols;
  readonly ohdsi: Ohdsi;
  readonly studies: Study[];
}
