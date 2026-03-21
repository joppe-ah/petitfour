import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { cookbookFeature } from './store/cookbook.reducer';
import * as CookbookEffects from './store/cookbook.effects';

export const COOKBOOK_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState(cookbookFeature),
      provideEffects(CookbookEffects),
    ],
    loadComponent: () =>
      import('./cookbook').then((m) => m.CookbookComponent),
  },
];
