import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { QueryComponent } from './query/query.component';
import { HarmonizeComponent } from './harmonize/harmonize.component';
import { TsneComponent } from './tsne/tsne.component';
import { CoreModelTableComponent } from './core-model-table/core-model-table.component';
import { ChordDiagramComponent } from './chord-diagram/chord-diagram.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'query',
    component: QueryComponent,
  },
  {
    path: 'harmonize',
    component: HarmonizeComponent,
  },
  {
    path: 't-sne',
    component: TsneComponent,
  },
  {
    path: 'core-model-table',
    component: CoreModelTableComponent,
  },
  {
    path: 'core-model-chord-diagram',
    component: ChordDiagramComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
