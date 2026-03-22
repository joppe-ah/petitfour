import { Component, input, output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Category, Recipe } from '../../models/recipe.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { Profile } from '../../../auth/models/profile.model';

@Component({
  selector: 'app-recipe-card',
  imports: [AvatarComponent],
  template: `
    <div
      (click)="navigate()"
      class="relative bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] overflow-hidden cursor-pointer
             transition-all duration-150 hover:border-pf-subtle recipe-card-animate"
    >
      <!-- Photo / category placeholder -->
      <div class="aspect-[4/3] relative overflow-hidden">
        @if (recipe().photo) {
          <img
            [src]="recipe().photo"
            [alt]="recipe().name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        } @else {
          <div [class]="placeholderBg()" class="w-full h-full flex items-center justify-center">
            <span class="text-3xl opacity-60">{{ categoryEmoji() }}</span>
          </div>
        }

        <!-- Favourite button -->
        <button
          (click)="onHeartClick($event)"
          class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
                 rounded-full bg-pf-surface/80 border border-[0.5px] border-pf-border
                 transition-colors duration-150 hover:border-pf-subtle"
          [attr.aria-label]="recipe().isFavourite ? 'Remove from favourites' : 'Add to favourites'"
        >
          <span
            class="text-sm leading-none"
            [class]="recipe().isFavourite ? 'text-[#D4537E]' : 'text-pf-muted'"
          >
            {{ recipe().isFavourite ? '♥' : '♡' }}
          </span>
        </button>

        <!-- Creator avatar -->
        @if (createdBy()) {
          <div class="absolute bottom-2 left-2">
            <pf-avatar [profile]="createdBy()!" size="sm" />
          </div>
        }
      </div>

      <!-- Card body -->
      <div class="p-3">
        <p class="text-sm font-[500] text-pf-text leading-snug line-clamp-2">
          {{ recipe().name }}
        </p>
        <div class="flex items-center gap-2 mt-1.5">
          <span class="text-[11px] text-pf-muted">{{ recipe().cookingTime }} min</span>
          <span class="text-[11px] text-pf-muted">·</span>
          <span class="text-[11px] text-pf-muted">{{ recipe().servings }} servings</span>
        </div>
      </div>
    </div>
  `,
})
export class RecipeCardComponent {
  recipe = input.required<Recipe>();
  createdBy = input<Profile | null>(null);
  favouriteToggled = output<string>();

  private router = inject(Router);

  navigate() {
    this.router.navigate(['/cookbook', this.recipe().id]);
  }

  onHeartClick(event: MouseEvent) {
    event.stopPropagation();
    this.favouriteToggled.emit(this.recipe().id);
  }

  placeholderBg(): string {
    const map: Record<Category, string> = {
      breakfast: 'bg-[#FBEAF0] dark:bg-[#3a1a24]',
      lunch: 'bg-[#E1F5EE] dark:bg-[#0d2e22]',
      dinner: 'bg-[#FEF3D9] dark:bg-[#2e1f05]',
      snack: 'bg-blue-50 dark:bg-blue-950/30',
      dessert: 'bg-purple-50 dark:bg-purple-950/30',
    };
    return map[this.recipe().category];
  }

  categoryEmoji(): string {
    const map: Record<Category, string> = {
      breakfast: '🥐',
      lunch: '🥗',
      dinner: '🍝',
      snack: '🍎',
      dessert: '🍰',
    };
    return map[this.recipe().category];
  }
}
