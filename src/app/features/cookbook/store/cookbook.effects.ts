import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CookbookActions } from './cookbook.actions';
import { CookbookService } from '../cookbook.service';

export const loadRecipes$ = createEffect(
  (actions$ = inject(Actions), cookbookService = inject(CookbookService)) =>
    actions$.pipe(
      ofType(CookbookActions.loadRecipes),
      switchMap(() =>
        cookbookService.getRecipes().pipe(
          map((recipes) => CookbookActions.loadRecipesSuccess({ recipes })),
          catchError((error) =>
            of(CookbookActions.loadRecipesFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const addRecipe$ = createEffect(
  (actions$ = inject(Actions), cookbookService = inject(CookbookService)) =>
    actions$.pipe(
      ofType(CookbookActions.addRecipe),
      switchMap(({ recipe }) =>
        cookbookService.addRecipe(recipe).pipe(
          map((saved) => CookbookActions.addRecipeSuccess({ recipe: saved })),
          catchError((error) =>
            of(CookbookActions.loadRecipesFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);
