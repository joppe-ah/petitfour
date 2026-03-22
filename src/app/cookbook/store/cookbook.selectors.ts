import { createSelector } from '@ngrx/store';
import {
  selectFilters,
  selectFilteredRecipes,
  selectImportedRecipe,
  selectImportLoading,
  selectImportSource,
  selectLoading,
  selectMealPlan,
  selectRecipes,
  selectSaving,
  selectSelectedRecipeId,
  selectSort,
  selectViewMode,
} from './cookbook.reducer';

export const selectAllRecipes = selectRecipes;

export const selectSelectedRecipe = createSelector(
  selectRecipes,
  selectSelectedRecipeId,
  (recipes, id) => (id ? (recipes.find((r) => r.id === id) ?? null) : null),
);

export {
  selectFilteredRecipes,
  selectViewMode,
  selectFilters,
  selectSort,
  selectLoading,
  selectSelectedRecipeId,
  selectSaving,
  selectImportLoading,
  selectImportedRecipe,
  selectImportSource,
  selectMealPlan,
};
