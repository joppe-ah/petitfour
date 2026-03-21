import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './shared/components/nav/nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  template: `
    <app-nav />
    <main class="min-h-screen bg-gray-50">
      <router-outlet />
    </main>
  `,
})
export class App {}
