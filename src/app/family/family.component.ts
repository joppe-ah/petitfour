import { Component } from '@angular/core';
import { CardComponent } from '../shared/components/card/card';
import { BadgeComponent } from '../shared/components/badge/badge';

@Component({
  selector: 'app-family',
  imports: [CardComponent, BadgeComponent],
  template: `
    <div class="p-6">
      <h1 class="text-base text-pf-text mb-1">Family</h1>
      <p class="text-xs text-pf-subtle mb-6">Shared planner &amp; tasks</p>

      <pf-card>
        <div class="flex items-center gap-3">
          <span class="text-xl">◉</span>
          <div>
            <p class="text-sm text-pf-text">Coming soon</p>
            <p class="text-xs text-pf-muted mt-0.5">
              Family planning, shared tasks and more
            </p>
          </div>
          <pf-badge class="ml-auto">Soon</pf-badge>
        </div>
      </pf-card>
    </div>
  `,
})
export class FamilyComponent {}
