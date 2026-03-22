import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Recipe } from '../models/recipe.model';
import { CookbookFilters, SortState, ViewMode } from './cookbook.state';

export const CookbookActions = createActionGroup({
  source: 'Cookbook',
  events: {
    'Load Recipes': emptyProps(),
    'Load Recipes Success': props<{ recipes: Recipe[] }>(),
    'Load Recipes Failure': props<{ error: string }>(),
    'Set View Mode': props<{ viewMode: ViewMode }>(),
    'Set Filter': props<{ filter: Partial<CookbookFilters> }>(),
    'Set Sort': props<{ sort: SortState }>(),
    'Toggle Favourite': props<{ id: string }>(),
    'Select Recipe': props<{ id: string | null }>(),
    'Save Recipe': props<{ recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } }>(),
    'Save Recipe Success': props<{ recipe: Recipe }>(),
    'Save Recipe Failure': props<{ error: string }>(),
    'Delete Recipe': props<{ id: string }>(),
    'Delete Recipe Success': props<{ id: string }>(),
    'Add To Meal Plan': props<{ recipeId: string; day: string; slot: string }>(),
    'Update Recipe Note': props<{ id: string; note: string }>(),
    'Import From Url': props<{ url: string }>(),
    'Import From Url Success': props<{ recipe: Partial<Recipe>; source: string }>(),
    'Import From Url Failure': props<{ error: string }>(),
    'Import From Photo': emptyProps(),
    'Import From Photo Success': props<{ recipe: Partial<Recipe> }>(),
    'Import From Photo Failure': props<{ error: string }>(),
    'Clear Import': emptyProps(),
  },
});
