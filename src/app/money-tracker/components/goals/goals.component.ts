import { Component, inject, Signal, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { MoneyActions } from '../../store/money.actions';
import { selectSavingsGoals } from '../../store/money.selectors';
import { SavingsGoal } from '../../models/savings-goal.model';

@Component({
  selector: 'app-money-goals',
  imports: [FormsModule],
  template: `
    <div class="px-6 pt-4">
      @if (goals().length === 0) {
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <span class="text-4xl mb-3">🎯</span>
          <p class="text-sm text-pf-text">No savings goals yet</p>
          <p class="text-xs text-pf-muted mt-1">Set a goal to start tracking your progress</p>
          <button
            (click)="openNewGoal()"
            class="mt-4 px-4 py-2 bg-[#1D9E75] text-white text-xs rounded-[8px]"
          >
            + New goal
          </button>
        </div>
      } @else {
        @for (goal of goals(); track goal.id) {
          <div
            class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 mb-3 cursor-pointer"
            (click)="openEditGoal(goal)"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ goal.emoji }}</span>
                <p class="text-sm font-[500] text-pf-text">{{ goal.name }}</p>
              </div>
              <span class="text-sm font-[500] text-[#378ADD]">{{ goalPct(goal) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-pf-border overflow-hidden mb-2">
              <div
                class="h-full rounded-full transition-all"
                [style.width]="goalPct(goal) + '%'"
                [style.background-color]="goal.color"
              ></div>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-pf-subtle">{{ fmt(goal.savedAmount) }} of {{ fmt(goal.targetAmount) }}</span>
              <span class="text-[#1D9E75]">{{ etaText(goal) }}</span>
            </div>
            <button
              (click)="$event.stopPropagation(); openAddAmount(goal)"
              class="mt-3 w-full py-1.5 border border-[0.5px] border-pf-border rounded-[8px] text-xs text-pf-subtle hover:border-pf-subtle hover:text-pf-text transition-colors"
            >
              + Add amount
            </button>
          </div>
        }
        <button
          (click)="openNewGoal()"
          class="w-full py-3 border border-dashed border-pf-border rounded-[12px] text-sm text-pf-subtle hover:border-pf-subtle hover:text-pf-text transition-colors mb-6"
        >
          + New goal
        </button>
      }
    </div>

    <!-- Add amount modal -->
    @if (addAmountGoal()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
        (click)="addAmountGoal.set(null)"
      >
        <div
          class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-6 w-full sm:max-w-sm sm:mx-4"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-sm font-[500] text-pf-text mb-1">Add to {{ addAmountGoal()!.name }}</h3>
          <p class="text-xs text-pf-muted mb-4">Current: {{ fmt(addAmountGoal()!.savedAmount) }}</p>
          <input
            type="number"
            [ngModel]="addAmount()"
            (ngModelChange)="addAmount.set($event)"
            placeholder="0"
            class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none mb-4"
          />
          <button
            (click)="confirmAddAmount()"
            class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]"
          >
            Add
          </button>
        </div>
      </div>
    }

    <!-- New/Edit goal modal -->
    @if (goalModal()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
        (click)="goalModal.set(false)"
      >
        <div
          class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-6 w-full sm:max-w-sm sm:mx-4 max-h-[80vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-sm font-[500] text-pf-text mb-4">{{ editingGoalId() ? 'Edit goal' : 'New goal' }}</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Emoji</label>
              <input
                [ngModel]="goalEmoji()"
                (ngModelChange)="goalEmoji.set($event)"
                class="w-16 px-2 py-1.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-center text-xl"
              />
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Name</label>
              <input
                [ngModel]="goalName()"
                (ngModelChange)="goalName.set($event)"
                placeholder="e.g. New car"
                class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Target amount (€)</label>
              <input
                type="number"
                [ngModel]="goalTarget()"
                (ngModelChange)="goalTarget.set($event)"
                class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
              />
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Monthly contribution (€)</label>
              <input
                type="number"
                [ngModel]="goalMonthly()"
                (ngModelChange)="goalMonthly.set($event)"
                class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none"
              />
            </div>
          </div>
          <div class="flex gap-2 mt-6">
            @if (editingGoalId()) {
              <button
                (click)="deleteGoal()"
                class="px-4 py-2.5 text-[#A32D2D] text-sm border border-[0.5px] border-[#A32D2D]/30 rounded-[8px]"
              >
                Delete
              </button>
            }
            <button
              (click)="saveGoal()"
              class="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class GoalsComponent {
  private store = inject(Store);
  goals: Signal<SavingsGoal[]> = this.store.selectSignal(selectSavingsGoals);

  addAmountGoal = signal<SavingsGoal | null>(null);
  addAmount = signal(0);
  goalModal = signal<boolean>(false);
  editingGoalId = signal<string | null>(null);
  goalName = signal('');
  goalEmoji = signal('🎯');
  goalTarget = signal(0);
  goalMonthly = signal(0);

  goalPct(g: SavingsGoal): number {
    return Math.min(100, g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0);
  }

  etaText(g: SavingsGoal): string {
    if (g.savedAmount >= g.targetAmount) return '✓ Complete!';
    if (g.monthlyContribution <= 0) return 'Set monthly contribution';
    const months = Math.ceil((g.targetAmount - g.savedAmount) / g.monthlyContribution);
    return `~${months} month${months !== 1 ? 's' : ''} to go`;
  }

  fmt(n: number): string {
    return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  }

  openAddAmount(g: SavingsGoal) {
    this.addAmountGoal.set(g);
    this.addAmount.set(0);
  }

  confirmAddAmount() {
    const g = this.addAmountGoal();
    if (!g) return;
    this.store.dispatch(MoneyActions.addToSavingsGoal({ goalId: g.id, amount: Number(this.addAmount()) }));
    this.addAmountGoal.set(null);
  }

  openNewGoal() {
    this.editingGoalId.set(null);
    this.goalName.set('');
    this.goalEmoji.set('🎯');
    this.goalTarget.set(0);
    this.goalMonthly.set(0);
    this.goalModal.set(true);
  }

  openEditGoal(g: SavingsGoal) {
    this.editingGoalId.set(g.id);
    this.goalName.set(g.name);
    this.goalEmoji.set(g.emoji);
    this.goalTarget.set(g.targetAmount);
    this.goalMonthly.set(g.monthlyContribution);
    this.goalModal.set(true);
  }

  saveGoal() {
    const id = this.editingGoalId();
    if (id) {
      const existing = this.goals().find((g) => g.id === id);
      if (!existing) return;
      this.store.dispatch(
        MoneyActions.editSavingsGoal({
          goal: {
            ...existing,
            name: this.goalName(),
            emoji: this.goalEmoji(),
            targetAmount: Number(this.goalTarget()),
            monthlyContribution: Number(this.goalMonthly()),
          },
        }),
      );
    } else {
      this.store.dispatch(
        MoneyActions.addSavingsGoal({
          goal: {
            name: this.goalName(),
            emoji: this.goalEmoji(),
            targetAmount: Number(this.goalTarget()),
            savedAmount: 0,
            monthlyContribution: Number(this.goalMonthly()),
            color: '#378ADD',
          },
        }),
      );
    }
    this.goalModal.set(false);
  }

  deleteGoal() {
    const id = this.editingGoalId();
    if (id && confirm('Delete this goal?')) {
      this.store.dispatch(MoneyActions.deleteSavingsGoal({ id }));
      this.goalModal.set(false);
    }
  }
}
