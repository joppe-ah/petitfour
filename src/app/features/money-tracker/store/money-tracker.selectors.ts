import { createSelector } from '@ngrx/store';
import { selectTransactions } from './money-tracker.reducer';

export const selectTotalIncome = createSelector(selectTransactions, (transactions) =>
  transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
);

export const selectTotalExpenses = createSelector(selectTransactions, (transactions) =>
  transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0),
);

export const selectBalance = createSelector(
  selectTotalIncome,
  selectTotalExpenses,
  (income, expenses) => income - expenses,
);

export { selectTransactions };
