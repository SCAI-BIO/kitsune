import { Routes } from '@angular/router';

import { ChordDiagram } from './features/chord-diagram/chord-diagram';
import { CoreModel } from './features/core-model/core-model/core-model';
import { CoreModelAdmin } from './features/core-model/core-model-admin/core-model-admin';
import { canActivateAuthRole } from './core/guards/auth-role.guard';
import { Harmonization } from './features/harmonization/harmonization';
import { Home } from './features/home/home';
import { SemanticSearch } from './features/semantic-search/semantic-search';
import { TsneVisualization } from './features/tsne-visualization/tsne-visualization';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'query',
    component: SemanticSearch,
  },
  {
    path: 'harmonize',
    component: Harmonization,
  },
  {
    path: 't-sne',
    component: TsneVisualization,
  },
  {
    path: 'core-model',
    component: CoreModel,
  },
  {
    path: 'core-model/admin',
    component: CoreModelAdmin,
    canActivate: [canActivateAuthRole],
    data: { role: 'admin' },
  },
  {
    path: 'core-model-chord-diagram',
    component: ChordDiagram,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
