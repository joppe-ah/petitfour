import { Component, inject, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PadelActions } from '../../store/padel.actions';
import { selectPlayers } from '../../store/padel.selectors';
import { PadelPlayer } from '../../models/player.model';
import { PadelSet, MatchResult } from '../../models/match.model';
import { ToastService } from '../../../shared/components/toast/toast.service';

type Step = 1 | 2 | 3 | 4;

const LOCATIONS = ['Padel Club Amsterdam', 'Padel One Amstelveen', 'De Padelclub'];

@Component({
  selector: 'app-add-match',
  imports: [FormsModule],
  template: `
    <div
      class="fixed inset-0 bg-black/40 z-40 flex items-end justify-center"
      (click)="closed.emit()"
    >
      <div
        class="bg-pf-surface rounded-t-[20px] w-full max-w-lg p-6 pb-8 max-h-[92vh] overflow-y-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Step indicator -->
        <div class="flex gap-1.5 mb-6">
          @for (s of [1,2,3,4]; track s) {
            <div
              class="flex-1 h-1 rounded-full transition-colors"
              [class]="step() >= s ? 'bg-[#1D9E75]' : 'bg-pf-border'"
            ></div>
          }
        </div>

        <!-- Step 1: Teams -->
        @if (step() === 1) {
          <h2 class="text-base font-[500] text-pf-text mb-4">Select players</h2>
          <div class="space-y-4">
            @for (teamLabel of ['Team A', 'Team B']; track teamLabel; let ti = $index) {
              <div>
                <p class="text-xs text-pf-muted mb-2">{{ teamLabel }}</p>
                <div class="grid grid-cols-3 gap-2">
                  @for (player of players(); track player.id) {
                    <button
                      (click)="togglePlayer(player, ti)"
                      class="flex flex-col items-center gap-1 p-2 rounded-[8px] border border-[0.5px] transition-colors"
                      [class]="isSelected(player.id, ti)
                        ? 'border-[#1D9E75] bg-[#E1F5EE] dark:bg-[#1D9E7522]'
                        : 'border-pf-border hover:border-pf-subtle'"
                      [disabled]="isInOtherTeam(player.id, ti)"
                    >
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
                        [style.background]="player.color"
                        [class.opacity-30]="isInOtherTeam(player.id, ti)"
                      >{{ player.avatarInitials }}</div>
                      <span class="text-[10px] text-pf-muted">{{ player.name }}</span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Step 2: Sets -->
        @if (step() === 2) {
          <h2 class="text-base font-[500] text-pf-text mb-1">Enter scores</h2>
          <div class="flex justify-between text-xs text-pf-muted mb-4">
            <span>{{ teamName(0) }}</span>
            <span>{{ teamName(1) }}</span>
          </div>
          <div class="space-y-3">
            @for (set of sets(); track $index; let i = $index) {
              <div class="flex items-center gap-3">
                <span class="text-xs text-pf-muted w-8">Set {{ i + 1 }}</span>
                <input
                  type="number"
                  min="0" max="10"
                  [(ngModel)]="set.teamAScore"
                  class="flex-1 text-center py-2 bg-pf-bg border border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
                />
                <span class="text-pf-muted">–</span>
                <input
                  type="number"
                  min="0" max="10"
                  [(ngModel)]="set.teamBScore"
                  class="flex-1 text-center py-2 bg-pf-bg border border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
                />
                @if (sets().length > 1) {
                  <button (click)="removeSet(i)" class="text-pf-muted text-lg leading-none">×</button>
                }
              </div>
            }
          </div>
          <button
            (click)="addSet()"
            class="mt-3 text-xs text-[#1D9E75] font-[500]"
            [disabled]="sets().length >= 3"
          >+ Add set</button>
        }

        <!-- Step 3: Details -->
        @if (step() === 3) {
          <h2 class="text-base font-[500] text-pf-text mb-4">Match details</h2>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-pf-muted block mb-1">Date</label>
              <input
                type="date"
                [(ngModel)]="dateStr"
                class="w-full px-3 py-2 bg-pf-bg border border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs text-pf-muted block mb-1">Location</label>
              <div class="flex flex-wrap gap-2">
                @for (loc of locations; track loc) {
                  <button
                    (click)="location.set(loc)"
                    class="text-xs px-3 py-1.5 rounded-full border border-[0.5px] transition-colors"
                    [class]="location() === loc ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]' : 'border-pf-border text-pf-muted'"
                  >{{ loc }}</button>
                }
              </div>
              <input
                [(ngModel)]="customLocation"
                placeholder="Or enter custom location…"
                class="mt-2 w-full px-3 py-2 bg-pf-bg border border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none"
              />
            </div>
          </div>
        }

        <!-- Step 4: Confirm -->
        @if (step() === 4) {
          <h2 class="text-base font-[500] text-pf-text mb-4">Confirm match</h2>

          <div class="bg-pf-bg rounded-[12px] p-4 space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Team A</span>
              <span class="text-pf-text">{{ teamName(0) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Team B</span>
              <span class="text-pf-text">{{ teamName(1) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Score</span>
              <span class="text-pf-text">{{ scoreDisplay() }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Winner</span>
              <span class="font-[500]" [class]="detectedWinner() === 'teamA' ? 'text-[#1D9E75]' : 'text-[#D85A30]'">
                {{ detectedWinner() === 'teamA' ? teamName(0) : teamName(1) }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Date</span>
              <span class="text-pf-text">{{ dateStr }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-pf-muted">Location</span>
              <span class="text-pf-text">{{ resolvedLocation() }}</span>
            </div>
          </div>
        }

        <!-- Navigation -->
        <div class="flex gap-2 mt-6">
          @if (step() > 1) {
            <button
              (click)="prevStep()"
              class="flex-1 py-2.5 border border-pf-border rounded-[10px] text-sm text-pf-muted"
            >Back</button>
          }
          @if (step() < 4) {
            <button
              (click)="nextStep()"
              [disabled]="!canAdvance()"
              class="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[10px] disabled:opacity-50"
            >Next</button>
          } @else {
            <button
              (click)="save()"
              class="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[10px]"
            >Save match</button>
          }
        </div>
        <button (click)="closed.emit()" class="w-full mt-2 py-2 text-xs text-pf-muted">Cancel</button>
      </div>
    </div>
  `,
})
export class AddMatchComponent {
  closed = output<void>();

