import { Category } from '../models/category.model';

export const DEFAULT_CATEGORIES: Category[] = [
  // Needs
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#378ADD', group: 'needs', isCustom: false },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#1D9E75', group: 'needs', isCustom: false },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#888780', group: 'needs', isCustom: false },
  { id: 'health', name: 'Health', icon: '💊', color: '#D4537E', group: 'needs', isCustom: false },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#BA7517', group: 'needs', isCustom: false },
  // Wants
  { id: 'eating-out', name: 'Eating out', icon: '🍕', color: '#D85A30', group: 'wants', isCustom: false },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#7F77DD', group: 'wants', isCustom: false },
  { id: 'clothing', name: 'Clothing', icon: '👗', color: '#D4537E', group: 'wants', isCustom: false },
  { id: 'hobbies', name: 'Hobbies', icon: '🎯', color: '#1D9E75', group: 'wants', isCustom: false },
  // Savings
  { id: 'savings', name: 'Savings', icon: '💰', color: '#1D9E75', group: 'savings', isCustom: false },
  // Income (special, not in needs/wants/savings)
  { id: 'salary', name: 'Salary', icon: '💼', color: '#1D9E75', group: 'savings', isCustom: false },
];
