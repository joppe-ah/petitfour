export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string; // category id
  date: Date;
  isFixed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
