import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectProfile, selectUser } from '../../auth/store/auth.selectors';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { selectAllRecipes } from '../../cookbook/store/cookbook.selectors';
import { PlannerSupabaseService } from '../services/planner-supabase.service';
import { ShoppingItem } from '../models/shopping-list.model';
import { PlannerActions } from './planner.actions';
import { categoriseIngredient } from './planner.reducer';
import { selectCurrentWeekPlans, selectSelectedWeek, selectSuggestionRules, selectMealPlans, selectShoppingList } from './planner.selectors';
import { toDateKey } from './planner.state';

// ── Load meal plans ───────────────────────────────────────────

export const loadMealPlansOnAuth$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), service = inject(PlannerSupabaseService)) =>
    actions$.pipe(
      ofType(AuthActions.loadProfileSuccess),
      withLatestFrom(store.select(selectSelectedWeek)),
      switchMap(([{ profile }, week]) => {
        if (!profile.family_id) return of(PlannerActions.loadMealPlansSuccess({ mealPlans: [] }));
        return service.loadMealPlans(profile.family_id, week.weekNumber, week.year).pipe(
          map((mealPlans) => PlannerActions.loadMealPlansSuccess({ mealPlans })),
          catchError(() => of(PlannerActions.loadMealPlansSuccess({ mealPlans: [] }))),
        );
      }),
    ),
  { functional: true },
);

export const loadMealPlans$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), service = inject(PlannerSupabaseService)) =>
    actions$.pipe(
      ofType(PlannerActions.loadMealPlans),
      withLatestFrom(store.select(selectProfile), store.select(selectSelectedWeek)),
      switchMap(([, profile, week]) => {
        if (!profile?.family_id) return of(PlannerActions.loadMealPlansSuccess({ mealPlans: [] }));
        return service.loadMealPlans(profile.family_id, week.weekNumber, week.year).pipe(
          map((mealPlans) => PlannerActions.loadMealPlansSuccess({ mealPlans })),
          catchError(() => of(PlannerActions.loadMealPlansSuccess({ mealPlans: [] }))),
        );
      }),
    ),
  { functional: true },
);

// Reload when week changes
export const loadMealPlansOnWeekChange$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(PlannerActions.setSelectedWeek),
      map(() => PlannerActions.loadMealPlans()),
    ),
  { functional: true },
);

// ── Assign / remove recipe ────────────────────────────────────

