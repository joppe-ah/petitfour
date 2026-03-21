import { Component } from '@angular/core';

@Component({
  selector: 'pf-spinner',
  template: `
    <span
      class="inline-block w-4 h-4 border-2 border-pf-border border-t-pf-subtle
             rounded-full animate-spin"
      aria-label="Loading"
    ></span>
  `,
})
export class SpinnerComponent {}
