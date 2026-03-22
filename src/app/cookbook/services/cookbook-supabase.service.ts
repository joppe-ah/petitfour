import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { Category, Ingredient, Recipe, Season } from '../models/recipe.model';

// ── DB → TypeScript mappers ───────────────────────────────────

function rowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    photo: row.photo_url ?? undefined,
    cookingTime: row.cooking_time ?? 30,
    servings: row.servings ?? 4,
    calories: row.calories ?? 0,
    rating: row.rating ?? 0,
    isFavourite: row.is_favourite ?? false,
    category: row.category as Category,
    season: (row.season ?? 'all') as Season,
    tags: row.tags ?? [],
    ingredients: (row.ingredients ?? [])
      .slice()
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((i: any): Ingredient => ({
        id: i.id,
        name: i.name,
        amount: Number(i.amount),
        unit: i.unit,
      })),
    steps: (row.recipe_steps ?? [])
      .slice()
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((s: any) => s.description as string),
    nutrition:
      row.protein != null
        ? { protein: Number(row.protein), carbs: Number(row.carbs ?? 0), fat: Number(row.fat ?? 0) }
        : undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

@Injectable({ providedIn: 'root' })
export class CookbookSupabaseService {
  private supabase = inject(SupabaseService);

  loadRecipes(familyId: string): Observable<Recipe[]> {
    return from(
      this.supabase.client
        .from('recipes')
        .select('*, ingredients(*), recipe_steps(*)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map(rowToRecipe);
      }),
    );
  }

  saveRecipe(
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    familyId: string,
    userId: string,
  ): Observable<Recipe> {
    const isNew = !recipe.id;
    const recipeId = recipe.id ?? crypto.randomUUID();

    const recipeRow = {
      id: recipeId,
      family_id: familyId,
      created_by: userId,
      name: recipe.name,
      description: recipe.description,
      photo_url: recipe.photo ?? null,
      category: recipe.category,
      season: recipe.season ?? 'all',
      cooking_time: recipe.cookingTime,
      servings: recipe.servings,
      calories: recipe.calories,
      protein: recipe.nutrition?.protein ?? null,
      carbs: recipe.nutrition?.carbs ?? null,
      fat: recipe.nutrition?.fat ?? null,
      rating: recipe.rating,
      is_favourite: recipe.isFavourite,
      notes: recipe.notes ?? null,
      tags: recipe.tags,
    };

    const client = this.supabase.client;

    return from(
      client.from('recipes').upsert(recipeRow).select().single(),
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        // Delete existing sub-rows and reinsert
        return from(
          Promise.all([
            client.from('ingredients').delete().eq('recipe_id', recipeId),
            client.from('recipe_steps').delete().eq('recipe_id', recipeId),
          ]),
        );
      }),
      switchMap(() => {
        const ingredientRows = recipe.ingredients.map((ing, idx) => ({
          id: ing.id && !isNew ? ing.id : crypto.randomUUID(),
          recipe_id: recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          sort_order: idx,
        }));
        const stepRows = recipe.steps.map((desc, idx) => ({
          recipe_id: recipeId,
          step_number: idx + 1,
          description: desc,
        }));

        return from(
          Promise.all([
            ingredientRows.length
              ? client.from('ingredients').insert(ingredientRows)
              : Promise.resolve(),
            stepRows.length
              ? client.from('recipe_steps').insert(stepRows)
              : Promise.resolve(),
          ]),
        );
      }),
      switchMap(() =>
        from(
          client
            .from('recipes')
            .select('*, ingredients(*), recipe_steps(*)')
            .eq('id', recipeId)
            .single(),
        ),
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return rowToRecipe(data);
      }),
    );
  }

  deleteRecipe(recipeId: string): Observable<void> {
    return from(
      this.supabase.client.from('recipes').delete().eq('id', recipeId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  toggleFavourite(recipeId: string, value: boolean): Observable<void> {
    return from(
      this.supabase.client
        .from('recipes')
        .update({ is_favourite: value })
        .eq('id', recipeId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  updateNote(recipeId: string, note: string): Observable<void> {
    return from(
      this.supabase.client
        .from('recipes')
        .update({ notes: note })
        .eq('id', recipeId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
