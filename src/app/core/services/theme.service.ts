import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Theme, ThemeActions } from '../store/theme/theme.actions';
import { selectIsSystemControlled, selectTheme } from '../store/theme/theme.selectors';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private store = inject(Store);

  /** Current theme as Observable — backed by the NgRx store */
  currentTheme$: Observable<Theme> = this.store.select(selectTheme);

  /**
   * Called via APP_INITIALIZER.
   * Applies the correct .dark class synchronously (zero FOUC),
   * then syncs NgRx state and wires up OS-preference change listener.
   */
  init(): void {
    const saved = localStorage.getItem('pf-theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme: Theme = saved ?? (systemPrefersDark ? 'dark' : 'light');
    const isSystemControlled = !saved;

    // Synchronous DOM apply — prevents any flash before Angular renders
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // Sync NgRx store (effects will keep localStorage in sync from here on)
    this.store.dispatch(ThemeActions.setTheme({ theme, isSystemControlled }));

    // Follow OS changes unless the user has manually overridden
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.store
        .select(selectIsSystemControlled)
        .pipe(take(1))
        .subscribe((isSystem) => {
          if (isSystem) {
            this.store.dispatch(
              ThemeActions.setTheme({
                theme: e.matches ? 'dark' : 'light',
                isSystemControlled: true,
              }),
            );
          }
        });
    });
  }

  toggle(): void {
    this.store.dispatch(ThemeActions.toggleTheme());
  }

  setTheme(theme: Theme): void {
    this.store.dispatch(ThemeActions.setTheme({ theme, isSystemControlled: false }));
  }

  resetToSystem(): void {
    this.store.dispatch(ThemeActions.resetToSystemTheme());
  }
}
