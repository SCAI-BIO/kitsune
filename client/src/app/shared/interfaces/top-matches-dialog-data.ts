import type { Mapping } from './mapping';

export interface TopMatchesDialogData {
  readonly matches: Mapping[];
  readonly terminology: string;
  readonly variable: string;
}
