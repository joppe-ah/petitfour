import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'pf-toast',
  template: `
    @if (toastService.toast(); as t) {
      <div
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-[450] shadow-lg transition-all duration-200"
        [class]="toastClass(t.type)"
      >
        {{ t.message }}
      </div>
    }
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);

  toastClass(type: string): string {
    if (type === 'success') return 'bg-[#1D9E75] text-white';
    if (type === 'error') return 'bg-[#993556] text-white';
    return 'bg-[#1a1a1a] text-white dark:bg-[#f0f0ee] dark:text-[#1a1a1a]';
  }
}
