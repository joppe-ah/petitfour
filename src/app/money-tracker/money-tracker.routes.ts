import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moneyFeature } from './store/money.reducer';
import * as MoneyEffects from './store/money.effects';

export const MONEY_TRACKER_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(moneyFeature), provideEffects(MoneyEffects)],
    loadComponent: () => import('./money-tracker.component').then((m) => m.MoneyTrackerComponent),
  },
];
