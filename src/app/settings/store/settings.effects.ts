import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SettingsActions } from './settings.actions';
import { selectLanguage, selectNotifications, selectWidgets } from './settings.selectors';
import { Language, NotificationPreferences, WidgetVisibility } from './settings.state';

const STORAGE_KEY = 'pf-settings';

@Injectable()
export class SettingsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  // Load persisted settings on any settings action (triggers once on first open)
  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SettingsActions.openSettings),
      switchMap(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return EMPTY;
          const saved = JSON.parse(raw);
          return [
            SettingsActions.loadSavedSettingsSuccess({
              language: saved.language ?? 'en',
              notifications: saved.notifications ?? { newRecipes: true, budgetAlerts: true, mealReminders: true },
              widgets: saved.widgets ?? { showCookbook: true, showMoney: true, showPlanner: true },
            }),
          ];
        } catch {
          return EMPTY;
        }
      }),
    ),
  );

  // Persist whenever relevant settings change
  persistLanguage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SettingsActions.setLanguage, SettingsActions.updateNotificationPreferences, SettingsActions.toggleWidget, SettingsActions.resetDashboardWidgets),
        withLatestFrom(
          this.store.select(selectLanguage),
          this.store.select(selectNotifications),
          this.store.select(selectWidgets),
        ),
        tap(([, language, notifications, widgets]) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ language, notifications, widgets }));
          } catch { /* ignore quota errors */ }
        }),
      ),
    { dispatch: false },
  );
}
