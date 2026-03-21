import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BadgeComponent } from '../shared/components/badge/badge';
import { ButtonComponent } from '../shared/components/button/button';
import { CardComponent } from '../shared/components/card/card';
import { SpinnerComponent } from '../shared/components/spinner/spinner';
import { CookbookActions } from './store/cookbook.actions';
import { selectCookbookLoading, selectRecipes } from './store/cookbook.selectors';

@Component({
  selector: 'app-cookbook',
  imports: [AsyncPipe, CardComponent, ButtonComponent, BadgeComponent, SpinnerComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-base text-pf-text">Cookbook</h1>
          <p class="text-xs text-pf-subtle mt-0.5">Family recipes</p>
        </div>
        <pf-button variant="secondary">+ Add recipe</pf-button>
      </div>

      @if (loading$ | async) {
        <div class="flex items-center gap-2 text-pf-subtle text-sm">
          <pf-spinner /> Loading…
        </div>
      } @else {
        @let recipes = recipes$ | async;
        @if (!recipes || recipes.length === 0) {
          <div class="text-center py-16 text-pf-muted text-sm">
            <p class="text-2xl mb-2">◎</p>
            <p>No recipes yet</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (recipe of recipes; track recipe.id) {
              <pf-card>
                <p class="text-sm text-pf-text">{{ recipe.name }}</p>
                <p class="text-xs text-pf-subtle mt-1 line-clamp-2">
                  {{ recipe.description }}
                </p>
                @if (recipe.tags.length) {
                  <div class="flex flex-wrap gap-1 mt-3">
                    @for (tag of recipe.tags; track tag) {
                      <pf-badge color="teal">{{ tag }}</pf-badge>
                    }
                  </div>
                }
              </pf-card>
            }
          </div>
        }
      }
    </div>
  `,
})
export class CookbookComponent implements OnInit {
  private store = inject(Store);

  recipes$ = this.store.select(selectRecipes);
  loading$ = this.store.select(selectCookbookLoading);

  ngOnInit() {
    this.store.dispatch(CookbookActions.loadRecipes());
  }
}
