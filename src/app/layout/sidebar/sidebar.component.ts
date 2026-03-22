import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { selectProfile, selectFamily } from '../../auth/store/auth.selectors';
import { SettingsActions } from '../../settings/store/settings.actions';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent, AvatarComponent],
  template: `
    <aside
      class="w-[200px] flex flex-col shrink-0 border-r border-[0.5px] border-pf-border
             bg-pf-surface h-full"
    >
      <!-- Logo -->
      <div class="px-4 py-5 border-b border-[0.5px] border-pf-border">
        <span class="text-sm text-pf-text">
          PetitFour <span class="text-pf-muted">✦</span>
        </span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-3 flex flex-col gap-0.5">
        @for (item of navItems; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-pf-bg text-pf-text"
            class="flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm text-pf-subtle
                   hover:text-pf-text hover:bg-pf-bg transition-colors"
          >
            <span class="text-base leading-none">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- User profile area -->
      @if (profile(); as p) {
        <a
          routerLink="/profile"
          class="px-3 py-3 border-t border-[0.5px] border-pf-border flex items-center gap-2.5
                 hover:bg-pf-bg transition-colors"
        >
          <pf-avatar [profile]="p" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-[500] text-pf-text truncate">{{ p.name }}</p>
            @if (family(); as f) {
              <p class="text-[10px] text-pf-muted truncate">{{ f.name }}</p>
            }
          </div>
        </a>
      }

      <!-- Settings + theme -->
      <div class="px-3 py-3 border-t border-[0.5px] border-pf-border flex items-center gap-1">
        <button
          (click)="openSettings()"
          class="flex items-center gap-2 flex-1 px-2 py-1.5 rounded-[8px] text-xs text-pf-subtle
                 hover:text-pf-text hover:bg-pf-bg transition-colors"
        >
          <span class="text-sm leading-none">⚙</span>
          <span>Settings</span>
        </button>
        <pf-theme-toggle />
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  private store = inject(Store);

  openSettings() {
    this.store.dispatch(SettingsActions.openSettings({}));
  }

  profile = this.store.selectSignal(selectProfile);
  family = this.store.selectSignal(selectFamily);

  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/cookbook', label: 'Cookbook', icon: '◎' },
    { path: '/planner', label: 'Meal planner', icon: '◫' },
    { path: '/money', label: 'Money', icon: '◈' },
    { path: '/family', label: 'Family', icon: '◉' },
    { path: '/padel', label: 'Padel', icon: '🎾' },
  ];
}
