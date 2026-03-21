import { Component, computed, input } from '@angular/core';

type BadgeColor = 'teal' | 'amber' | 'default';

@Component({
  selector: 'pf-badge',
  template: `<span [class]="cls()"><ng-content /></span>`,
})
export class BadgeComponent {
  color = input<BadgeColor>('default');

  cls = computed(() => {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-[20px] text-xs';
    const c = this.color();
    if (c === 'teal')
      return `${base} text-pf-teal border border-[0.5px] border-pf-teal/30 bg-pf-teal/10`;
    if (c === 'amber')
      return `${base} text-pf-amber border border-[0.5px] border-pf-amber/30 bg-pf-amber/10`;
    return `${base} text-pf-subtle border border-[0.5px] border-pf-border bg-pf-surface`;
  });
}
