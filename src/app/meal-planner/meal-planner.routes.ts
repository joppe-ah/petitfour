import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { plannerFeature } from './store/planner.reducer';
import * as PlannerEffects from './store/planner.effects';

export const MEAL_PLANNER_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(plannerFeature), provideEffects(PlannerEffects)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./meal-planner.component').then(m => m.MealPlannerComponent),
      },
      {
        path: 'shopping',
        loadComponent: () =>
          import('./components/shopping-list/shopping-list.component').then(
            m => m.ShoppingListComponent
          ),
      },
    ],
  },
];
