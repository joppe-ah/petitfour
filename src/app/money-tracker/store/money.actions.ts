import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Transaction } from '../models/transaction.model';
import { Budget } from '../models/budget.model';
import { Category } from '../models/category.model';
import { FixedCost } from '../models/fixed-cost.model';
import { SavingsGoal } from '../models/savings-goal.model';
import { MoneyTab } from './money.state';

export const MoneyActions = createActionGroup({
  source: 'Money',
  events: {
    // Load
    'Load Money Data': emptyProps(),
    'Load Money Data Success': props<{
      transactions: Transaction[];
      budgets: Budget[];
      categories: Category[];
      fixedCosts: FixedCost[];
      savingsGoals: SavingsGoal[];
    }>(),
    'Load Money Data Failure': props<{ error: string }>(),
    // Navigation
    'Set Active Tab': props<{ tab: MoneyTab }>(),
    'Set Selected Month': props<{ month: number; year: number }>(),
    // Transactions
    'Add Transaction': props<{ transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> }>(),
    'Add Transaction Success': props<{ transaction: Transaction }>(),
    'Edit Transaction': props<{ transaction: Transaction }>(),
    'Edit Transaction Success': props<{ transaction: Transaction }>(),
    'Delete Transaction': props<{ id: string }>(),
    'Delete Transaction Success': props<{ id: string }>(),
    // Budgets
    'Add Budget': props<{ budget: Omit<Budget, 'id'> }>(),
    'Edit Budget': props<{ budget: Budget }>(),
    // Fixed costs
    'Add Fixed Cost': props<{ fixedCost: Omit<FixedCost, 'id'> }>(),
    'Edit Fixed Cost': props<{ fixedCost: FixedCost }>(),
    'Delete Fixed Cost': props<{ id: string }>(),
    // Savings goals
    'Add Savings Goal': props<{ goal: Omit<SavingsGoal, 'id' | 'createdAt'> }>(),
    'Edit Savings Goal': props<{ goal: SavingsGoal }>(),
    'Delete Savings Goal': props<{ id: string }>(),
    'Add To Savings Goal': props<{ goalId: string; amount: number }>(),
    // Categories
    'Add Category': props<{ category: Omit<Category, 'id'> }>(),
    'Delete Category': props<{ id: string }>(),
  },
});
