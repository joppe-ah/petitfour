import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectUser } from '../../auth/store/auth.selectors';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MoneySupabaseService } from '../services/money-supabase.service';
import { MoneyActions } from './money.actions';
import { selectSelectedMonth, selectSelectedYear } from './money.selectors';

// ── Load all money data ───────────────────────────────────────

export const loadMoneyDataOnAuth$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(AuthActions.initAuthSuccess),
      withLatestFrom(store.select(selectSelectedMonth), store.select(selectSelectedYear)),
      switchMap(([{ user }, month, year]) => {
        return service.loadAllMoneyData(user.id, month, year).pipe(
          switchMap(({ categories, transactions, budgets, fixedCosts, savingsGoals }) => {
            // If no categories yet (new user), seed defaults then reload
            if (categories.length === 0) {
              return service.seedDefaultCategories(user.id).pipe(
                switchMap(() => service.loadAllMoneyData(user.id, month, year)),
                map((data) => MoneyActions.loadMoneyDataSuccess({
                  transactions: data.transactions,
                  budgets: data.budgets,
                  categories: data.categories,
                  fixedCosts: data.fixedCosts,
                  savingsGoals: data.savingsGoals,
                })),
              );
            }
            return of(MoneyActions.loadMoneyDataSuccess({ transactions, budgets, categories, fixedCosts, savingsGoals }));
          }),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return of(MoneyActions.loadMoneyDataFailure({ error: err.message }));
          }),
        );
      }),
    ),
  { functional: true },
);

export const loadMoneyData$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.loadMoneyData),
      withLatestFrom(store.select(selectUser), store.select(selectSelectedMonth), store.select(selectSelectedYear)),
      switchMap(([, user, month, year]) => {
        if (!user?.id) return of(MoneyActions.loadMoneyDataFailure({ error: 'Not authenticated' }));
        return service.loadAllMoneyData(user.id, month, year).pipe(
          map(({ categories, transactions, budgets, fixedCosts, savingsGoals }) =>
            MoneyActions.loadMoneyDataSuccess({ transactions, budgets, categories, fixedCosts, savingsGoals }),
          ),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return of(MoneyActions.loadMoneyDataFailure({ error: err.message }));
          }),
        );
      }),
    ),
  { functional: true },
);

// Reload when month changes
export const loadMoneyDataOnMonthChange$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(MoneyActions.setSelectedMonth),
      map(() => MoneyActions.loadMoneyData()),
    ),
  { functional: true },
);

// ── Transactions ──────────────────────────────────────────────

export const addTransaction$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addTransaction),
      withLatestFrom(store.select(selectUser)),
      switchMap(([{ transaction }, user]) => {
        if (!user?.id) return of(MoneyActions.loadMoneyDataFailure({ error: 'Not authenticated' }));
        return service.saveTransaction(transaction, user.id).pipe(
          map((saved) => MoneyActions.addTransactionSuccess({ transaction: saved })),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  { functional: true },
);

export const editTransaction$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.editTransaction),
      switchMap(({ transaction }) =>
        service.updateTransaction(transaction).pipe(
          map((saved) => MoneyActions.editTransactionSuccess({ transaction: saved })),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        ),
      ),
    ),
  { functional: true },
);

export const deleteTransaction$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.deleteTransaction),
      switchMap(({ id }) =>
        service.deleteTransaction(id).pipe(
          map(() => MoneyActions.deleteTransactionSuccess({ id })),
          catchError((err) => {
            toast.show(errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        ),
      ),
    ),
  { functional: true },
);

// ── Budgets (optimistic + fire-and-forget) ────────────────────

export const addBudget$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addBudget),
      withLatestFrom(store.select(selectUser)),
      tap(([{ budget }, user]) => {
        if (!user?.id) return;
        service.upsertBudget({ ...budget, id: crypto.randomUUID() }, user.id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const editBudget$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.editBudget),
      withLatestFrom(store.select(selectUser)),
      tap(([{ budget }, user]) => {
        if (!user?.id) return;
        service.upsertBudget(budget, user.id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Fixed costs ───────────────────────────────────────────────

export const addFixedCost$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addFixedCost),
      withLatestFrom(store.select(selectUser)),
      tap(([{ fixedCost }, user]) => {
        if (!user?.id) return;
        service.saveFixedCost(fixedCost, user.id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const editFixedCost$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.editFixedCost),
      tap(({ fixedCost }) => {
        service.updateFixedCost(fixedCost).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const deleteFixedCost$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.deleteFixedCost),
      tap(({ id }) => {
        service.deleteFixedCost(id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Savings goals ─────────────────────────────────────────────

export const addSavingsGoal$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addSavingsGoal),
      withLatestFrom(store.select(selectUser)),
      tap(([{ goal }, user]) => {
        if (!user?.id) return;
        service.saveSavingsGoal(goal, user.id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const editSavingsGoal$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.editSavingsGoal),
      tap(({ goal }) => {
        service.updateSavingsGoal(goal).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const deleteSavingsGoal$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.deleteSavingsGoal),
      tap(({ id }) => {
        service.deleteSavingsGoal(id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const addToSavingsGoal$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addToSavingsGoal),
      withLatestFrom(store.select((state: any) => state.money?.savingsGoals ?? [])),
      tap(([{ goalId, amount }, goals]) => {
        const goal = goals.find((g: any) => g.id === goalId);
        if (!goal) return;
        service.updateSavingsGoal({ ...goal, savedAmount: goal.savedAmount + amount }).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

// ── Categories ────────────────────────────────────────────────

export const addCategory$ = createEffect(
  (
    actions$ = inject(Actions),
    store = inject(Store),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.addCategory),
      withLatestFrom(store.select(selectUser)),
      tap(([{ category }, user]) => {
        if (!user?.id) return;
        service.saveCategory(category, user.id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);

export const deleteCategory$ = createEffect(
  (
    actions$ = inject(Actions),
    service = inject(MoneySupabaseService),
    toast = inject(ToastService),
    errorHandler = inject(ErrorHandlerService),
  ) =>
    actions$.pipe(
      ofType(MoneyActions.deleteCategory),
      tap(({ id }) => {
        service.deleteCategory(id).pipe(
          catchError((err) => { toast.show(errorHandler.handleSupabaseError(err)); return EMPTY; }),
        ).subscribe();
      }),
    ),
  { functional: true, dispatch: false },
);
