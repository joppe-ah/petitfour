import { inject, Injectable } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { Budget, BudgetGroup } from '../models/budget.model';
import { Category, CategoryGroup } from '../models/category.model';
import { FixedCost } from '../models/fixed-cost.model';
import { SavingsGoal } from '../models/savings-goal.model';
import { Transaction } from '../models/transaction.model';
import { DEFAULT_CATEGORIES } from '../data/default-categories';

// ── DB → TypeScript mappers ───────────────────────────────────

function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type as 'expense' | 'income',
    amount: Number(row.amount),
    description: row.description,
    category: row.category_id ?? '',
    date: new Date(row.date + 'T12:00:00Z'),
    isFixed: row.is_fixed ?? false,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? '📦',
    color: row.color ?? '#888888',
    group: row.group_type as CategoryGroup,
    isCustom: row.is_custom ?? false,
  };
}

function rowToBudget(row: any, categories: Category[]): Budget {
  const cat = categories.find((c) => c.id === row.category_id);
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: Number(row.amount),
    spent: 0, // computed in selectors from transactions
    month: row.month,
    year: row.year,
    group: (cat?.group ?? 'needs') as BudgetGroup,
  };
}

function rowToFixedCost(row: any): FixedCost {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    dayOfMonth: row.day_of_month,
    categoryId: row.category_id ?? '',
    isActive: row.is_active ?? true,
  };
}

function rowToSavingsGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    monthlyContribution: Number(row.monthly_contribution),
    color: row.color ?? 'blue',
    emoji: row.emoji ?? '🎯',
    createdAt: new Date(row.created_at),
    targetDate: row.target_date ? new Date(row.target_date + 'T12:00:00Z') : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class MoneySupabaseService {
  private supabase = inject(SupabaseService);

  // ── Categories ────────────────────────────────────────────

  loadCategories(userId: string): Observable<Category[]> {
    return from(
      this.supabase.client
        .from('categories')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToCategory);
      }),
    );
  }

  saveCategory(category: Omit<Category, 'id'>, userId: string): Observable<Category> {
    return from(
      this.supabase.client
        .from('categories')
        .insert({
          created_by: userId,
          name: category.name,
          icon: category.icon,
          color: category.color,
          group_type: category.group,
          is_custom: true,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToCategory(data);
      }),
    );
  }

  deleteCategory(categoryId: string): Observable<void> {
    return from(
      this.supabase.client.from('categories').delete().eq('id', categoryId),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  seedDefaultCategories(userId: string): Observable<Category[]> {
    const rows = DEFAULT_CATEGORIES.map((cat) => ({
      id: crypto.randomUUID(),
      created_by: userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      group_type: cat.group,
      is_custom: false,
    }));

    return from(
      this.supabase.client.from('categories').insert(rows).select(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToCategory);
      }),
    );
  }

  // ── Transactions ──────────────────────────────────────────

  loadTransactions(userId: string): Observable<Transaction[]> {
    return from(
      this.supabase.client
        .from('transactions')
        .select('*')
        .eq('created_by', userId)
        .order('date', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToTransaction);
      }),
    );
  }

  saveTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
  ): Observable<Transaction> {
    return from(
      this.supabase.client
        .from('transactions')
        .insert({
          created_by: userId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category_id: transaction.category || null,
          date: transaction.date instanceof Date
            ? transaction.date.toISOString().slice(0, 10)
            : transaction.date,
          is_fixed: transaction.isFixed,
          notes: transaction.notes ?? null,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToTransaction(data);
      }),
    );
  }

  updateTransaction(transaction: Transaction): Observable<Transaction> {
    return from(
      this.supabase.client
        .from('transactions')
        .update({
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category_id: transaction.category || null,
          date: transaction.date instanceof Date
            ? transaction.date.toISOString().slice(0, 10)
            : transaction.date,
          is_fixed: transaction.isFixed,
          notes: transaction.notes ?? null,
        })
        .eq('id', transaction.id)
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToTransaction(data);
      }),
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return from(
      this.supabase.client.from('transactions').delete().eq('id', id),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  // ── Budgets ───────────────────────────────────────────────

  loadBudgets(userId: string, month: number, year: number): Observable<Budget[]> {
    return this.loadCategories(userId).pipe(
      switchMap((categories) =>
        from(
          this.supabase.client
            .from('budgets')
            .select('*')
            .eq('created_by', userId)
            .eq('month', month)
            .eq('year', year),
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return (data ?? []).map((row) => rowToBudget(row, categories));
          }),
        ),
      ),
    );
  }

  upsertBudget(budget: Omit<Budget, 'spent'>, userId: string): Observable<void> {
    return from(
      this.supabase.client.from('budgets').upsert(
        {
          id: budget.id,
          created_by: userId,
          category_id: budget.categoryId,
          amount: budget.amount,
          month: budget.month,
          year: budget.year,
        },
        { onConflict: 'created_by,category_id,month,year' },
      ),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  // ── Fixed costs ───────────────────────────────────────────

  loadFixedCosts(userId: string): Observable<FixedCost[]> {
    return from(
      this.supabase.client
        .from('fixed_costs')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToFixedCost);
      }),
    );
  }

  saveFixedCost(cost: Omit<FixedCost, 'id'>, userId: string): Observable<FixedCost> {
    return from(
      this.supabase.client
        .from('fixed_costs')
        .insert({
          created_by: userId,
          name: cost.name,
          amount: cost.amount,
          day_of_month: cost.dayOfMonth,
          category_id: cost.categoryId || null,
          is_active: cost.isActive,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToFixedCost(data);
      }),
    );
  }

  updateFixedCost(cost: FixedCost): Observable<void> {
    return from(
      this.supabase.client
        .from('fixed_costs')
        .update({
          name: cost.name,
          amount: cost.amount,
          day_of_month: cost.dayOfMonth,
          category_id: cost.categoryId || null,
          is_active: cost.isActive,
        })
        .eq('id', cost.id),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  deleteFixedCost(id: string): Observable<void> {
    return from(
      this.supabase.client.from('fixed_costs').delete().eq('id', id),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  // ── Savings goals ─────────────────────────────────────────

  loadSavingsGoals(userId: string): Observable<SavingsGoal[]> {
    return from(
      this.supabase.client
        .from('savings_goals')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToSavingsGoal);
      }),
    );
  }

  saveSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>, userId: string): Observable<SavingsGoal> {
    return from(
      this.supabase.client
        .from('savings_goals')
        .insert({
          created_by: userId,
          name: goal.name,
          target_amount: goal.targetAmount,
          saved_amount: goal.savedAmount,
          monthly_contribution: goal.monthlyContribution,
          color: goal.color,
          emoji: goal.emoji,
          target_date: goal.targetDate instanceof Date
            ? goal.targetDate.toISOString().slice(0, 10)
            : null,
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToSavingsGoal(data);
      }),
    );
  }

  updateSavingsGoal(goal: SavingsGoal): Observable<void> {
    return from(
      this.supabase.client
        .from('savings_goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          saved_amount: goal.savedAmount,
          monthly_contribution: goal.monthlyContribution,
          color: goal.color,
          emoji: goal.emoji,
          target_date: goal.targetDate instanceof Date
            ? goal.targetDate.toISOString().slice(0, 10)
            : null,
        })
        .eq('id', goal.id),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  deleteSavingsGoal(id: string): Observable<void> {
    return from(
      this.supabase.client.from('savings_goals').delete().eq('id', id),
    ).pipe(map(({ error }) => { if (error) throw error; }));
  }

  // ── Composite load ────────────────────────────────────────

  loadAllMoneyData(userId: string, month: number, year: number) {
    return forkJoin({
      categories: this.loadCategories(userId),
      transactions: this.loadTransactions(userId),
      fixedCosts: this.loadFixedCosts(userId),
      savingsGoals: this.loadSavingsGoals(userId),
    }).pipe(
      switchMap((partial) =>
        this.loadBudgets(userId, month, year).pipe(
          map((budgets) => ({ ...partial, budgets })),
        ),
      ),
    );
  }
}
