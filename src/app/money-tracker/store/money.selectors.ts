import { createSelector } from '@ngrx/store';
import {
  selectTransactions,
  selectBudgets,
  selectCategories,
  selectFixedCosts,
  selectSavingsGoals,
  selectSelectedMonth,
  selectSelectedYear,
  selectActiveTab,
  selectMoneyLoading,
  selectMoneyError,
} from './money.reducer';

// Transactions filtered by selected month+year
export const selectTransactionsByMonth = createSelector(
  selectTransactions,
  selectSelectedMonth,
  selectSelectedYear,
  (txs, month, year) =>
    txs
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
);

export const selectIncomeByMonth = createSelector(selectTransactionsByMonth, (txs) =>
  txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
);

export const selectExpensesByMonth = createSelector(selectTransactionsByMonth, (txs) =>
  txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
);

export const selectSavingsByMonth = createSelector(
  selectIncomeByMonth,
  selectExpensesByMonth,
  (income, expenses) => income - expenses,
);

export const selectFixedCostsByMonth = createSelector(selectFixedCosts, (costs) =>
  costs.filter((c) => c.isActive).reduce((s, c) => s + c.amount, 0),
);

export const selectBudgetsByMonth = createSelector(
  selectBudgets,
  selectSelectedMonth,
  selectSelectedYear,
  (budgets, month, year) => budgets.filter((b) => b.month === month && b.year === year),
);

export const selectBudgetsByGroup = createSelector(selectBudgetsByMonth, (budgets) => ({
  needs: budgets.filter((b) => b.group === 'needs'),
  wants: budgets.filter((b) => b.group === 'wants'),
  savings: budgets.filter((b) => b.group === 'savings'),
}));

export const selectTotalBudget = createSelector(selectBudgetsByMonth, (budgets) =>
  budgets.reduce((s, b) => s + b.amount, 0),
);

export const selectTotalSpent = createSelector(selectBudgetsByMonth, (budgets) =>
  budgets.reduce((s, b) => s + b.spent, 0),
);

// Last 6 months totals for chart
export const selectMonthlyTotalsLast6Months = createSelector(
  selectTransactions,
  selectSelectedMonth,
  selectSelectedYear,
  (txs, currentMonth, currentYear) => {
    const months: { label: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;
      while (month <= 0) {
        month += 12;
        year--;
      }
      const monthTxs = txs.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.push({
        label: labels[month - 1],
        income: monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  },
);

export const selectAllTransactions = selectTransactions;

export {
  selectMoneyLoading,
  selectMoneyError,
  selectActiveTab,
  selectCategories,
  selectFixedCosts,
  selectSavingsGoals,
  selectSelectedMonth,
  selectSelectedYear,
  selectBudgets,
};
