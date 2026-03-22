import { Component, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PadelActions } from '../../store/padel.actions';
import { selectMatchesSortedDesc, selectPlayers } from '../../store/padel.selectors';
import { PadelMatch } from '../../models/match.model';
import { PadelPlayer } from '../../models/player.model';

@Component({
  selector: 'app-padel-matches',
  template: `
    <div class="relative">
      <!-- Match list -->
      <div class="p-4 pb-24 space-y-3">
        @for (match of matches(); track match.id) {
          <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
            <!-- Header: date + location -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <div class="text-xs text-pf-muted">{{ formatDate(match.date) }}</div>
                <div class="text-xs text-pf-subtle mt-0.5">📍 {{ match.location }}</div>
              </div>
              <button
                (click)="deleteMatch(match)"
                class="text-pf-muted text-xs hover:text-red-500 transition-colors p-1"
              >✕</button>
            </div>

            <!-- Teams -->
            <div class="flex items-center gap-3">
              <!-- Team A -->
              <div class="flex-1 text-center">
                <div class="flex justify-center gap-1 mb-1">
                  @for (pid of [match.teamA.player1Id, match.teamA.player2Id]; track pid) {
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                      [style.background]="getPlayer(pid)?.color ?? '#888'"
                    >{{ getPlayer(pid)?.avatarInitials ?? '?' }}</div>
                  }
                </div>
                <div class="text-[11px] text-pf-muted">
                  {{ getPlayer(match.teamA.player1Id)?.name }} &amp; {{ getPlayer(match.teamA.player2Id)?.name }}
                </div>
              </div>

              <!-- Score -->
              <div class="flex flex-col items-center gap-0.5">
                @for (set of match.sets; track $index) {
                  <div class="flex gap-2 text-sm font-[600]">
                    <span [class]="set.teamAScore > set.teamBScore ? 'text-pf-text' : 'text-pf-muted'">{{ set.teamAScore }}</span>
                    <span class="text-pf-border">–</span>
                    <span [class]="set.teamBScore > set.teamAScore ? 'text-pf-text' : 'text-pf-muted'">{{ set.teamBScore }}</span>
                  </div>
                }
                <div class="text-[10px] mt-1" [class]="match.winner === 'teamA' ? 'text-[#1D9E75]' : 'text-[#D85A30]'">
                  {{ match.winner === 'teamA' ? '← Win' : 'Win →' }}
                </div>
              </div>

              <!-- Team B -->
              <div class="flex-1 text-center">
                <div class="flex justify-center gap-1 mb-1">
                  @for (pid of [match.teamB.player1Id, match.teamB.player2Id]; track pid) {
                    <div
                      class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                      [style.background]="getPlayer(pid)?.color ?? '#888'"
                    >{{ getPlayer(pid)?.avatarInitials ?? '?' }}</div>
                  }
                </div>
                <div class="text-[11px] text-pf-muted">
                  {{ getPlayer(match.teamB.player1Id)?.name }} &amp; {{ getPlayer(match.teamB.player2Id)?.name }}
                </div>
              </div>
            </div>
          </div>
        }

        @if (matches().length === 0) {
          <div class="text-center py-16 text-pf-muted text-sm">No matches yet. Add your first match!</div>
        }
      </div>
    </div>
  `,
})
export class MatchesComponent {
  addClicked = output<void>();

  private store = inject(Store);

  matches = this.store.selectSignal(selectMatchesSortedDesc);
  players = this.store.selectSignal(selectPlayers);

  getPlayer(id: string): PadelPlayer | undefined {
    return this.players().find((p) => p.id === id);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  deleteMatch(match: PadelMatch) {
    this.store.dispatch(PadelActions.deleteMatch({ id: match.id }));
  }
}
