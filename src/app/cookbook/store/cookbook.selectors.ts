import { createSelector } from '@ngrx/store';
import {
  selectCookbookError,
  selectCookbookLoading,
  selectRecipes,
  selectSelectedRecipeId,
} from './cookbook.reducer';

export const selectSelectedRecipe = createSelector(
  selectRecipes,
  selectSelectedRecipeId,
  (recipes, id) => (id ? recipes.find((r) => r.id === id) ?? null : null),
);

export const selectRecipeCount = createSelector(
  selectRecipes,
  (recipes) => recipes.length,
);

export {
  selectRecipes,
  selectSelectedRecipeId,
  selectCookbookLoading,
  selectCookbookError,
};
