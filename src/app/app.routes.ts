import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  // Auth routes — outside shell (no sidebar / tab-bar)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // App shell — protected by auth guard
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
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
        path: 'planner',
        loadChildren: () =>
          import('./meal-planner/meal-planner.routes').then(
            (m) => m.MEAL_PLANNER_ROUTES,
          ),
      },
      {
        path: 'family',
        loadComponent: () =>
          import('./family/family.component').then((m) => m.FamilyComponent),
      },
      {
        path: 'padel',
        loadChildren: () =>
          import('./padel/padel.routes').then((m) => m.PADEL_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
