import { Component, input, output } from '@angular/core';

@Component({
  selector: 'pf-input',
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label class="text-xs text-pf-subtle">{{ label() }}</label>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        class="w-full px-3 py-2 rounded-[8px] border border-[0.5px] border-pf-border
               bg-pf-surface text-pf-text text-sm placeholder:text-pf-muted
               focus:outline-none focus:border-pf-subtle transition-colors"
      />
    </div>
  `,
})
export class InputComponent {
  label = input('');
  type = input('text');
  placeholder = input('');
  value = input('');
  valueChange = output<string>();

  onInput(e: Event) {
    this.valueChange.emit((e.target as HTMLInputElement).value);
  }
}
