import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthInitialized } from './auth/store/auth.selectors';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (!authInitialized()) {
      <div class="fixed inset-0 bg-pf-bg flex items-center justify-center z-50">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
          <p class="text-[11px] text-pf-muted">Loading…</p>
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  authInitialized = inject(Store).selectSignal(selectAuthInitialized);
}
