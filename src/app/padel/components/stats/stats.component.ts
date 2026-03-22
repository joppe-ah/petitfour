import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  selectLeaderboard,
  selectMatchesThisMonth,
  selectMostActivePartnership,
  selectTotalMatchesPlayed,
} from '../../store/padel.selectors';

@Component({
  selector: 'app-padel-stats',
  template: `
    <div class="p-4 space-y-4">
      <!-- Summary cards -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
          <div class="text-2xl font-semibold text-pf-text">{{ totalMatches() }}</div>
          <div class="text-xs text-pf-muted mt-1">Total matches</div>
        </div>
        <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
          <div class="text-2xl font-semibold text-pf-text">{{ thisMonth().length }}</div>
          <div class="text-xs text-pf-muted mt-1">This month</div>
        </div>
        @if (bestPartnership()) {
          <div class="col-span-2 bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
            <div class="text-xs text-pf-muted mb-1">Most active pair</div>
            <div class="font-[500] text-sm text-pf-text">
              {{ bestPartnership()!.names[0] }} &amp; {{ bestPartnership()!.names[1] }}
            </div>
            <div class="text-xs text-pf-muted">{{ bestPartnership()!.count }} matches together</div>
          </div>
        }
      </div>

      <!-- Win rate bars -->
      <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
        <h3 class="text-sm font-[500] text-pf-text mb-4">Win Rate</h3>
        <div class="space-y-3">
          @for (entry of leaderboard(); track entry.playerId) {
            <div>
              <div class="flex justify-between items-center mb-1">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                    [style.background]="entry.player.color"
                  >{{ entry.player.avatarInitials }}</div>
                  <span class="text-xs text-pf-text">{{ entry.player.name }}</span>
                </div>
                <span class="text-xs font-semibold text-pf-text">{{ entry.winRate }}%</span>
              </div>
              <div class="h-1.5 bg-pf-bg rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  [style.width.%]="entry.winRate"
                  [style.background]="entry.player.color"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Matches played bars -->
      <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
        <h3 class="text-sm font-[500] text-pf-text mb-4">Matches Played</h3>
        <div class="space-y-3">
          @for (entry of leaderboard(); track entry.playerId) {
            <div>
              <div class="flex justify-between items-center mb-1">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                    [style.background]="entry.player.color"
                  >{{ entry.player.avatarInitials }}</div>
                  <span class="text-xs text-pf-text">{{ entry.player.name }}</span>
                </div>
                <span class="text-xs font-semibold text-pf-text">{{ entry.matches }}</span>
              </div>
              <div class="h-1.5 bg-pf-bg rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  [style.width.%]="maxMatches() > 0 ? (entry.matches / maxMatches()) * 100 : 0"
                  [style.background]="entry.player.color"
                ></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class StatsComponent {
  private store = inject(Store);

  leaderboard = this.store.selectSignal(selectLeaderboard);
  totalMatches = this.store.selectSignal(selectTotalMatchesPlayed);
  thisMonth = this.store.selectSignal(selectMatchesThisMonth);
  bestPartnership = this.store.selectSignal(selectMostActivePartnership);

  maxMatches(): number {
    return Math.max(0, ...this.leaderboard().map((e) => e.matches));
  }
}
