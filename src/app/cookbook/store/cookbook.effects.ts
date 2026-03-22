import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, delay, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectProfile, selectUser } from '../../auth/store/auth.selectors';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { CookbookSupabaseService } from '../services/cookbook-supabase.service';
import { Category, Recipe } from '../models/recipe.model';
import { CookbookActions } from './cookbook.actions';
import { selectAllRecipes } from './cookbook.selectors';
import { ViewMode } from './cookbook.state';

// ── Initial load (triggered by auth) ─────────────────────────

export const loadRecipesOnAuth$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), service = inject(CookbookSupabaseService)) =>
    actions$.pipe(
      ofType(AuthActions.loadProfileSuccess),
      switchMap(({ profile }) => {
        if (!profile.family_id) return of(CookbookActions.loadRecipesSuccess({ recipes: [] }));
        return service.loadRecipes(profile.family_id).pipe(
          map((recipes) => CookbookActions.loadRecipesSuccess({ recipes })),
          catchError((err) => of(CookbookActions.loadRecipesFailure({ error: err.message }))),
        );
      }),
    ),
  { functional: true },
);

export const loadRecipes$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), service = inject(CookbookSupabaseService)) =>
    actions$.pipe(
      ofType(CookbookActions.loadRecipes),
      withLatestFrom(store.select(selectProfile)),
      switchMap(([, profile]) => {
        if (!profile?.family_id) return of(CookbookActions.loadRecipesSuccess({ recipes: [] }));
        return service.loadRecipes(profile.family_id).pipe(
          map((recipes) => CookbookActions.loadRecipesSuccess({ recipes })),
          catchError((err) => of(CookbookActions.loadRecipesFailure({ error: err.message }))),
        );
      }),
    ),
  { functional: true },
);

// ── Save / delete ─────────────────────────────────────────────

export const saveRecipe$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(CookbookSupabaseService),
    errorHandler = inject(ErrorHandlerService),
    toast = inject(ToastService),
  ) =>
    actions$.pipe(
      ofType(CookbookActions.saveRecipe),
      withLatestFrom(store.select(selectProfile), store.select(selectUser)),
      switchMap(([{ recipe }, profile, user]) => {
        if (!profile?.family_id || !user?.id) {
          return of(CookbookActions.saveRecipeFailure({ error: 'Not authenticated' }));
        }
        return service.saveRecipe(recipe, profile.family_id, user.id).pipe(
          map((saved) => CookbookActions.saveRecipeSuccess({ recipe: saved })),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return of(CookbookActions.saveRecipeFailure({ error: err.message }));
          }),
        );
      }),
    ),
  { functional: true },
);

export const deleteRecipe$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(CookbookSupabaseService),
    errorHandler = inject(ErrorHandlerService),
    toast = inject(ToastService),
  ) =>
    actions$.pipe(
      ofType(CookbookActions.deleteRecipe),
      switchMap(({ id }) =>
        service.deleteRecipe(id).pipe(
          map(() => CookbookActions.deleteRecipeSuccess({ id })),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return of(CookbookActions.deleteRecipeSuccess({ id })); // optimistic — already removed from state
          }),
        ),
      ),
    ),
  { functional: true },
);

// ── Toggle favourite ──────────────────────────────────────────

export const toggleFavourite$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(CookbookSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(CookbookActions.toggleFavourite),
      withLatestFrom(store.select(selectAllRecipes)),
      switchMap(([{ id }, recipes]) => {
        const recipe = recipes.find((r) => r.id === id);
        if (!recipe) return EMPTY;
        return service.toggleFavourite(id, !recipe.isFavourite).pipe(
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Update recipe note ────────────────────────────────────────

export const updateRecipeNote$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(CookbookSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(CookbookActions.updateRecipeNote),
      switchMap(({ id, note }) =>
        service.updateNote(id, note).pipe(
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        ),
      ),
    ),
  { functional: true, dispatch: false },
);

// ── View mode persistence ─────────────────────────────────────

export const initViewMode$ = createEffect(
  () => {
    const saved = localStorage.getItem('pf-cookbook-view') as ViewMode | null;
    return of(CookbookActions.setViewMode({ viewMode: saved ?? 'gallery' }));
  },
  { functional: true },
);

export const saveViewMode$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(CookbookActions.setViewMode),
      tap(({ viewMode }) => localStorage.setItem('pf-cookbook-view', viewMode)),
    ),
  { functional: true, dispatch: false },
);

// ── URL import (stub — no real AI integration yet) ────────────

export const importFromUrl$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(CookbookActions.importFromUrl),
      switchMap(({ url }) => {
        const domain = new URL(url).hostname;
        return of(null).pipe(
          delay(1500),
          map(() =>
            CookbookActions.importFromUrlSuccess({
              recipe: {
                name: 'Imported Recipe',
                description: 'A delicious recipe imported from ' + domain,
                cookingTime: 30,
                servings: 4,
                calories: 400,
                rating: 0,
                isFavourite: false,
                category: 'dinner' as Category,
                tags: ['imported'],
                ingredients: [{ id: crypto.randomUUID(), name: 'ingredient 1', amount: 1, unit: 'piece' }],
                steps: ['Step 1: Prepare ingredients', 'Step 2: Cook and serve'],
              },
              source: domain,
            }),
          ),
          catchError(() => of(CookbookActions.importFromUrlFailure({ error: 'Failed to import' }))),
        );
      }),
    ),
  { functional: true },
);

export const importFromPhoto$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(CookbookActions.importFromPhoto),
      switchMap(() =>
        of(null).pipe(
          delay(2000),
          map(() =>
            CookbookActions.importFromPhotoSuccess({
              recipe: {
                name: 'Scanned Recipe',
                description: 'Recipe extracted from photo',
                cookingTime: 20,
                servings: 2,
                calories: 350,
                rating: 0,
                isFavourite: false,
                category: 'lunch' as Category,
                tags: ['scanned'],
                ingredients: [{ id: crypto.randomUUID(), name: 'main ingredient', amount: 200, unit: 'g' }],
                steps: ['Step 1: Prepare', 'Step 2: Cook'],
              },
            }),
          ),
          catchError(() => of(CookbookActions.importFromPhotoFailure({ error: 'Failed to scan' }))),
        ),
      ),
    ),
  { functional: true },
);
