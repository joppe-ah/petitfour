import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { cookbookFeature } from './store/cookbook.reducer';

export const COOKBOOK_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState(cookbookFeature),
      provideEffects(), // effects can be added here as the feature grows
    ],
    loadComponent: () =>
      import('./cookbook.component').then((m) => m.CookbookComponent),
  },
];
