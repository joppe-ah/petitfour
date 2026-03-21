import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { moneyTrackerFeature } from './store/money-tracker.reducer';
import * as MoneyTrackerEffects from './store/money-tracker.effects';

export const MONEY_TRACKER_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideState(moneyTrackerFeature),
      provideEffects(MoneyTrackerEffects),
    ],
    loadComponent: () =>
      import('./money-tracker').then((m) => m.MoneyTrackerComponent),
  },
];
