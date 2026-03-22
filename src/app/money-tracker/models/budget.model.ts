export type BudgetGroup = 'needs' | 'wants' | 'savings';

export interface Budget {
  id: string;
  categoryId: string;
  amount: number; // budget limit
  spent: number; // computed/tracked
  month: number; // 1-12
  year: number;
  group: BudgetGroup;
}
