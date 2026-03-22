import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { MealPlan } from '../models/meal-plan.model';
import { ShoppingItem, ShoppingList } from '../models/shopping-list.model';
import { getISOWeek, getWeekDates, toDateKey } from '../store/planner.state';

function rowToMealPlan(row: any): MealPlan {
  const date = new Date(row.date + 'T12:00:00Z');
  return {
    id: row.id,
    date,
    weekNumber: getISOWeek(date),
    year: date.getUTCFullYear(),
    dinnerRecipeId: row.dinner_recipe_id ?? null,
    notes: row.notes ?? undefined,
  };
}

function rowToShoppingItem(row: any): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount ?? 0),
    unit: row.unit ?? '',
    category: row.category ?? 'other',
    isChecked: row.is_checked ?? false,
    isManual: row.is_manual ?? false,
    recipeIds: row.recipe_ids ?? [],
  };
}

@Injectable({ providedIn: 'root' })
export class PlannerSupabaseService {
  private supabase = inject(SupabaseService);

  loadMealPlans(familyId: string, weekNumber: number, year: number): Observable<MealPlan[]> {
    const dates = getWeekDates(weekNumber, year);
    const monday = toDateKey(dates[0]);
    const sunday = toDateKey(dates[6]);

    return from(
      this.supabase.client
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId)
        .gte('date', monday)
        .lte('date', sunday)
        .order('date', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToMealPlan);
      }),
    );
  }

  saveMealPlan(dateKey: string, recipeId: string | null, familyId: string, userId: string): Observable<MealPlan> {
    return from(
      this.supabase.client
        .from('meal_plans')
        .upsert(
          {
            family_id: familyId,
            created_by: userId,
            date: dateKey,
            dinner_recipe_id: recipeId,
          },
          { onConflict: 'family_id,date' },
        )
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return rowToMealPlan(data);
      }),
    );
  }

  deleteMealPlan(familyId: string, dateKey: string): Observable<void> {
    return from(
      this.supabase.client
        .from('meal_plans')
        .delete()
        .eq('family_id', familyId)
        .eq('date', dateKey),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  loadShoppingList(familyId: string, weekNumber: number, year: number): Observable<ShoppingList | null> {
    return from(
      this.supabase.client
        .from('shopping_lists')
        .select('*, shopping_items(*)')
        .eq('family_id', familyId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return null;
        return {
          id: data.id,
          weekNumber: data.week_number,
          year: data.year,
          generatedAt: new Date(data.generated_at),
          items: (data.shopping_items ?? []).map(rowToShoppingItem),
        } as ShoppingList;
      }),
    );
  }

  saveShoppingList(list: ShoppingList, familyId: string): Observable<ShoppingList> {
    const client = this.supabase.client;

    return from(
      client
        .from('shopping_lists')
        .upsert(
          { family_id: familyId, week_number: list.weekNumber, year: list.year, generated_at: new Date().toISOString() },
          { onConflict: 'family_id,week_number,year' },
        )
        .select()
        .single(),
    ).pipe(
      switchMap(({ data: listRow, error }) => {
        if (error) throw error;
        return from(
          client.from('shopping_items').delete().eq('shopping_list_id', listRow.id),
        ).pipe(
          switchMap(() => {
            const itemRows = list.items.map((item, idx) => ({
              id: item.id,
              shopping_list_id: listRow.id,
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              category: item.category,
              is_checked: item.isChecked,
              is_manual: item.isManual,
              recipe_ids: item.recipeIds,
              sort_order: idx,
            }));
            return from(
              itemRows.length ? client.from('shopping_items').insert(itemRows) : Promise.resolve({ error: null }),
            );
          }),
          map(() => ({
            id: listRow.id,
            weekNumber: listRow.week_number,
            year: listRow.year,
            generatedAt: new Date(listRow.generated_at),
            items: list.items,
          }) as ShoppingList),
        );
      }),
    );
  }

  updateShoppingItem(itemId: string, isChecked: boolean): Observable<void> {
    return from(
      this.supabase.client
        .from('shopping_items')
        .update({ is_checked: isChecked })
        .eq('id', itemId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
