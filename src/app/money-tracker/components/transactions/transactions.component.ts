import { Component, computed, inject, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { MoneyActions } from '../../store/money.actions';
import {
  selectTransactionsByMonth,
  selectIncomeByMonth,
  selectExpensesByMonth,
  selectSavingsByMonth,
  selectSelectedMonth,
  selectSelectedYear,
  selectCategories,
} from '../../store/money.selectors';
import { Transaction } from '../../models/transaction.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-money-transactions',
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

      <!-- Search -->
      <input
        [ngModel]="search()"
        (ngModelChange)="search.set($event)"
        placeholder="Search transactions…"
        class="w-full px-3 py-2 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle mb-3"
      />

      <!-- Filter chips -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
        @for (f of filters; track f.id) {
          <button
            (click)="activeFilter.set(f.id)"
            class="px-2.5 py-1 rounded-full text-xs whitespace-nowrap border border-[0.5px] transition-colors flex-shrink-0"
            [class]="
              activeFilter() === f.id
                ? 'bg-[#1a1a1a] text-white border-transparent dark:bg-[#f0f0ee] dark:text-[#1a1a1a]'
                : 'border-pf-border text-pf-subtle'
            "
          >
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Grouped transactions -->
      @for (group of groupedTxs(); track group.date) {
        <p class="text-xs font-[500] text-pf-muted mb-2 mt-4 first:mt-0">{{ group.label }}</p>
        @for (tx of group.txs; track tx.id) {
          <div class="flex items-center gap-3 py-2.5 border-b border-[0.5px] border-pf-border last:border-0">
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
              [style.background-color]="getCategoryColor(tx.category) + '22'"
            >
              {{ getCategoryIcon(tx.category) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-pf-text truncate">{{ tx.description }}</p>
              <p class="text-xs text-pf-muted">{{ getCategoryName(tx.category) }}</p>
            </div>
            <span
              class="text-sm font-[450] flex-shrink-0"
              [class]="tx.type === 'income' ? 'text-[#1D9E75]' : 'text-[#D85A30]'"
            >
              {{ tx.type === 'income' ? '+' : '−' }}{{ fmt(tx.amount) }}
            </span>
            <button
              (click)="deleteTx(tx)"
              class="w-7 h-7 flex items-center justify-center text-pf-muted hover:text-[#D85A30] flex-shrink-0"
            >
              ×
            </button>
          </div>
        }
      }

      @if (filteredTxs().length === 0) {
        <p class="text-sm text-pf-muted text-center py-12">No transactions found</p>
      }

      <!-- Monthly totals -->
      <div class="mt-6 pt-4 border-t border-[0.5px] border-pf-border">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-pf-subtle">Income</span><span class="text-[#1D9E75]">+{{ fmt(income()) }}</span>
        </div>
        <div class="flex justify-between text-xs mb-1">
          <span class="text-pf-subtle">Expenses</span><span class="text-[#D85A30]">−{{ fmt(expenses()) }}</span>
        </div>
        <div
          class="flex justify-between text-sm font-[500] mt-2 pt-2 border-t border-[0.5px] border-pf-border"
        >
          <span class="text-pf-text">Net saved</span>
          <span [class]="savings() >= 0 ? 'text-[#1D9E75]' : 'text-[#D85A30]'">{{ fmt(savings()) }}</span>
        </div>
      </div>
    </div>
  `,
})
export class TransactionsComponent {
  private store = inject(Store);

  allTxs: Signal<Transaction[]> = this.store.selectSignal(selectTransactionsByMonth);
  categories: Signal<Category[]> = this.store.selectSignal(selectCategories);
  income: Signal<number> = this.store.selectSignal(selectIncomeByMonth);
  expenses: Signal<number> = this.store.selectSignal(selectExpensesByMonth);
  savings: Signal<number> = this.store.selectSignal(selectSavingsByMonth);
  selectedMonth: Signal<number> = this.store.selectSignal(selectSelectedMonth);
  selectedYear: Signal<number> = this.store.selectSignal(selectSelectedYear);

  search = signal('');
  activeFilter = signal('all');

  filters = [
    { id: 'all', label: 'All' },
    { id: 'income', label: 'Income' },
    { id: 'expense', label: 'Expenses' },
  ];

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

  filteredTxs = computed(() => {
    let txs = this.allTxs();
    const q = this.search().toLowerCase();
    if (q)
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) || this.getCategoryName(t.category).toLowerCase().includes(q),
      );
    const f = this.activeFilter();
    if (f === 'income') txs = txs.filter((t) => t.type === 'income');
    if (f === 'expense') txs = txs.filter((t) => t.type === 'expense');
    return txs;
  });

  groupedTxs = computed(() => {
    const groups = new Map<string, { date: string; label: string; txs: Transaction[] }>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    for (const tx of this.filteredTxs()) {
      const d = new Date(tx.date);
      const key = d.toISOString().slice(0, 10);
      let label = key;
      if (key === today.toISOString().slice(0, 10)) label = 'Today';
      else if (key === yesterday.toISOString().slice(0, 10)) label = 'Yesterday';
      else label = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
      if (!groups.has(key)) groups.set(key, { date: key, label, txs: [] });
      groups.get(key)!.txs.push(tx);
    }
    return Array.from(groups.values());
  });

  getCategoryIcon(id: string) {
    return this.categories().find((c) => c.id === id)?.icon ?? '◈';
  }
  getCategoryName(id: string) {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }
  getCategoryColor(id: string) {
    return this.categories().find((c) => c.id === id)?.color ?? '#888780';
  }
  fmt(n: number): string {
    return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  }

  deleteTx(tx: Transaction) {
    if (confirm(`Delete "${tx.description}"?`)) {
      this.store.dispatch(MoneyActions.deleteTransaction({ id: tx.id }));
    }
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
