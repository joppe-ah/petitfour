import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface TabItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="flex border-t border-[0.5px] border-pf-border bg-pf-surface
             safe-area-inset-bottom"
    >
      @for (tab of tabs; track tab.path) {
        <a
          [routerLink]="tab.path"
          routerLinkActive="text-pf-text"
          class="flex-1 flex flex-col items-center gap-1 py-3 text-pf-muted
                 hover:text-pf-subtle transition-colors"
        >
          <span class="text-xl leading-none">{{ tab.icon }}</span>
          <span class="text-[10px]">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class TabBarComponent {
  tabs: TabItem[] = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/cookbook', label: 'Cookbook', icon: '◎' },
    { path: '/money', label: 'Money', icon: '◈' },
    { path: '/family', label: 'Family', icon: '◉' },
  ];
}
