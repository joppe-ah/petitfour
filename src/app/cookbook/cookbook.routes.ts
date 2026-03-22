import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { cookbookFeature } from './store/cookbook.reducer';
import * as CookbookEffects from './store/cookbook.effects';

export const COOKBOOK_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(cookbookFeature), provideEffects(CookbookEffects)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./cookbook.component').then((m) => m.CookbookComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./pages/recipe-form/recipe-form.component').then(
            (m) => m.RecipeFormComponent,
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./pages/recipe-form/recipe-form.component').then(
            (m) => m.RecipeFormComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/recipe-detail/recipe-detail.component').then(
            (m) => m.RecipeDetailComponent,
          ),
      },
    ],
  },
];
