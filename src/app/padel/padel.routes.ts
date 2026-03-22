import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { PadelEffects } from './store/padel.effects';
import { padelFeature } from './store/padel.reducer';

export const PADEL_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(padelFeature), provideEffects(PadelEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./padel.component').then((m) => m.PadelComponent),
      },
      {
        path: 'players/:id',
        loadComponent: () =>
          import('./components/player-detail/player-detail.component').then((m) => m.PlayerDetailComponent),
      },
    ],
  },
];
