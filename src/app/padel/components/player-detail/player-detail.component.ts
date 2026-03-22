import { Component, inject, input, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectMatches, selectPlayerById, selectPlayerStatsById, selectPlayers } from '../../store/padel.selectors';
import { PadelMatch } from '../../models/match.model';

@Component({
  selector: 'app-player-detail',
  template: `
    @if (player()) {
      <div class="min-h-screen bg-pf-bg">
        <!-- Header -->
        <div class="flex items-center gap-3 p-4 border-b border-pf-border bg-pf-surface">
          <button (click)="back()" class="text-pf-muted text-xl leading-none">←</button>
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            [style.background]="player()!.color"
          >{{ player()!.avatarInitials }}</div>
          <div>
            <div class="font-[500] text-pf-text">{{ player()!.name }}</div>
            <div class="text-xs text-pf-muted">{{ player()!.type === 'family' ? 'Family member' : 'External player' }}</div>
          </div>
        </div>

        @if (stats()) {
          <div class="p-4 space-y-4">
            <!-- Key stats row -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-3 text-center">
                <div class="text-2xl font-semibold text-pf-text">{{ stats()!.winRate }}%</div>
                <div class="text-[11px] text-pf-muted">Win rate</div>
              </div>
              <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-3 text-center">
                <div class="text-2xl font-semibold text-pf-text">{{ stats()!.matches }}</div>
                <div class="text-[11px] text-pf-muted">Played</div>
              </div>
              <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-3 text-center">
                <div class="text-2xl font-semibold" [class]="stats()!.currentStreak > 0 ? 'text-[#1D9E75]' : stats()!.currentStreak < 0 ? 'text-[#D85A30]' : 'text-pf-muted'">
                  {{ stats()!.currentStreak > 0 ? '+' : '' }}{{ stats()!.currentStreak }}
                </div>
                <div class="text-[11px] text-pf-muted">Streak</div>
              </div>
            </div>

            <!-- W/L + Sets -->
            <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
              <h3 class="text-sm font-[500] text-pf-text mb-3">Record</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-pf-muted mb-1">Matches</div>
                  <div class="text-sm text-pf-text">
                    <span class="text-[#1D9E75] font-semibold">{{ stats()!.wins }}W</span>
                    <span class="text-pf-muted mx-1">/</span>
                    <span class="text-[#D85A30] font-semibold">{{ stats()!.losses }}L</span>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-pf-muted mb-1">Sets</div>
                  <div class="text-sm text-pf-text">
                    <span class="text-[#1D9E75] font-semibold">{{ stats()!.setsWon }}W</span>
                    <span class="text-pf-muted mx-1">/</span>
                    <span class="text-[#D85A30] font-semibold">{{ stats()!.setsLost }}L</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent form -->
            <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
              <h3 class="text-sm font-[500] text-pf-text mb-3">Recent form</h3>
              <div class="flex gap-2">
                @for (r of stats()!.recentForm; track $index) {
                  <span
                    class="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm"
                    [class]="r === 'W' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-[#FDE8E0] text-[#D85A30]'"
                  >{{ r }}</span>
                }
                @if (stats()!.recentForm.length === 0) {
                  <span class="text-xs text-pf-muted">No matches yet</span>
                }
              </div>
            </div>

            <!-- Side stats -->
            <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
              <h3 class="text-sm font-[500] text-pf-text mb-3">Side preference</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-xs text-pf-muted mb-1">Left side</div>
                  <div class="text-sm font-[500] text-pf-text">
                    {{ stats()!.sideStats.left.matches }} played
                    @if (stats()!.sideStats.left.matches > 0) {
                      · {{ pct(stats()!.sideStats.left.wins, stats()!.sideStats.left.matches) }}% win
                    }
                  </div>
                </div>
                <div>
                  <div class="text-xs text-pf-muted mb-1">Right side</div>
                  <div class="text-sm font-[500] text-pf-text">
                    {{ stats()!.sideStats.right.matches }} played
                    @if (stats()!.sideStats.right.matches > 0) {
                      · {{ pct(stats()!.sideStats.right.wins, stats()!.sideStats.right.matches) }}% win
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Partnerships -->
            @if (stats()!.partnerships.length > 0) {
              <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
                <h3 class="text-sm font-[500] text-pf-text mb-3">Partnerships</h3>
                <div class="space-y-2">
                  @for (p of stats()!.partnerships; track p.partnerId) {
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          [style.background]="getPlayerColor(p.partnerId)"
                        >{{ getPlayerInitials(p.partnerId) }}</div>
                        <span class="text-sm text-pf-text">{{ p.partnerName }}</span>
                      </div>
                      <div class="text-xs text-pf-muted">{{ p.matches }} matches · {{ pct(p.wins, p.matches) }}% win</div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Head to head -->
            @if (stats()!.headToHead.length > 0) {
              <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
                <h3 class="text-sm font-[500] text-pf-text mb-3">Head-to-head</h3>
                <div class="space-y-2">
                  @for (h of stats()!.headToHead; track h.opponentId) {
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          [style.background]="getPlayerColor(h.opponentId)"
                        >{{ getPlayerInitials(h.opponentId) }}</div>
                        <span class="text-sm text-pf-text">vs {{ h.opponentName }}</span>
                      </div>
                      <div class="text-xs">
                        <span class="text-[#1D9E75] font-semibold">{{ h.wins }}W</span>
                        <span class="text-pf-muted mx-1">/</span>
                        <span class="text-[#D85A30] font-semibold">{{ h.matches - h.wins }}L</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Match history -->
            <div class="bg-pf-surface rounded-[12px] border border-[0.5px] border-pf-border p-4">
              <h3 class="text-sm font-[500] text-pf-text mb-3">Match history</h3>
              <div class="space-y-2">
                @for (m of playerMatches(); track m.id) {
                  @let inTeamA = m.teamA.player1Id === id() || m.teamA.player2Id === id();
                  @let won = (inTeamA && m.winner === 'teamA') || (!inTeamA && m.winner === 'teamB');
                  <div class="flex items-center gap-3 py-1">
                    <span
                      class="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0"
                      [class]="won ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-[#FDE8E0] text-[#D85A30]'"
                    >{{ won ? 'W' : 'L' }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-pf-text truncate">
                        vs {{ getOpponentNames(m, id()) }}
                      </div>
                      <div class="text-[10px] text-pf-muted">{{ formatDate(m.date) }}</div>
                    </div>
                    <div class="text-xs text-pf-muted">
                      {{ m.sets.map(s => s.teamAScore + '-' + s.teamBScore).join(', ') }}
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="p-4 text-pf-muted text-sm">Player not found</div>
    }
  `,
})
export class PlayerDetailComponent {
  id = input.required<string>();

