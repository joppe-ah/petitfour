import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectLeaderboard } from '../../store/padel.selectors';

@Component({
  selector: 'app-padel-leaderboard',
  template: `
    <div class="p-4 space-y-3">
      @for (entry of leaderboard(); track entry.playerId; let i = $index) {
        <button
          (click)="goToPlayer(entry.playerId)"
          class="w-full flex items-center gap-4 p-4 bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border text-left"
        >
          <!-- Rank -->
          <div class="w-8 text-center">
            @if (i === 0) {
              <span class="text-xl">🥇</span>
            } @else if (i === 1) {
              <span class="text-xl">🥈</span>
            } @else if (i === 2) {
              <span class="text-xl">🥉</span>
            } @else {
              <span class="text-sm font-semibold text-pf-muted">#{{ i + 1 }}</span>
            }
          </div>

          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            [style.background]="entry.player.color"
          >
            {{ entry.player.avatarInitials }}
          </div>

          <!-- Name + form -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-[500] text-pf-text text-sm">{{ entry.player.name }}</span>
              @if (entry.player.type === 'family') {
                <span class="text-[10px] bg-[#E1F5EE] dark:bg-[#1D9E7522] text-[#1D9E75] px-1.5 py-0.5 rounded-full">Family</span>
              }
            </div>
            <div class="flex gap-1 mt-1">
              @for (r of entry.recentForm; track $index) {
                <span
                  class="text-[10px] font-bold px-1 rounded"
                  [class]="r === 'W' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-[#FDE8E0] text-[#D85A30]'"
                >{{ r }}</span>
              }
            </div>
          </div>

          <!-- Stats -->
          <div class="text-right">
            <div class="text-lg font-semibold text-pf-text">{{ entry.winRate }}%</div>
            <div class="text-xs text-pf-muted">{{ entry.wins }}W {{ entry.losses }}L</div>
          </div>
        </button>
      }

      @if (leaderboard().length === 0) {
        <div class="text-center py-16 text-pf-muted text-sm">No matches recorded yet</div>
      }
    </div>
  `,
})
export class LeaderboardComponent {
  private store = inject(Store);
  private router = inject(Router);

  leaderboard = this.store.selectSignal(selectLeaderboard);

  goToPlayer(id: string) {
    this.router.navigate(['/padel/players', id]);
  }
}
