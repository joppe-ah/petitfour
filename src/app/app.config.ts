import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ActionReducer } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore, Store } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { localStorageSync } from 'ngrx-store-localstorage';
import { filter, take } from 'rxjs/operators';

import { routes } from './app.routes';
import { ThemeService } from './core/services/theme.service';
import { appReducers } from './core/store/app.reducer';
import * as ThemeEffects from './core/store/theme/theme.effects';
import { AuthEffects } from './auth/store/auth.effects';
import { AuthActions } from './auth/store/auth.actions';
import { selectAuthInitialized } from './auth/store/auth.selectors';
import { SettingsEffects } from './settings/store/settings.effects';

/**
 * Meta-reducer: persists auth state to sessionStorage so NgRx survives
 * hot reloads (HMR) and manual page refreshes.
 *
 * What gets persisted (sessionStorage — clears when browser is fully closed):
 *   auth.isAuthenticated, auth.profile, auth.family, auth.familyMembers
 *
 * What is intentionally NOT persisted:
 *   auth.authInitialized  — always starts false; becomes true after initAuth
 *   auth.loading, auth.error — transient UI states
 *   cookbook, planner, money — always fetched fresh from Supabase
 */
function sessionStorageSyncReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return localStorageSync({
    keys: [
      { auth: ['isAuthenticated', 'user', 'profile', 'family', 'familyMembers'] },
    ],
    rehydrate: true,
    storage: sessionStorage,
    storageKeySerializer: (key) => `pf-ngrx-${key}`,
  })(reducer);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // NgRx — root store with sessionStorage rehydration for auth
    provideStore(appReducers, {
      metaReducers: [sessionStorageSyncReducer],
    }),
    provideEffects(ThemeEffects, AuthEffects, SettingsEffects),
    provideRouterStore(),

    // NgRx DevTools (dev only)
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      name: 'PetitFour',
      connectInZone: true,
    }),

    // Theme: initialize synchronously before first render
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService) => () => themeService.init(),
      deps: [ThemeService],
      multi: true,
    },

    // Auth: dispatch initAuth AND wait for it to complete before routing starts.
    // This prevents any route guard from running while auth state is unknown,
    // eliminating the flash-redirect-to-login on every hot reload.
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => () => {
        store.dispatch(AuthActions.initAuth());
        return new Promise<void>((resolve) => {
          store
            .select(selectAuthInitialized)
            .pipe(
              filter((initialized) => initialized),
              take(1),
            )
            .subscribe(() => resolve());
        });
      },
      deps: [Store],
      multi: true,
    },
  ],
};
