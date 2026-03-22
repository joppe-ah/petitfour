import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { MoneyActions } from './store/money.actions';
import { selectActiveTab, selectMoneyLoading } from './store/money.selectors';
import { MoneyTab } from './store/money.state';
import { OverviewComponent } from './components/overview/overview.component';
import { BudgetsComponent } from './components/budgets/budgets.component';
import { GoalsComponent } from './components/goals/goals.component';
import { TransactionsComponent } from './components/transactions/transactions.component';
import { QuickAddComponent } from './components/quick-add/quick-add.component';
import { SkeletonComponent } from '../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-money-tracker',
  imports: [OverviewComponent, BudgetsComponent, GoalsComponent, TransactionsComponent, QuickAddComponent, SkeletonComponent],
  template: `
    <div class="bg-pf-bg">
      <!-- Header -->
      <div class="px-6 pt-6 pb-0">
        <h1 class="text-base text-pf-text font-[500]">Money Tracker</h1>
        <p class="text-xs text-pf-subtle mt-0.5">Monthly overview</p>
      </div>

      <!-- Tabs -->
      <div class="px-6 mt-4 border-b border-[0.5px] border-pf-border flex gap-6">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="setTab(tab.id)"
            class="pb-2 text-sm transition-colors relative"
            [class]="activeTab() === tab.id ? 'text-pf-text font-[500]' : 'text-pf-subtle'"
          >
            {{ tab.label }}
            @if (activeTab() === tab.id) {
              <span class="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1a1a1a] dark:bg-[#f0f0ee]"></span>
            }
          </button>
        }
      </div>

      <!-- Tab content -->
      <div class="pb-24">
        @if (loading()) {
          <div class="px-6 pt-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="rounded-[12px] border border-[0.5px] border-pf-border p-4 space-y-2">
                  <pf-skeleton width="60%" height="11px" />
                  <pf-skeleton width="80%" height="22px" />
                </div>
              }
            </div>
            <div class="rounded-[12px] border border-[0.5px] border-pf-border p-4 space-y-3">
              <pf-skeleton width="40%" height="12px" />
              <pf-skeleton width="100%" height="120px" />
            </div>
          </div>
        } @else {
          @if (activeTab() === 'overview') {
            <app-money-overview />
          }
          @if (activeTab() === 'budgets') {
            <app-money-budgets />
          }
          @if (activeTab() === 'goals') {
            <app-money-goals />
          }
          @if (activeTab() === 'transactions') {
            <app-money-transactions />
          }
        }
      </div>

      <!-- FAB -->
      <button
        (click)="showQuickAdd.set(true)"
        class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1D9E75] text-white text-2xl flex items-center justify-center shadow-lg hover:bg-[#178a65] transition-colors z-30"
        aria-label="Add transaction"
      >
        +
      </button>

      <!-- Quick add modal -->
      @if (showQuickAdd()) {
        <app-quick-add (closed)="showQuickAdd.set(false)" />
      }
    </div>
  `,
})
export class MoneyTrackerComponent implements OnInit {
  private store = inject(Store);

  activeTab = this.store.selectSignal(selectActiveTab);
  loading = this.store.selectSignal(selectMoneyLoading);
  showQuickAdd = signal(false);

  tabs = [
    { id: 'overview' as MoneyTab, label: 'Overview' },
    { id: 'budgets' as MoneyTab, label: 'Budgets' },
    { id: 'goals' as MoneyTab, label: 'Goals' },
    { id: 'transactions' as MoneyTab, label: 'Transactions' },
  ];

  ngOnInit() {
    this.store.dispatch(MoneyActions.loadMoneyData());
  }

  setTab(tab: MoneyTab) {
    this.store.dispatch(MoneyActions.setActiveTab({ tab }));
  }
}
