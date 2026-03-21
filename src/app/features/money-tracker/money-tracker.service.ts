import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Transaction } from './store/money-tracker.state';

@Injectable({ providedIn: 'root' })
export class MoneyTrackerService {
  getTransactions(): Observable<Transaction[]> {
    return of([]);
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Observable<Transaction> {
    const saved: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    return of(saved);
  }

  deleteTransaction(id: string): Observable<string> {
    return of(id);
  }
}
