export type ShoppingCategory =
  | 'vegetables' | 'fruit' | 'meat' | 'fish'
  | 'dairy' | 'pasta' | 'bakery'
  | 'canned' | 'condiments' | 'other';

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: ShoppingCategory;
  isChecked: boolean;
  isManual: boolean;
  recipeIds: string[];
}

export interface ShoppingList {
  id: string;
  weekNumber: number;
  year: number;
  items: ShoppingItem[];
  generatedAt: Date;
}
