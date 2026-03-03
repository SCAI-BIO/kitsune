export interface Ols {
  id: string;
  label: string;
  description?: string;
}

export interface Ohdsi {
  id: string;
  label: string;
  domain: string;
}

export interface Study {
  name: string;
  label: string;
  description?: string;
}

export interface CoreModel {
  id: string;
  label: string;
  description: string;
  ols: Ols;
  ohdsi: Ohdsi;
  studies: Study[];
}
