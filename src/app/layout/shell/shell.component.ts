import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TabBarComponent } from '../tab-bar/tab-bar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { SettingsModalComponent } from '../../settings/components/settings-modal/settings-modal.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TabBarComponent, ToastComponent, SettingsModalComponent],
  template: `
    <div class="flex h-screen bg-pf-bg overflow-hidden">
      <!-- Sidebar — desktop only (md+) -->
      <app-sidebar class="hidden md:flex" />

      <!-- Main content area -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <main class="flex-1 min-h-0 overflow-y-auto">
          <router-outlet />
        </main>

        <!-- Tab bar — mobile only -->
        <app-tab-bar class="md:hidden" />
      </div>

      <pf-toast />
      <app-settings-modal />
    </div>
  `,
})
export class ShellComponent {}
