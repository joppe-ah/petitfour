import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { PadelActions } from './store/padel.actions';
import { MatchesComponent } from './components/matches/matches.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { PlayersComponent } from './components/players/players.component';
import { StatsComponent } from './components/stats/stats.component';
import { AddMatchComponent } from './components/add-match/add-match.component';

type Tab = 'matches' | 'leaderboard' | 'players' | 'stats';

@Component({
  selector: 'app-padel',
  imports: [MatchesComponent, LeaderboardComponent, PlayersComponent, StatsComponent, AddMatchComponent],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 class="text-xl font-semibold text-pf-text">Padel</h1>
        @if (activeTab() === 'matches') {
          <button
            (click)="showAddMatch.set(true)"
            class="w-9 h-9 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xl leading-none"
          >+</button>
        }
      </div>

      <!-- Tab bar -->
      <div class="flex border-b border-pf-border px-4">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="flex-1 py-2.5 text-xs font-[450] transition-colors border-b-2 -mb-[1px]"
            [class]="activeTab() === tab.id
              ? 'border-[#1D9E75] text-[#1D9E75]'
              : 'border-transparent text-pf-muted'"
          >{{ tab.label }}</button>
        }
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto">
        @switch (activeTab()) {
          @case ('matches') { <app-padel-matches /> }
          @case ('leaderboard') { <app-padel-leaderboard /> }
          @case ('players') { <app-padel-players /> }
          @case ('stats') { <app-padel-stats /> }
        }
      </div>
    </div>

    @if (showAddMatch()) {
      <app-add-match (closed)="showAddMatch.set(false)" />
    }
  `,
})
export class PadelComponent implements OnInit {
  private store = inject(Store);

  activeTab = signal<Tab>('leaderboard');
  showAddMatch = signal(false);

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'matches', label: 'Matches' },
    { id: 'players', label: 'Players' },
    { id: 'stats', label: 'Stats' },
  ];

  ngOnInit() {
    this.store.dispatch(PadelActions.loadPadelData());
  }
}
