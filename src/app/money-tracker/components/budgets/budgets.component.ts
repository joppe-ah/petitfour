import { Component, computed, inject, Signal, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { MoneyActions } from '../../store/money.actions';
import {
  selectBudgetsByGroup,
  selectFixedCosts,
  selectTotalBudget,
  selectTotalSpent,
  selectSelectedMonth,
  selectSelectedYear,
  selectCategories,
} from '../../store/money.selectors';
import { Budget } from '../../models/budget.model';
import { FixedCost } from '../../models/fixed-cost.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-money-budgets',
  imports: [FormsModule],
  template: `
    <div class="px-6 pt-4">
      <!-- Month navigator -->
      <div class="flex items-center justify-between mb-4">
        <button (click)="prevMonth()" class="w-8 h-8 flex items-center justify-center text-pf-subtle hover:text-pf-text">
          ‹
        </button>
        <span class="text-xs font-[500] text-pf-text">{{ monthLabel() }}</span>
        <button (click)="nextMonth()" class="w-8 h-8 flex items-center justify-center text-pf-subtle hover:text-pf-text">
          ›
        </button>
      </div>

      <!-- Total budget card -->
      <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 mb-5">
        <div class="flex justify-between items-baseline mb-2">
          <p class="text-xs text-pf-subtle">Total budget</p>
          <p class="text-xs text-pf-subtle">{{ fmt(totalSpent()) }} of {{ fmt(totalBudget()) }}</p>
        </div>
        <div class="h-2 rounded-full bg-pf-border overflow-hidden">
          <div
            class="h-full rounded-full transition-all"
            [style.width]="totalPct() + '%'"
            [style.background-color]="totalPct() > 100 ? '#D85A30' : totalPct() > 80 ? '#BA7517' : '#1D9E75'"
          ></div>
        </div>
      </div>

      <!-- Budget groups -->
      @for (group of groupList; track group.id) {
        @let groupBudgets = groups()[group.id];
        @if (groupBudgets.length > 0) {
          <div class="mb-5">
            <!-- Group header -->
            <div class="flex items-center justify-between mb-2">
              <span class="px-2.5 py-1 rounded-full text-xs font-[500]" [class]="group.pillClass">{{
                group.label
              }}</span>
              <span class="text-xs text-pf-subtle"
                >{{ fmt(groupSpent(group.id)) }} / {{ fmt(groupBudget(group.id)) }}</span
              >
            </div>
            <!-- Budget rows -->
            @for (budget of groupBudgets; track budget.id) {
              <div
                class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-3 mb-2 cursor-pointer hover:border-pf-subtle transition-colors"
                (click)="openEditBudget(budget)"
              >
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ getCategoryIcon(budget.categoryId) }}</span>
                    <span class="text-sm text-pf-text">{{ getCategoryName(budget.categoryId) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    @if (budget.spent > budget.amount) {
                      <span class="px-1.5 py-0.5 rounded-full text-[10px] font-[500] bg-[#FCEBEB] text-[#A32D2D]"
                        >over!</span
                      >
                    }
                    <span class="text-xs" [class]="remainingColor(budget)"
                      >{{ fmt(budget.amount - budget.spent) }} left</span
                    >
                  </div>
                </div>
                <div class="h-1.5 rounded-full bg-pf-border overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    [style.width]="
                      Math.min(100, budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0) + '%'
                    "
                    [style.background-color]="barColor(budget)"
                  ></div>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Fixed costs -->
      <div class="mb-6">
        <p class="text-xs font-[500] text-pf-text mb-3">Fixed costs</p>
        @for (fc of fixedCosts(); track fc.id) {
          <div
            class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-3 mb-2 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">{{ getCategoryIcon(fc.categoryId) }}</span>
              <div>
                <p class="text-sm text-pf-text">{{ fc.name }}</p>
                <p class="text-xs text-pf-muted">Day {{ fc.dayOfMonth }} of month</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded-full text-[10px] bg-pf-border text-pf-subtle">auto</span>
              <span class="text-sm text-[#D85A30]">{{ fmt(fc.amount) }}</span>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Edit budget modal -->
    @if (editingBudget()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
        (click)="editingBudget.set(null)"
      >
        <div
          class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-6 w-full sm:max-w-sm sm:mx-4"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-sm font-[500] text-pf-text mb-4">
            Edit budget — {{ getCategoryName(editingBudget()!.categoryId) }}
          </h3>
          <label class="text-xs text-pf-subtle block mb-2">Monthly budget (€)</label>
          <input
            type="number"
            [ngModel]="editAmount()"
            (ngModelChange)="editAmount.set($event)"
            class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none focus:border-pf-subtle mb-4"
          />
          <button
            (click)="saveBudget()"
            class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]"
          >
            Save
          </button>
        </div>
      </div>
    }
  `,
})
export class BudgetsComponent {
  protected Math = Math;
  private store = inject(Store);

