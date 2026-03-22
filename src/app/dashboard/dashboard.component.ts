import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../shared/components/card/card';

interface FeatureCard {
  path: string;
  icon: string;
  title: string;
  description: string;
  accent: string;
  soon?: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CardComponent],
  template: `
    <div class="p-6 max-w-2xl">
      <h1 class="text-base text-pf-text mb-1">Good day</h1>
      <p class="text-sm text-pf-subtle mb-6">Your family app</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        @for (card of cards; track card.path) {
          @if (card.soon) {
            <pf-card>
              <div class="flex items-start gap-3 opacity-50">
                <span class="text-xl leading-none mt-0.5">{{ card.icon }}</span>
                <div>
                  <p class="text-sm text-pf-text">{{ card.title }}</p>
                  <p class="text-xs text-pf-muted mt-0.5">{{ card.description }}</p>
                </div>
              </div>
            </pf-card>
          } @else {
            <a [routerLink]="card.path">
              <pf-card>
                <div class="flex items-start gap-3">
                  <span class="text-xl leading-none mt-0.5">{{ card.icon }}</span>
                  <div>
                    <p class="text-sm text-pf-text">{{ card.title }}</p>
                    <p class="text-xs text-pf-subtle mt-0.5">{{ card.description }}</p>
                  </div>
                </div>
              </pf-card>
            </a>
          }
        }
      </div>
    </div>
  `,
})
export class DashboardComponent {
  cards: FeatureCard[] = [
    {
      path: '/cookbook',
      icon: '◎',
      title: 'Cookbook',
      description: 'Recipes & meal ideas',
      accent: 'teal',
    },
    {
      path: '/money',
      icon: '◈',
      title: 'Money Tracker',
      description: 'Income & expenses',
      accent: 'amber',
    },
    {
      path: '/padel',
      icon: '◎',
      title: 'Padel',
      description: 'Matches & leaderboard',
      accent: 'teal',
    },
    {
      path: '/family',
      icon: '◉',
      title: 'Family',
      description: 'Planner & shared tasks',
      accent: 'default',
      soon: true,
    },
  ];
}
