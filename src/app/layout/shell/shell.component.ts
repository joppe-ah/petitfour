import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TabBarComponent } from '../tab-bar/tab-bar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TabBarComponent],
  template: `
    <div class="flex h-screen bg-pf-bg overflow-hidden">
      <!-- Sidebar — desktop only (md+) -->
      <app-sidebar class="hidden md:flex" />

      <!-- Main content area -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>

        <!-- Tab bar — mobile only -->
        <app-tab-bar class="md:hidden" />
      </div>
    </div>
  `,
})
export class ShellComponent {}
