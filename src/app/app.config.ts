import {
  APP_INITIALIZER,
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { ThemeService } from './core/services/theme.service';
import { appReducers } from './core/store/app.reducer';
import * as ThemeEffects from './core/store/theme/theme.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // NgRx — root store with theme + router state
    provideStore(appReducers),
    provideEffects(ThemeEffects),
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
  ],
};
