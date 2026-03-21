import { createFeature, createReducer, on } from '@ngrx/store';
import { CookbookActions } from './cookbook.actions';
import { initialCookbookState } from './cookbook.state';

export const cookbookFeature = createFeature({
  name: 'cookbook',
  reducer: createReducer(
    initialCookbookState,

    on(CookbookActions.loadRecipes, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(CookbookActions.loadRecipesSuccess, (state, { recipes }) => ({
      ...state,
      recipes,
      loading: false,
    })),

    on(CookbookActions.loadRecipesFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(CookbookActions.addRecipeSuccess, (state, { recipe }) => ({
      ...state,
      recipes: [...state.recipes, recipe],
    })),

    on(CookbookActions.deleteRecipeSuccess, (state, { id }) => ({
      ...state,
      recipes: state.recipes.filter((r) => r.id !== id),
    })),

    on(CookbookActions.selectRecipe, (state, { id }) => ({
      ...state,
      selectedRecipeId: id,
    })),
  ),
});

export const {
  name: cookbookFeatureName,
  reducer: cookbookReducer,
  selectCookbookState,
  selectRecipes,
  selectSelectedRecipeId,
  selectLoading: selectCookbookLoading,
  selectError: selectCookbookError,
} = cookbookFeature;
