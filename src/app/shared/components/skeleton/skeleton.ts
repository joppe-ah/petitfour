import { Component, input } from '@angular/core';

@Component({
  selector: 'pf-skeleton',
  template: `
    <div
      class="bg-pf-border rounded-[8px] animate-skeleton"
      [style.width]="width()"
      [style.height]="height()"
    ></div>
  `,
  styles: [`
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.5; }
      50%       { opacity: 1;   }
    }
    .animate-skeleton {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
  `],
})
export class SkeletonComponent {
  width  = input('100%');
  height = input('1rem');
}
