import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Recipe } from './cookbook.state';

export const CookbookActions = createActionGroup({
  source: 'Cookbook',
  events: {
    'Load Recipes': emptyProps(),
    'Load Recipes Success': props<{ recipes: Recipe[] }>(),
    'Load Recipes Failure': props<{ error: string }>(),
    'Add Recipe': props<{ recipe: Omit<Recipe, 'id'> }>(),
    'Add Recipe Success': props<{ recipe: Recipe }>(),
    'Delete Recipe': props<{ id: string }>(),
    'Delete Recipe Success': props<{ id: string }>(),
    'Select Recipe': props<{ id: string | null }>(),
  },
});
