import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  toast = signal<Toast | null>(null);

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = ++this.counter;
    this.toast.set({ message, type, id });
    setTimeout(() => {
      if (this.toast()?.id === id) this.toast.set(null);
    }, 2000);
  }
}
