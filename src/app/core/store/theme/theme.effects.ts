import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { ThemeActions } from './theme.actions';
import { selectTheme } from './theme.reducer';

/** Apply .dark class + sync localStorage after setTheme */
export const setThemeSideEffect$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ThemeActions.setTheme),
      tap(({ theme, isSystemControlled }) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        if (isSystemControlled) {
          localStorage.removeItem('pf-theme');
        } else {
          localStorage.setItem('pf-theme', theme);
        }
      }),
    ),
  { functional: true, dispatch: false },
);

/** Apply .dark class + save to localStorage after manual toggle */
export const toggleThemeSideEffect$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) =>
    actions$.pipe(
      ofType(ThemeActions.toggleTheme),
      // State is already updated by reducer before effect runs
      withLatestFrom(store.select(selectTheme)),
      tap(([, theme]) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('pf-theme', theme);
      }),
    ),
  { functional: true, dispatch: false },
);

/** Convert resetToSystemTheme → setTheme with current OS preference */
export const resetToSystem$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ThemeActions.resetToSystemTheme),
      map(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return ThemeActions.setTheme({
          theme: prefersDark ? 'dark' : 'light',
          isSystemControlled: true,
        });
      }),
    ),
  { functional: true },
);
