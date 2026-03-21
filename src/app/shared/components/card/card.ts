import { Component, input } from '@angular/core';

@Component({
  selector: 'pf-card',
  template: `
    <div
      class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border"
      [class]="padding() ? 'p-4' : ''"
    >
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  padding = input(true);
}
