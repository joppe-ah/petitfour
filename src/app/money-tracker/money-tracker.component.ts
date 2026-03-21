import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ButtonComponent } from '../shared/components/button/button';
import { CardComponent } from '../shared/components/card/card';
import { SpinnerComponent } from '../shared/components/spinner/spinner';
import { MoneyActions } from './store/money.actions';
import {
  selectBalance,
  selectMoneyLoading,
  selectTotalExpenses,
  selectTotalIncome,
  selectTransactions,
} from './store/money.selectors';

@Component({
  selector: 'app-money-tracker',
  imports: [CurrencyPipe, CardComponent, ButtonComponent, SpinnerComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-base text-pf-text">Money Tracker</h1>
          <p class="text-xs text-pf-subtle mt-0.5">Income &amp; expenses</p>
        </div>
        <pf-button variant="secondary">+ Add</pf-button>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <pf-card>
          <p class="text-[11px] text-pf-muted mb-1">Income</p>
          <p class="text-sm text-pf-teal">
            {{ totalIncome() | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </p>
        </pf-card>
        <pf-card>
          <p class="text-[11px] text-pf-muted mb-1">Expenses</p>
          <p class="text-sm text-pf-amber">
            {{ totalExpenses() | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </p>
        </pf-card>
        <pf-card>
          <p class="text-[11px] text-pf-muted mb-1">Balance</p>
          <p class="text-sm text-pf-text">
            {{ balance() | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </p>
        </pf-card>
      </div>

      @if (loading()) {
        <div class="flex items-center gap-2 text-pf-subtle text-sm">
          <pf-spinner /> Loading…
        </div>
      } @else {
        @let txs = transactions();
        @if (!txs.length) {
          <div class="text-center py-16 text-pf-muted text-sm">
            <p class="text-2xl mb-2">◈</p>
            <p>No transactions yet</p>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            @for (tx of txs; track tx.id) {
              <pf-card>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-pf-text">{{ tx.description }}</p>
                    <p class="text-xs text-pf-muted mt-0.5">{{ tx.category }} · {{ tx.date }}</p>
                  </div>
                  <span
                    class="text-sm"
                    [class]="tx.type === 'income' ? 'text-pf-teal' : 'text-pf-amber'"
                  >
                    {{ tx.type === 'income' ? '+' : '−' }}
                    {{ tx.amount | currency : 'EUR' : 'symbol' : '1.0-0' }}
                  </span>
                </div>
              </pf-card>
            }
          </div>
        }
      }
    </div>
  `,
})
export class MoneyTrackerComponent implements OnInit {
  private store = inject(Store);

  transactions = this.store.selectSignal(selectTransactions);
  loading = this.store.selectSignal(selectMoneyLoading);
  totalIncome = this.store.selectSignal(selectTotalIncome);
  totalExpenses = this.store.selectSignal(selectTotalExpenses);
  balance = this.store.selectSignal(selectBalance);

  ngOnInit() {
    this.store.dispatch(MoneyActions.loadTransactions());
  }
}
