import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ThemeActions } from '../../../core/store/theme/theme.actions';
import { selectIsSystemControlled, selectTheme } from '../../../core/store/theme/theme.selectors';

@Component({
  selector: 'pf-theme-toggle',
  template: `
    <div class="flex flex-col gap-1">
      <button
        (click)="toggle()"
        class="flex items-center gap-2 px-3 py-1.5 rounded-[20px] border border-[0.5px]
               border-pf-border text-pf-subtle hover:text-pf-text hover:border-pf-subtle
               text-xs transition-colors w-full"
      >
        <span>{{ isDark() ? '☀' : '☽' }}</span>
        <span>{{ isDark() ? 'Light mode' : 'Dark mode' }}</span>
      </button>

      @if (!isSystemControlled()) {
        <button
          (click)="resetToSystem()"
          class="text-[11px] text-pf-muted hover:text-pf-subtle transition-colors px-1 text-left"
        >
          Reset to system
        </button>
      }
    </div>
  `,
})
export class ThemeToggleComponent {
  private store = inject(Store);

  theme = this.store.selectSignal(selectTheme);
  isSystemControlled = this.store.selectSignal(selectIsSystemControlled);
  isDark = computed(() => this.theme() === 'dark');

  toggle() {
    this.store.dispatch(ThemeActions.toggleTheme());
  }

  resetToSystem() {
    this.store.dispatch(ThemeActions.resetToSystemTheme());
  }
}
