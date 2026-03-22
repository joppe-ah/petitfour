import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  Signal,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Transaction } from '../../models/transaction.model';
import { Category } from '../../models/category.model';
import { Chart, registerables } from 'chart.js';
import { MoneyActions } from '../../store/money.actions';
import {
  selectExpensesByMonth,
  selectFixedCostsByMonth,
  selectIncomeByMonth,
  selectMonthlyTotalsLast6Months,
  selectSavingsByMonth,
  selectSelectedMonth,
  selectSelectedYear,
  selectTransactionsByMonth,
  selectCategories,
} from '../../store/money.selectors';

Chart.register(...registerables);

@Component({
  selector: 'app-money-overview',
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

      <!-- 2x2 Summary cards -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
          <p class="text-xs text-pf-subtle mb-1">Income</p>
          <p class="text-lg font-[500] text-[#1D9E75]">{{ fmt(income()) }}</p>
        </div>
        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
          <p class="text-xs text-pf-subtle mb-1">Expenses</p>
          <p class="text-lg font-[500] text-[#D85A30]">{{ fmt(expenses()) }}</p>
        </div>
        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
          <p class="text-xs text-pf-subtle mb-1">Saved</p>
          <p class="text-lg font-[500] text-[#378ADD]">{{ fmt(savings()) }}</p>
        </div>
        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
          <p class="text-xs text-pf-subtle mb-1">Fixed costs</p>
          <p class="text-lg font-[500] text-pf-text">{{ fmt(fixedCosts()) }}</p>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 mb-6">
        <p class="text-xs font-[500] text-pf-text mb-4">Last 6 months</p>
        <div class="relative h-40">
          <canvas #chartCanvas></canvas>
        </div>
      </div>

      <!-- Recent transactions -->
      <p class="text-xs font-[500] text-pf-text mb-3">Recent transactions</p>
      @for (tx of recentTxs(); track tx.id) {
        <div class="flex items-center gap-3 py-2.5 border-b border-[0.5px] border-pf-border last:border-0">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            [style.background-color]="getCategoryColor(tx.category) + '22'"
          >
            {{ getCategoryIcon(tx.category) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-pf-text truncate">{{ tx.description }}</p>
            <p class="text-xs text-pf-muted">{{ getCategoryName(tx.category) }} · {{ formatDate(tx.date) }}</p>
          </div>
          <span
            class="text-sm font-[450] flex-shrink-0"
            [class]="tx.type === 'income' ? 'text-[#1D9E75]' : 'text-[#D85A30]'"
          >
            {{ tx.type === 'income' ? '+' : '−' }}{{ fmt(tx.amount) }}
          </span>
        </div>
      }
      @if (recentTxs().length === 0) {
        <p class="text-sm text-pf-muted text-center py-8">No transactions this month</p>
      }
    </div>
  `,
})
export class OverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private store = inject(Store);
  private chart?: Chart;

  income: Signal<number> = this.store.selectSignal(selectIncomeByMonth);
  expenses: Signal<number> = this.store.selectSignal(selectExpensesByMonth);
  savings: Signal<number> = this.store.selectSignal(selectSavingsByMonth);
  fixedCosts: Signal<number> = this.store.selectSignal(selectFixedCostsByMonth);
  chartData: Signal<{ label: string; income: number; expenses: number }[]> =
    this.store.selectSignal(selectMonthlyTotalsLast6Months);
  monthTxs: Signal<Transaction[]> = this.store.selectSignal(selectTransactionsByMonth);
  categories: Signal<Category[]> = this.store.selectSignal(selectCategories);
  selectedMonth: Signal<number> = this.store.selectSignal(selectSelectedMonth);
  selectedYear: Signal<number> = this.store.selectSignal(selectSelectedYear);

  recentTxs = computed(() => this.monthTxs().slice(0, 5));

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

  private chartEffect = effect(() => {
    const data = this.chartData();
    if (this.chart && data.length) {
      this.chart.data.labels = data.map((d) => d.label);
      this.chart.data.datasets[0].data = data.map((d) => d.income);
      this.chart.data.datasets[1].data = data.map((d) => d.expenses);
      this.chart.update();
    }
  });

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  initChart() {
    const data = this.chartData();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Income',
            data: data.map((d) => d.income),
            backgroundColor: '#1D9E7599',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Expenses',
            data: data.map((d) => d.expenses),
            backgroundColor: '#D85A3099',
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${this.fmt(ctx.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#888780', font: { size: 11 } },
          },
          y: {
            grid: { color: '#e8e8e622' },
            border: { display: false },
            ticks: {
              color: '#888780',
              font: { size: 11 },
              callback: (v) => '€' + ((v as number) / 1000).toFixed(1) + 'k',
            },
          },
        },
      },
    });
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

  fmt(n: number): string {
    return n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
  }

  getCategoryIcon(id: string): string {
    return this.categories().find((c) => c.id === id)?.icon ?? '◈';
  }

  getCategoryName(id: string): string {
    return this.categories().find((c) => c.id === id)?.name ?? id;
  }

  getCategoryColor(id: string): string {
    return this.categories().find((c) => c.id === id)?.color ?? '#888780';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }
}
