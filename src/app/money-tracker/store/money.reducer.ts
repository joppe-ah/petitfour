import { createFeature, createReducer, on } from '@ngrx/store';
import { MoneyActions } from './money.actions';
import { initialMoneyState, MoneyState } from './money.state';
import { Transaction } from '../models/transaction.model';

function updateBudgetSpent(state: MoneyState, tx: Transaction, delta: number): MoneyState {
  if (tx.type !== 'expense') return state;
  const budgets = state.budgets.map((b) =>
    b.categoryId === tx.category &&
    b.month === new Date(tx.date).getMonth() + 1 &&
    b.year === new Date(tx.date).getFullYear()
      ? { ...b, spent: Math.max(0, b.spent + delta) }
      : b,
  );
  return { ...state, budgets };
}

export const moneyFeature = createFeature({
  name: 'money',
  reducer: createReducer<MoneyState>(
    initialMoneyState,

    on(MoneyActions.loadMoneyData, (state) => ({ ...state, loading: true, error: null })),

    on(MoneyActions.loadMoneyDataSuccess, (state, { transactions, budgets, categories, fixedCosts, savingsGoals }) => ({
      ...state,
      transactions,
      budgets,
      categories,
      fixedCosts,
      savingsGoals,
      loading: false,
    })),

    on(MoneyActions.loadMoneyDataFailure, (state, { error }) => ({ ...state, loading: false, error })),

    on(MoneyActions.setActiveTab, (state, { tab }) => ({ ...state, activeTab: tab })),

    on(MoneyActions.setSelectedMonth, (state, { month, year }) => ({ ...state, selectedMonth: month, selectedYear: year })),

    on(MoneyActions.addTransactionSuccess, (state, { transaction }) => {
      const newState = { ...state, transactions: [...state.transactions, transaction] };
      return updateBudgetSpent(newState, transaction, transaction.amount);
    }),

    on(MoneyActions.editTransactionSuccess, (state, { transaction }) => {
      const old = state.transactions.find((t) => t.id === transaction.id);
      let newState = {
        ...state,
        transactions: state.transactions.map((t) => (t.id === transaction.id ? transaction : t)),
      };
      if (old) newState = updateBudgetSpent(newState, old, -old.amount);
      newState = updateBudgetSpent(newState, transaction, transaction.amount);
      return newState;
    }),

    on(MoneyActions.deleteTransactionSuccess, (state, { id }) => {
      const tx = state.transactions.find((t) => t.id === id);
      let newState = { ...state, transactions: state.transactions.filter((t) => t.id !== id) };
      if (tx) newState = updateBudgetSpent(newState, tx, -tx.amount);
      return newState;
    }),

    on(MoneyActions.addBudget, (state, { budget }) => ({
      ...state,
      budgets: [...state.budgets, { ...budget, id: crypto.randomUUID() }],
    })),

    on(MoneyActions.editBudget, (state, { budget }) => ({
      ...state,
      budgets: state.budgets.map((b) => (b.id === budget.id ? budget : b)),
    })),

    on(MoneyActions.addFixedCost, (state, { fixedCost }) => ({
      ...state,
      fixedCosts: [...state.fixedCosts, { ...fixedCost, id: crypto.randomUUID() }],
    })),

    on(MoneyActions.editFixedCost, (state, { fixedCost }) => ({
      ...state,
      fixedCosts: state.fixedCosts.map((f) => (f.id === fixedCost.id ? fixedCost : f)),
    })),

    on(MoneyActions.deleteFixedCost, (state, { id }) => ({
      ...state,
      fixedCosts: state.fixedCosts.filter((f) => f.id !== id),
    })),

    on(MoneyActions.addSavingsGoal, (state, { goal }) => ({
      ...state,
      savingsGoals: [...state.savingsGoals, { ...goal, id: crypto.randomUUID(), createdAt: new Date() }],
    })),

    on(MoneyActions.editSavingsGoal, (state, { goal }) => ({
      ...state,
      savingsGoals: state.savingsGoals.map((g) => (g.id === goal.id ? goal : g)),
    })),

    on(MoneyActions.deleteSavingsGoal, (state, { id }) => ({
      ...state,
      savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
    })),

    on(MoneyActions.addToSavingsGoal, (state, { goalId, amount }) => ({
      ...state,
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g,
      ),
    })),

    on(MoneyActions.addCategory, (state, { category }) => ({
      ...state,
      categories: [...state.categories, { ...category, id: crypto.randomUUID(), isCustom: true }],
    })),

    on(MoneyActions.deleteCategory, (state, { id }) => ({
      ...state,
      categories: state.categories.filter((c) => c.id !== id || !c.isCustom),
    })),
  ),
});

export const {
  name: moneyFeatureName,
  reducer: moneyReducer,
  selectMoneyState,
  selectTransactions,
  selectBudgets,
  selectCategories,
  selectFixedCosts,
  selectSavingsGoals,
  selectLoading: selectMoneyLoading,
  selectError: selectMoneyError,
  selectSelectedMonth,
  selectSelectedYear,
  selectActiveTab,
} = moneyFeature;
