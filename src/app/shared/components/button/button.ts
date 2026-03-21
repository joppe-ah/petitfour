import { Component, computed, input } from '@angular/core';

type Variant = 'primary' | 'secondary' | 'ghost';

@Component({
  selector: 'pf-button',
  template: `
    <button [class]="cls()" [disabled]="disabled()">
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  variant = input<Variant>('primary');
  disabled = input(false);

  cls = computed(() => {
    const base =
      'inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm transition-colors ' +
      'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
    const v = this.variant();
    if (v === 'primary')
      return `${base} bg-pf-text text-pf-bg hover:opacity-80`;
    if (v === 'secondary')
      return `${base} border border-[0.5px] border-pf-border text-pf-text hover:bg-pf-bg`;
    // ghost
    return `${base} text-pf-subtle hover:text-pf-text hover:bg-pf-bg`;
  });
}
