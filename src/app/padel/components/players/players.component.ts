import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectLeaderboard, selectPlayers } from '../../store/padel.selectors';

@Component({
  selector: 'app-padel-players',
  template: `
    <div class="p-4 grid grid-cols-2 gap-3">
      @for (player of players(); track player.id) {
        @let stats = getStats(player.id);
        <button
          (click)="goToPlayer(player.id)"
          class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4 text-left flex flex-col items-center gap-3"
        >
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold"
            [style.background]="player.color"
          >
            {{ player.avatarInitials }}
          </div>
          <div class="text-center">
            <div class="font-[500] text-sm text-pf-text">{{ player.name }}</div>
            <div class="text-xs text-pf-muted mt-0.5">
              @if (stats) {
                {{ stats.winRate }}% · {{ stats.matches }} played
              } @else {
                No matches yet
              }
            </div>
            @if (player.type === 'family') {
              <span class="text-[10px] bg-[#E1F5EE] dark:bg-[#1D9E7522] text-[#1D9E75] px-1.5 py-0.5 rounded-full mt-1 inline-block">
                Family
              </span>
            }
          </div>
          @if (stats) {
            <div class="flex gap-1">
              @for (r of stats.recentForm; track $index) {
                <span
                  class="text-[10px] font-bold px-1 rounded"
                  [class]="r === 'W' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-[#FDE8E0] text-[#D85A30]'"
                >{{ r }}</span>
              }
            </div>
          }
        </button>
      }
    </div>
  `,
})
export class PlayersComponent {
  private store = inject(Store);
  private router = inject(Router);

  players = this.store.selectSignal(selectPlayers);
  leaderboard = this.store.selectSignal(selectLeaderboard);

  getStats(playerId: string) {
    return this.leaderboard().find((e) => e.playerId === playerId);
  }

  goToPlayer(id: string) {
    this.router.navigate(['/padel/players', id]);
  }
}
