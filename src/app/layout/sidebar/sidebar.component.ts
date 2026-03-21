import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
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

      <!-- Theme toggle -->
      <div class="px-3 py-4 border-t border-[0.5px] border-pf-border">
        <pf-theme-toggle />
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/cookbook', label: 'Cookbook', icon: '◎' },
    { path: '/money', label: 'Money', icon: '◈' },
    { path: '/family', label: 'Family', icon: '◉' },
  ];
}
