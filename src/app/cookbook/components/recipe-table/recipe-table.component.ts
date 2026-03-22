import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Recipe } from '../../models/recipe.model';
import { CookbookActions } from '../../store/cookbook.actions';
import { selectFilteredRecipes, selectSort } from '../../store/cookbook.selectors';
import { SortState } from '../../store/cookbook.state';
import { BadgeComponent } from '../../../shared/components/badge/badge';

@Component({
  selector: 'app-recipe-table',
  imports: [BadgeComponent],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-[0.5px] border-pf-border">
            <th class="text-left text-xs text-pf-subtle pb-3 font-[400] pr-4">Recipe</th>
            <th
              class="text-left text-xs text-pf-subtle pb-3 font-[400] pr-4 cursor-pointer hover:text-pf-text transition-colors select-none"
              (click)="toggleSort('cookingTime')"
            >
              Time {{ sortArrow('cookingTime') }}
            </th>
            <th
              class="text-left text-xs text-pf-subtle pb-3 font-[400] pr-4 cursor-pointer hover:text-pf-text transition-colors select-none"
              (click)="toggleSort('calories')"
            >
              Kcal {{ sortArrow('calories') }}
            </th>
            <th
              class="text-left text-xs text-pf-subtle pb-3 font-[400] pr-4 cursor-pointer hover:text-pf-text transition-colors select-none"
              (click)="toggleSort('rating')"
            >
              Rating {{ sortArrow('rating') }}
            </th>
            <th class="text-left text-xs text-pf-subtle pb-3 font-[400] w-8">Fav</th>
          </tr>
        </thead>
        <tbody>
          @for (recipe of recipes(); track recipe.id) {
            <tr
              class="border-b border-[0.5px] border-pf-border hover:bg-pf-bg transition-colors cursor-pointer"
              (click)="onRowClick(recipe)"
            >
              <!-- Name + category -->
              <td class="py-3 pr-4">
                <p class="text-sm text-pf-text font-[500]">{{ recipe.name }}</p>
                <div class="mt-1">
                  <pf-badge [color]="badgeColor(recipe.category)">
                    {{ recipe.category }}
                  </pf-badge>
                </div>
              </td>

              <!-- Time -->
              <td class="py-3 pr-4">
                <span class="text-sm text-pf-subtle">{{ recipe.cookingTime }} min</span>
              </td>

              <!-- Calories -->
              <td class="py-3 pr-4">
                <span class="text-sm text-pf-amber">{{ recipe.calories }}</span>
              </td>

              <!-- Rating -->
              <td class="py-3 pr-4">
                <span class="text-sm tracking-tight">
                  @for (star of getStars(recipe.rating); track $index) {
                    <span [class]="star ? 'text-yellow-400' : 'text-pf-muted'">★</span>
                  }
                </span>
              </td>

              <!-- Favourite -->
              <td class="py-3">
                <button
                  (click)="onHeartClick($event, recipe.id)"
                  class="text-base leading-none transition-colors duration-150 cursor-pointer"
                  [class]="recipe.isFavourite ? 'text-[#D4537E]' : 'text-pf-muted hover:text-[#D4537E]'"
                >
                  {{ recipe.isFavourite ? '♥' : '♡' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class RecipeTableComponent {
  private store = inject(Store);
  private router = inject(Router);

  recipes = this.store.selectSignal(selectFilteredRecipes);
  sort = this.store.selectSignal(selectSort);

  toggleSort(column: SortState['column']) {
    const current = this.sort();
    const direction =
      current.column === column && current.direction === 'asc' ? 'desc' : 'asc';
    this.store.dispatch(CookbookActions.setSort({ sort: { column, direction } }));
  }

  sortArrow(column: SortState['column']): string {
    const current = this.sort();
    if (current.column !== column) return '';
    return current.direction === 'asc' ? ' ↑' : ' ↓';
  }

  getStars(rating: number): boolean[] {
    const rounded = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i < rounded);
  }

  badgeColor(category: string): 'teal' | 'amber' | 'default' {
    if (category === 'lunch') return 'teal';
    if (category === 'dinner') return 'amber';
    return 'default';
  }

  onRowClick(recipe: Recipe) {
    this.router.navigate(['/cookbook', recipe.id]);
  }

  onHeartClick(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.store.dispatch(CookbookActions.toggleFavourite({ id }));
  }
}
