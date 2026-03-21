import { createSelector } from '@ngrx/store';
import { selectTransactions, selectMoneyLoading, selectMoneyError } from './money.reducer';

export const selectTotalIncome = createSelector(selectTransactions, (txs) =>
  txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
);

export const selectTotalExpenses = createSelector(selectTransactions, (txs) =>
  txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
);

export const selectBalance = createSelector(
  selectTotalIncome,
  selectTotalExpenses,
  (income, expenses) => income - expenses,
);

export { selectTransactions, selectMoneyLoading, selectMoneyError };
