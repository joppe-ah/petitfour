import { createSelector } from '@ngrx/store';
import { selectCookbookState, selectRecipes, selectSelectedRecipeId } from './cookbook.reducer';

export const selectSelectedRecipe = createSelector(
  selectRecipes,
  selectSelectedRecipeId,
  (recipes, selectedId) => recipes.find((r) => r.id === selectedId) ?? null,
);

export const selectRecipeCount = createSelector(
  selectRecipes,
  (recipes) => recipes.length,
);

export { selectCookbookState, selectRecipes, selectSelectedRecipeId };
