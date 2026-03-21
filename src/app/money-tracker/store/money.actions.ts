import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Transaction } from './money.state';

export const MoneyActions = createActionGroup({
  source: 'Money',
  events: {
    'Load Transactions': emptyProps(),
    'Load Transactions Success': props<{ transactions: Transaction[] }>(),
    'Load Transactions Failure': props<{ error: string }>(),
    'Add Transaction': props<{ transaction: Omit<Transaction, 'id'> }>(),
    'Add Transaction Success': props<{ transaction: Transaction }>(),
    'Delete Transaction': props<{ id: string }>(),
    'Delete Transaction Success': props<{ id: string }>(),
  },
});
