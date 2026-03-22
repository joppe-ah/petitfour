import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CookbookActions } from '../../store/cookbook.actions';
import { selectFilteredRecipes } from '../../store/cookbook.selectors';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';

@Component({
  selector: 'app-recipe-gallery',
  imports: [RecipeCardComponent],
  template: `
    <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      @for (recipe of recipes(); track recipe.id; let i = $index) {
        <app-recipe-card
          [recipe]="recipe"
          [style.animation-delay]="(i * 30) + 'ms'"
          (favouriteToggled)="onToggleFavourite($event)"
        />
      }
    </div>
  `,
})
export class RecipeGalleryComponent {
  private store = inject(Store);
  recipes = this.store.selectSignal(selectFilteredRecipes);

  onToggleFavourite(id: string) {
    this.store.dispatch(CookbookActions.toggleFavourite({ id }));
  }
}
