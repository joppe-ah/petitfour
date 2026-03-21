import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'cookbook',
        loadChildren: () =>
          import('./cookbook/cookbook.routes').then((m) => m.COOKBOOK_ROUTES),
      },
      {
        path: 'money',
        loadChildren: () =>
          import('./money-tracker/money-tracker.routes').then(
            (m) => m.MONEY_TRACKER_ROUTES,
          ),
      },
      {
        path: 'family',
        loadComponent: () =>
          import('./family/family.component').then((m) => m.FamilyComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
