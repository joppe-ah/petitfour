import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        (m) => m.DASHBOARD_ROUTES,
      ),
  },
  {
    path: 'cookbook',
    loadChildren: () =>
      import('./features/cookbook/cookbook.routes').then(
        (m) => m.COOKBOOK_ROUTES,
      ),
  },
  {
    path: 'money-tracker',
    loadChildren: () =>
      import('./features/money-tracker/money-tracker.routes').then(
        (m) => m.MONEY_TRACKER_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
