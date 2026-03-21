export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface MoneyTrackerState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const initialMoneyTrackerState: MoneyTrackerState = {
  transactions: [],
  loading: false,
  error: null,
};
