import { Transaction } from '../models/transaction.model';
import { Budget } from '../models/budget.model';
import { Category } from '../models/category.model';
import { FixedCost } from '../models/fixed-cost.model';
import { SavingsGoal } from '../models/savings-goal.model';

export type MoneyTab = 'overview' | 'budgets' | 'goals' | 'transactions';

export interface MoneyState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  fixedCosts: FixedCost[];
  savingsGoals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  selectedMonth: number; // 1-12
  selectedYear: number;
  activeTab: MoneyTab;
}

const _now = new Date();

export const initialMoneyState: MoneyState = {
  transactions: [],
  budgets: [],
  categories: [],
  fixedCosts: [],
  savingsGoals: [],
  loading: false,
  error: null,
  selectedMonth: _now.getMonth() + 1,
  selectedYear: _now.getFullYear(),
  activeTab: 'overview',
};