  private store = inject(Store);
  private router = inject(Router);

  player = computed(() => this.store.selectSignal(selectPlayerById(this.id()))());
  stats = computed(() => this.store.selectSignal(selectPlayerStatsById(this.id()))());
  allPlayers = this.store.selectSignal(selectPlayers);
  allMatches = this.store.selectSignal(selectMatches);

  playerMatches = computed(() => {
    const id = this.id();
    return this.allMatches()
      .filter((m) =>
        m.teamA.player1Id === id || m.teamA.player2Id === id ||
        m.teamB.player1Id === id || m.teamB.player2Id === id,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  back() {
    this.router.navigate(['/padel']);
  }

  pct(wins: number, total: number): number {
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }

  getPlayerColor(id: string): string {
    return this.allPlayers().find((p) => p.id === id)?.color ?? '#888';
  }

  getPlayerInitials(id: string): string {
    return this.allPlayers().find((p) => p.id === id)?.avatarInitials ?? '?';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getOpponentNames(match: PadelMatch, playerId: string): string {
    const inTeamA = match.teamA.player1Id === playerId || match.teamA.player2Id === playerId;
    const opp = inTeamA ? match.teamB : match.teamA;
    const n1 = this.allPlayers().find((p) => p.id === opp.player1Id)?.name ?? '?';
    const n2 = this.allPlayers().find((p) => p.id === opp.player2Id)?.name ?? '?';
    return `${n1} & ${n2}`;
  }
}