  groups: Signal<{ needs: Budget[]; wants: Budget[]; savings: Budget[] }> =
    this.store.selectSignal(selectBudgetsByGroup);
  fixedCosts: Signal<FixedCost[]> = this.store.selectSignal(selectFixedCosts);
  totalBudget: Signal<number> = this.store.selectSignal(selectTotalBudget);
  totalSpent: Signal<number> = this.store.selectSignal(selectTotalSpent);
  categories: Signal<Category[]> = this.store.selectSignal(selectCategories);
  selectedMonth: Signal<number> = this.store.selectSignal(selectSelectedMonth);
  selectedYear: Signal<number> = this.store.selectSignal(selectSelectedYear);

  editingBudget = signal<Budget | null>(null);
  editAmount = signal(0);

  totalPct = computed(() => (this.totalBudget() > 0 ? (this.totalSpent() / this.totalBudget()) * 100 : 0));

  monthLabel = computed(() => {
    const names = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${names[this.selectedMonth() - 1]} ${this.selectedYear()}`;
  });

  groupList = [
    { id: 'needs' as const, label: 'Needs', pillClass: 'bg-[#E6F1FB] text-[#185FA5]' },
    { id: 'wants' as const, label: 'Wants', pillClass: 'bg-[#FAEEDA] text-[#854F0B]' },
    { id: 'savings' as const, label: 'Savings', pillClass: 'bg-[#EAF3DE] text-[#3B6D11]' },
  ];

  groupSpent(id: string) {
    return (this.groups() as Record<string, Budget[]>)[id]?.reduce((s, b) => s + b.spent, 0) ?? 0;
  }
  groupBudget(id: string) {
    return (this.groups() as Record<string, Budget[]>)[id]?.reduce((s, b) => s + b.amount, 0) ?? 0;
  }
  getCategoryIcon(id: string) {
    return this.categories().find((c) => c.id === id)?.icon ?? '◈';
  }
  getCategoryName(id: string) {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  remainingColor(b: Budget): string {
    const rem = b.amount - b.spent;
    if (rem < 0) return 'text-[#A32D2D]';
    const pct = b.amount > 0 ? rem / b.amount : 1;
    return pct < 0.2 ? 'text-[#BA7517]' : 'text-pf-subtle';
  }

  barColor(b: Budget): string {
    if (b.amount === 0) return '#888780';
    const pct = (b.spent / b.amount) * 100;
    return pct > 100 ? '#D85A30' : pct > 80 ? '#BA7517' : '#1D9E75';
  }

  openEditBudget(b: Budget) {
    this.editingBudget.set(b);
    this.editAmount.set(b.amount);
  }

  saveBudget() {
    const b = this.editingBudget();
    if (!b) return;
    this.store.dispatch(MoneyActions.editBudget({ budget: { ...b, amount: Number(this.editAmount()) } }));
    this.editingBudget.set(null);
  }

  fmt(n: number): string {
    return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  }

  prevMonth() {
    let m = this.selectedMonth() - 1;
    let y = this.selectedYear();
    if (m < 1) {
      m = 12;
      y--;
    }
    this.store.dispatch(MoneyActions.setSelectedMonth({ month: m, year: y }));
  }

  nextMonth() {
    let m = this.selectedMonth() + 1;
    let y = this.selectedYear();
    if (m > 12) {
      m = 1;
      y++;
    }
    this.store.dispatch(MoneyActions.setSelectedMonth({ month: m, year: y }));
  }
}
