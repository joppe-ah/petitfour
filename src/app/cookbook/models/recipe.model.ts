export type Category = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface Nutrition {
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  saturatedFat?: number;
  salt?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  photo?: string;
  cookingTime: number;
  servings: number;
  calories: number;
  rating: number;
  isFavourite: boolean;
  category: Category;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  season?: Season;
  nutrition?: Nutrition;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
