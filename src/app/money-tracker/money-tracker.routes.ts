import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { moneyFeature } from './store/money.reducer';

export const MONEY_TRACKER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState(moneyFeature),
      provideEffects(),
    ],
    loadComponent: () =>
      import('./money-tracker.component').then((m) => m.MoneyTrackerComponent),
  },
];
