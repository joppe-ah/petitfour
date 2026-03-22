import { Category, Recipe, Season } from '../models/recipe.model';

export type ViewMode = 'gallery' | 'pro';

export interface CookbookFilters {
  search: string;
  category: Category | null;
  favouritesOnly: boolean;
  maxCookingTime: number | null;
  season: Season | null;
  ingredient: string | null;
}

export interface SortState {
  column: 'cookingTime' | 'calories' | 'rating' | null;
  direction: 'asc' | 'desc';
}

export interface MealPlanEntry {
  recipeId: string;
  day: string;
  slot: string;
}

export interface CookbookState {
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  loading: boolean;
  error: string | null;
  selectedRecipeId: string | null;
  viewMode: ViewMode;
  filters: CookbookFilters;
  sort: SortState;
  mealPlan: MealPlanEntry[];
  importLoading: boolean;
  importedRecipe: Partial<Recipe> | null;
  importSource: string | null;
  saving: boolean;
}

export const initialFilters: CookbookFilters = {
  search: '',
  category: null,
  favouritesOnly: false,
  maxCookingTime: null,
  season: null,
  ingredient: null,
};

export const initialSort: SortState = {
  column: null,
  direction: 'asc',
};

export const initialCookbookState: CookbookState = {
  recipes: [],
  filteredRecipes: [],
  loading: false,
  error: null,
  selectedRecipeId: null,
  viewMode: 'gallery',
  filters: initialFilters,
  sort: initialSort,
  mealPlan: [],
  importLoading: false,
  importedRecipe: null,
  importSource: null,
  saving: false,
};
