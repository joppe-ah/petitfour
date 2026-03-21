export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string;
  tags: string[];
  createdAt: string;
}

export interface CookbookState {
  recipes: Recipe[];
  selectedRecipeId: string | null;
  loading: boolean;
  error: string | null;
}

export const initialCookbookState: CookbookState = {
  recipes: [],
  selectedRecipeId: null,
  loading: false,
  error: null,
};
