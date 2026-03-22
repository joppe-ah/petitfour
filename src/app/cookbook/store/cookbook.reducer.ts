import { createFeature, createReducer, on } from '@ngrx/store';
import { Recipe } from '../models/recipe.model';
import { CookbookActions } from './cookbook.actions';
import {
  CookbookFilters,
  CookbookState,
  initialCookbookState,
  MealPlanEntry,
  SortState,
} from './cookbook.state';

function applyFiltersAndSort(
  recipes: Recipe[],
  filters: CookbookFilters,
  sort: SortState,
): Recipe[] {
  let result = [...recipes];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
    );
  }

  if (filters.category) {
    result = result.filter((r) => r.category === filters.category);
  }

  if (filters.favouritesOnly) {
    result = result.filter((r) => r.isFavourite);
  }

  if (filters.maxCookingTime !== null) {
    result = result.filter((r) => r.cookingTime <= filters.maxCookingTime!);
  }

  if (filters.season) {
    result = result.filter(
      (r) => r.season === filters.season || r.season === 'all',
    );
  }

  if (filters.ingredient) {
    const ing = filters.ingredient.toLowerCase();
    result = result.filter((r) =>
      r.ingredients.some((i) => i.name.toLowerCase().includes(ing)),
    );
  }

  if (sort.column) {
    const col = sort.column;
    result.sort((a, b) => {
      const av = a[col] as number;
      const bv = b[col] as number;
      return sort.direction === 'asc' ? av - bv : bv - av;
    });
  }

  return result;
}

export const cookbookFeature = createFeature({
  name: 'cookbook',
  reducer: createReducer<CookbookState>(
    initialCookbookState,

    on(CookbookActions.loadRecipes, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(CookbookActions.loadRecipesSuccess, (state, { recipes }) => ({
      ...state,
      recipes,
      filteredRecipes: applyFiltersAndSort(recipes, state.filters, state.sort),
      loading: false,
    })),

    on(CookbookActions.loadRecipesFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),

    on(CookbookActions.setViewMode, (state, { viewMode }) => ({
      ...state,
      viewMode,
    })),

    on(CookbookActions.setFilter, (state, { filter }) => {
      const filters = { ...state.filters, ...filter };
      return {
        ...state,
        filters,
        filteredRecipes: applyFiltersAndSort(state.recipes, filters, state.sort),
      };
    }),

    on(CookbookActions.setSort, (state, { sort }) => ({
      ...state,
      sort,
      filteredRecipes: applyFiltersAndSort(state.recipes, state.filters, sort),
    })),

    on(CookbookActions.toggleFavourite, (state, { id }) => {
      const recipes = state.recipes.map((r) =>
        r.id === id ? { ...r, isFavourite: !r.isFavourite } : r,
      );
      return {
        ...state,
        recipes,
        filteredRecipes: applyFiltersAndSort(recipes, state.filters, state.sort),
      };
    }),

    on(CookbookActions.selectRecipe, (state, { id }) => ({
      ...state,
      selectedRecipeId: id,
    })),

    // Save recipe
    on(CookbookActions.saveRecipe, (state) => ({
      ...state,
      saving: true,
    })),

    on(CookbookActions.saveRecipeSuccess, (state, { recipe }) => {
      const exists = state.recipes.some((r) => r.id === recipe.id);
      const recipes = exists
        ? state.recipes.map((r) => (r.id === recipe.id ? recipe : r))
        : [...state.recipes, recipe];
      return {
        ...state,
        recipes,
        filteredRecipes: applyFiltersAndSort(recipes, state.filters, state.sort),
        saving: false,
      };
    }),

    on(CookbookActions.saveRecipeFailure, (state, { error }) => ({
      ...state,
      saving: false,
      error,
    })),

    // Delete recipe
    on(CookbookActions.deleteRecipe, (state) => ({ ...state })),

    on(CookbookActions.deleteRecipeSuccess, (state, { id }) => {
      const recipes = state.recipes.filter((r) => r.id !== id);
      return {
        ...state,
        recipes,
        filteredRecipes: applyFiltersAndSort(recipes, state.filters, state.sort),
      };
    }),

    // Meal plan
    on(CookbookActions.addToMealPlan, (state, { recipeId, day, slot }) => ({
      ...state,
      mealPlan: [...state.mealPlan, { recipeId, day, slot } as MealPlanEntry],
    })),

    // Update recipe note
    on(CookbookActions.updateRecipeNote, (state, { id, note }) => {
      const recipes = state.recipes.map((r) =>
        r.id === id ? { ...r, notes: note } : r,
      );
      return {
        ...state,
        recipes,
        filteredRecipes: applyFiltersAndSort(recipes, state.filters, state.sort),
      };
    }),

    // Import from URL
    on(CookbookActions.importFromUrl, (state) => ({
      ...state,
      importLoading: true,
    })),

    on(CookbookActions.importFromUrlSuccess, (state, { recipe, source }) => ({
      ...state,
      importLoading: false,
      importedRecipe: recipe,
      importSource: source,
    })),

    on(CookbookActions.importFromUrlFailure, (state, { error }) => ({
      ...state,
      importLoading: false,
      error,
    })),

    // Import from photo
    on(CookbookActions.importFromPhoto, (state) => ({
      ...state,
      importLoading: true,
    })),

    on(CookbookActions.importFromPhotoSuccess, (state, { recipe }) => ({
      ...state,
      importLoading: false,
      importedRecipe: recipe,
      importSource: 'photo',
    })),

    on(CookbookActions.importFromPhotoFailure, (state, { error }) => ({
      ...state,
      importLoading: false,
      error,
    })),

    // Clear import
    on(CookbookActions.clearImport, (state) => ({
      ...state,
      importedRecipe: null,
      importSource: null,
    })),
  ),
});

export const {
  name: cookbookFeatureName,
  reducer: cookbookReducer,
  selectCookbookState,
  selectRecipes,
  selectFilteredRecipes,
  selectLoading,
  selectError,
  selectSelectedRecipeId,
  selectViewMode,
  selectFilters,
  selectSort,
  selectMealPlan,
  selectImportLoading,
  selectImportedRecipe,
  selectImportSource,
  selectSaving,
} = cookbookFeature;
