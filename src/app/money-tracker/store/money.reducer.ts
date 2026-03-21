import { createFeature, createReducer, on } from '@ngrx/store';
import { MoneyActions } from './money.actions';
import { initialMoneyState, MoneyState } from './money.state';

export const moneyFeature = createFeature({
  name: 'money',
  reducer: createReducer<MoneyState>(
    initialMoneyState,

    on(MoneyActions.loadTransactions, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(MoneyActions.loadTransactionsSuccess, (state, { transactions }) => ({
      ...state,
      transactions,
      loading: false,
    })),

    on(MoneyActions.loadTransactionsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(MoneyActions.addTransactionSuccess, (state, { transaction }) => ({
      ...state,
      transactions: [...state.transactions, transaction],
    })),

    on(MoneyActions.deleteTransactionSuccess, (state, { id }) => ({
      ...state,
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
  ),
});

export const {
  name: moneyFeatureName,
  reducer: moneyReducer,
  selectMoneyState,
  selectTransactions,
  selectLoading: selectMoneyLoading,
  selectError: selectMoneyError,
} = moneyFeature;
