import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Recipe } from './store/cookbook.state';

@Injectable({ providedIn: 'root' })
export class CookbookService {
  getRecipes(): Observable<Recipe[]> {
    return of([]);
  }

  addRecipe(recipe: Omit<Recipe, 'id'>): Observable<Recipe> {
    const saved: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return of(saved);
  }

  deleteRecipe(id: string): Observable<string> {
    return of(id);
  }
}
