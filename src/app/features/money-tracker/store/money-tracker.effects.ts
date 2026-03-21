import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MoneyTrackerActions } from './money-tracker.actions';
import { MoneyTrackerService } from '../money-tracker.service';

export const loadTransactions$ = createEffect(
  (actions$ = inject(Actions), service = inject(MoneyTrackerService)) =>
    actions$.pipe(
      ofType(MoneyTrackerActions.loadTransactions),
      switchMap(() =>
        service.getTransactions().pipe(
          map((transactions) =>
            MoneyTrackerActions.loadTransactionsSuccess({ transactions }),
          ),
          catchError((error) =>
            of(MoneyTrackerActions.loadTransactionsFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const addTransaction$ = createEffect(
  (actions$ = inject(Actions), service = inject(MoneyTrackerService)) =>
    actions$.pipe(
      ofType(MoneyTrackerActions.addTransaction),
      switchMap(({ transaction }) =>
        service.addTransaction(transaction).pipe(
          map((saved) =>
            MoneyTrackerActions.addTransactionSuccess({ transaction: saved }),
          ),
          catchError((error) =>
            of(MoneyTrackerActions.loadTransactionsFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  { functional: true },
);