  private store = inject(Store);
  private toast = inject(ToastService);

  players = this.store.selectSignal(selectPlayers);

  step = signal<Step>(1);
  teamA = signal<string[]>([]);
  teamB = signal<string[]>([]);
  sets = signal<PadelSet[]>([{ teamAScore: 0, teamBScore: 0 }]);
  dateStr = new Date().toISOString().slice(0, 10);
  location = signal(LOCATIONS[0]);
  customLocation = '';

  readonly locations = LOCATIONS;

  isSelected(playerId: string, teamIndex: number): boolean {
    return teamIndex === 0 ? this.teamA().includes(playerId) : this.teamB().includes(playerId);
  }

  isInOtherTeam(playerId: string, teamIndex: number): boolean {
    return teamIndex === 0 ? this.teamB().includes(playerId) : this.teamA().includes(playerId);
  }

  togglePlayer(player: PadelPlayer, teamIndex: number) {
    const update = teamIndex === 0 ? this.teamA : this.teamB;
    const current = update();
    if (current.includes(player.id)) {
      update.set(current.filter((id) => id !== player.id));
    } else if (current.length < 2) {
      update.set([...current, player.id]);
    }
  }

  teamName(teamIndex: number): string {
    const ids = teamIndex === 0 ? this.teamA() : this.teamB();
    return ids.map((id) => this.players().find((p) => p.id === id)?.name ?? '?').join(' & ') || 'No players';
  }

  addSet() {
    if (this.sets().length < 3) {
      this.sets.update((s) => [...s, { teamAScore: 0, teamBScore: 0 }]);
    }
  }

  removeSet(index: number) {
    this.sets.update((s) => s.filter((_, i) => i !== index));
  }

  scoreDisplay = computed(() =>
    this.sets().map((s) => `${s.teamAScore}–${s.teamBScore}`).join(', '),
  );

  detectedWinner = computed((): MatchResult => {
    let winsA = 0;
    let winsB = 0;
    for (const s of this.sets()) {
      if (s.teamAScore > s.teamBScore) winsA++;
      else winsB++;
    }
    return winsA >= winsB ? 'teamA' : 'teamB';
  });

  resolvedLocation = computed(() => this.customLocation.trim() || this.location());

  canAdvance = computed(() => {
    if (this.step() === 1) return this.teamA().length === 2 && this.teamB().length === 2;
    if (this.step() === 2) return this.sets().length > 0;
    if (this.step() === 3) return !!this.resolvedLocation();
    return true;
  });

  nextStep() {
    if (this.canAdvance() && this.step() < 4) {
      this.step.update((s) => (s + 1) as Step);
    }
  }

  prevStep() {
    if (this.step() > 1) this.step.update((s) => (s - 1) as Step);
  }

  save() {
    const [a1, a2] = this.teamA();
    const [b1, b2] = this.teamB();
    this.store.dispatch(
      PadelActions.addMatch({
        match: {
          date: new Date(this.dateStr),
          location: this.resolvedLocation(),
          teamA: { player1Id: a1, player2Id: a2 },
          teamB: { player1Id: b1, player2Id: b2 },
          sets: this.sets(),
          winner: this.detectedWinner(),
        },
      }),
    );
    this.toast.show('Match saved', 'success');
    this.closed.emit();
  }
}