export const assignRecipeToDay$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(PlannerSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(PlannerActions.assignRecipeToDay),
      withLatestFrom(store.select(selectProfile), store.select(selectUser)),
      switchMap(([{ dateKey, recipeId }, profile, user]) => {
        if (!profile?.family_id || !user?.id) return EMPTY;
        return service.saveMealPlan(dateKey, recipeId, profile.family_id, user.id).pipe(
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  { functional: true, dispatch: false },
);

export const removeRecipeFromDay$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(PlannerSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(PlannerActions.removeRecipeFromDay),
      withLatestFrom(store.select(selectProfile)),
      switchMap(([{ dateKey }, profile]) => {
        if (!profile?.family_id) return EMPTY;
        return service.deleteMealPlan(profile.family_id, dateKey).pipe(
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Shopping list ─────────────────────────────────────────────

export const generateShoppingList$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(PlannerSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(PlannerActions.generateShoppingList),
      withLatestFrom(
        store.select(selectCurrentWeekPlans),
        store.select(selectSelectedWeek),
        store.select(selectAllRecipes),
        store.select(selectProfile),
      ),
      switchMap(([, weekPlans, selectedWeek, allRecipes, profile]) => {
        // Build shopping items from planned recipes
        const allIngredients: Array<{ name: string; amount: number; unit: string; recipeId: string }> = [];
        for (const plan of weekPlans.filter((p) => p.dinnerRecipeId)) {
          const recipe = allRecipes.find((r) => r.id === plan.dinnerRecipeId);
          if (!recipe) continue;
          for (const ing of recipe.ingredients) {
            allIngredients.push({ name: ing.name, amount: ing.amount, unit: ing.unit, recipeId: plan.dinnerRecipeId! });
          }
        }

        const merged = new Map<string, { amount: number; unit: string; recipeIds: string[] }>();
        for (const ing of allIngredients) {
          const key = ing.name.toLowerCase();
          if (merged.has(key)) {
            const ex = merged.get(key)!;
            ex.amount += ing.amount;
            if (!ex.recipeIds.includes(ing.recipeId)) ex.recipeIds.push(ing.recipeId);
          } else {
            merged.set(key, { amount: ing.amount, unit: ing.unit, recipeIds: [ing.recipeId] });
          }
        }

        const items: ShoppingItem[] = Array.from(merged.entries()).map(([name, data]) => ({
          id: crypto.randomUUID(),
          name,
          amount: Math.round(data.amount * 10) / 10,
          unit: data.unit,
          category: categoriseIngredient(name),
          isChecked: false,
          isManual: false,
          recipeIds: data.recipeIds,
        }));

        const list = {
          id: crypto.randomUUID(),
          weekNumber: selectedWeek.weekNumber,
          year: selectedWeek.year,
          items,
          generatedAt: new Date(),
        };

        // Persist to Supabase if user has family
        if (profile?.family_id) {
          service.saveShoppingList(list, profile.family_id).pipe(
            catchError((err) => {
              toast.show(errorHandler.handleSupabaseError(err));
              return EMPTY;
            }),
          ).subscribe();
        }

        return of(PlannerActions.generateShoppingListSuccess({ shoppingList: list }));
      }),
    ),
  { functional: true },
);

export const toggleShoppingItem$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(PlannerSupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(PlannerActions.toggleShoppingItem),
      withLatestFrom(store.select(selectShoppingList)),
      switchMap(([{ itemId }, list]) => {
        const item = list?.items.find((i) => i.id === itemId);
        if (!item) return EMPTY;
        return service.updateShoppingItem(itemId, !item.isChecked).pipe(
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Realtime meal plan sync ───────────────────────────────────

export const realtimeMealPlans$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    supabase = inject(SupabaseService),
    service = inject(PlannerSupabaseService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.loadProfileSuccess),
      switchMap(({ profile }) => {
        if (!profile.family_id) return EMPTY;
        const familyId = profile.family_id;

        return new Observable<ReturnType<typeof PlannerActions.loadMealPlansSuccess>>((subscriber) => {
          const channel = supabase.client
            .channel('meal-plans-' + familyId)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'meal_plans', filter: `family_id=eq.${familyId}` },
              () => {
                store.select(selectSelectedWeek).subscribe((week) => {
                  service.loadMealPlans(familyId, week.weekNumber, week.year).subscribe((mealPlans) => {
                    subscriber.next(PlannerActions.loadMealPlansSuccess({ mealPlans }) as any);
                  });
                }).unsubscribe();
              },
            )
            .subscribe();

          return () => {
            supabase.client.removeChannel(channel);
          };
        });
      }),
    ),
  { functional: true },
);

// ── Suggestions ───────────────────────────────────────────────

export const loadSuggestions$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) =>
    actions$.pipe(
      ofType(PlannerActions.loadSuggestions),
      withLatestFrom(store.select(selectSuggestionRules), store.select(selectMealPlans), store.select(selectAllRecipes)),
      map(([, rules, mealPlans, allRecipes]) => {
        let recipes = [...allRecipes];

        if (rules.maxCookingTime !== null) {
          recipes = recipes.filter((r) => r.cookingTime <= rules.maxCookingTime!);
        }
        if (rules.excludeCategories.length > 0) {
          recipes = recipes.filter((r) => !rules.excludeCategories.includes(r.category));
        }

        const month = new Date().getMonth() + 1;
        const currentSeason =
          month >= 3 && month <= 5 ? 'spring' :
          month >= 6 && month <= 8 ? 'summer' :
          month >= 9 && month <= 11 ? 'autumn' : 'winter';

        const scored = recipes.map((recipe) => {
          let score = 0;
          if (rules.useFavourites && recipe.isFavourite) score += 3;
          if (rules.useSeasonal && (recipe.season === currentSeason || recipe.season === 'all')) score += 2;
          if (rules.useNotCookedRecently) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - rules.notCookedRecentlyDays);
            const recentlyCooked = mealPlans.some(
              (p) => p.dinnerRecipeId === recipe.id && new Date(p.date) >= cutoff,
            );
            if (!recentlyCooked) score += 1;
          }
          return { recipe, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const recipeIds = scored.slice(0, 5).map((s) => s.recipe.id);
        return PlannerActions.loadSuggestionsSuccess({ recipeIds });
      }),
    ),
  { functional: true },
);

export const reloadSuggestionsOnRulesUpdate$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(PlannerActions.updateSuggestionRules),
      map(() => PlannerActions.loadSuggestions()),
    ),
  { functional: true },
);

export const loadSuggestionsOnInit$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(PlannerActions.loadMealPlansSuccess),
      map(() => PlannerActions.loadSuggestions()),
    ),
  { functional: true },
);
