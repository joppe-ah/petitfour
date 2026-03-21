import { createFeature, createReducer, on } from '@ngrx/store';
import { MoneyTrackerActions } from './money-tracker.actions';
import { initialMoneyTrackerState } from './money-tracker.state';

export const moneyTrackerFeature = createFeature({
  name: 'moneyTracker',
  reducer: createReducer(
    initialMoneyTrackerState,

    on(MoneyTrackerActions.loadTransactions, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(MoneyTrackerActions.loadTransactionsSuccess, (state, { transactions }) => ({
      ...state,
      transactions,
      loading: false,
    })),

    on(MoneyTrackerActions.loadTransactionsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(MoneyTrackerActions.addTransactionSuccess, (state, { transaction }) => ({
      ...state,
      transactions: [...state.transactions, transaction],
    })),

    on(MoneyTrackerActions.deleteTransactionSuccess, (state, { id }) => ({
      ...state,
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
  ),
});

export const {
  name: moneyTrackerFeatureName,
  reducer: moneyTrackerReducer,
  selectMoneyTrackerState,
  selectTransactions,
  selectLoading: selectMoneyTrackerLoading,
  selectError: selectMoneyTrackerError,
} = moneyTrackerFeature;
