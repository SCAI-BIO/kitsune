import { Routes } from '@angular/router';

import { ChordDiagramComponent } from './chord-diagram/chord-diagram.component';
import { CoreModelComponent } from './core-model/core-model.component';
import { CoreModelAdminComponent } from './core-model-admin/core-model-admin.component';
import { canActivateAuthRole } from './guards/auth-role.guard';
import { HarmonizeComponent } from './harmonize/harmonize.component';
import { HomeComponent } from './home/home.component';
import { QueryComponent } from './query/query.component';
import { TsneComponent } from './tsne/tsne.component';

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
    path: 'core-model',
    component: CoreModelComponent,
  },
  {
    path: 'core-model/admin',
    component: CoreModelAdminComponent,
    canActivate: [canActivateAuthRole],
    data: { role: 'admin' },
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
