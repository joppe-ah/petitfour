import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { MoneyTrackerActions } from './store/money-tracker.actions';
import {
  selectTransactions,
  selectMoneyTrackerLoading,
} from './store/money-tracker.reducer';
import {
  selectBalance,
  selectTotalIncome,
  selectTotalExpenses,
} from './store/money-tracker.selectors';

@Component({
  selector: 'app-money-tracker',
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './money-tracker.html',
})
export class MoneyTrackerComponent implements OnInit {
  private store = inject(Store);

  transactions$ = this.store.select(selectTransactions);
  loading$ = this.store.select(selectMoneyTrackerLoading);
  balance$ = this.store.select(selectBalance);
  totalIncome$ = this.store.select(selectTotalIncome);
  totalExpenses$ = this.store.select(selectTotalExpenses);

  ngOnInit() {
    this.store.dispatch(MoneyTrackerActions.loadTransactions());
  }
}
