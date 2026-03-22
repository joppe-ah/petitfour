import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../auth/store/auth.actions';
import {
  selectProfile,
  selectIsAuthenticated,
} from '../auth/store/auth.selectors';
import { selectAllRecipes } from '../cookbook/store/cookbook.selectors';
import { CookbookActions } from '../cookbook/store/cookbook.actions';
import {
  ColorTheme,
  COLOR_THEME_VALUES,
  DietaryPreference,
  DIETARY_LABELS,
} from '../auth/models/profile.model';
import { AvatarComponent } from '../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, AvatarComponent],
  template: `
    <div class="min-h-full bg-pf-bg pb-24">

      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-[0.5px] border-pf-border">
        <h1 class="text-base font-[500] text-pf-text">Profile</h1>
      </div>

      @if (profile(); as p) {
        <div class="px-6 py-6 flex flex-col gap-6">

          <!-- Avatar + name -->
          <div class="flex flex-col items-center gap-3">
            <pf-avatar [profile]="p" size="lg" />

            @if (!editingName()) {
              <div class="flex items-center gap-2">
                <h2 class="text-base font-[500] text-pf-text">{{ p.name }}</h2>
                <button
                  (click)="startEditName(p.name)"
                  class="text-pf-muted hover:text-pf-subtle text-xs"
                >✎</button>
              </div>
            } @else {
              <div class="flex items-center gap-2">
                <input
                  [(ngModel)]="editName"
                  class="px-2 py-1 bg-pf-bg border border-[0.5px] border-[#1D9E75] rounded-[6px]
                         text-sm text-pf-text focus:outline-none text-center"
                  (keydown.enter)="saveName()"
                  (keydown.escape)="editingName.set(false)"
                />
                <button
                  (click)="saveName()"
                  class="px-2 py-1 bg-[#1D9E75] text-white text-xs rounded-[6px]"
                >Save</button>
                <button
                  (click)="editingName.set(false)"
                  class="px-2 py-1 border border-[0.5px] border-pf-border text-xs text-pf-subtle rounded-[6px]"
                >Cancel</button>
              </div>
            }
          </div>

          <!-- Color theme -->
          <div>
            <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">
              Personal color
            </p>
            <div class="flex gap-3">
              @for (theme of colorThemes; track theme) {
                <button
                  (click)="setTheme(theme)"
                  class="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  [style.background-color]="themeColor(theme)"
                  [attr.title]="theme"
                >
                  @if (p.color_theme === theme) {
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1 5.5L5 9.5L13 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Dietary preferences -->
          <div>
            <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">
              Dietary preferences
            </p>
            <div class="flex flex-wrap gap-2">
              @for (pref of dietaryOptions; track pref) {
                <button
                  (click)="toggleDiet(pref)"
                  class="px-3 py-1.5 rounded-full text-xs border border-[0.5px] transition-colors"
                  [class]="isDietSelected(pref, p.dietary_preferences)
                    ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
                    : 'border-pf-border text-pf-subtle hover:border-pf-subtle'"
                >
                  {{ dietLabel(pref) }}
                </button>
              }
            </div>
            @if (dietsDirty()) {
              <button
                (click)="saveDiets()"
                class="mt-3 px-3 py-1.5 bg-[#1D9E75] text-white text-xs rounded-[8px]"
              >
                Save preferences
              </button>
            }
          </div>

          <!-- Favourite recipes -->
          <div>
            <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">
              My favourite recipes
            </p>
            @if (favouriteRecipes().length > 0) {
              <div class="flex flex-col gap-0">
                @for (recipe of favouriteRecipes(); track recipe.id) {
                  <a
                    [routerLink]="['/cookbook', recipe.id]"
                    class="flex items-center gap-3 py-3 border-b border-[0.5px] border-pf-border last:border-0
                           hover:text-pf-text transition-colors"
                  >
                    <span class="text-base">{{ categoryEmoji(recipe.category) }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-pf-text leading-snug truncate">{{ recipe.name }}</p>
                      <p class="text-[11px] text-pf-muted mt-0.5">
                        {{ recipe.cookingTime }} min · {{ recipe.servings }} servings
                      </p>
                    </div>
                    <span class="text-pf-muted text-xs">→</span>
                  </a>
                }
              </div>
            } @else {
              <p class="text-xs text-pf-muted">
                No favourites yet. Heart a recipe to save it here.
              </p>
            }
          </div>

          <!-- Sign out -->
          <div class="pt-2">
            @if (!confirmSignOut()) {
              <button
                (click)="confirmSignOut.set(true)"
                class="w-full py-2.5 border border-[0.5px] border-pf-border rounded-[8px]
                       text-sm text-pf-subtle hover:text-[#D85A30] hover:border-[#D85A30] transition-colors"
              >
                Sign out
              </button>
            } @else {
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[10px] p-4">
                <p class="text-sm text-pf-text mb-3">Sign out of PetitFour?</p>
                <div class="flex gap-2">
                  <button
                    (click)="signOut()"
                    class="flex-1 py-2 bg-[#D85A30] text-white text-sm rounded-[8px]"
                  >Sign out</button>
                  <button
                    (click)="confirmSignOut.set(false)"
                    class="flex-1 py-2 border border-[0.5px] border-pf-border text-sm text-pf-subtle rounded-[8px]"
                  >Cancel</button>
                </div>
              </div>
            }
          </div>

        </div>
      } @else {
        <div class="flex items-center justify-center h-40">
          <div class="w-6 h-6 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }

    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);

  profile = this.store.selectSignal(selectProfile);
  private allRecipes = this.store.selectSignal(selectAllRecipes);

  favouriteRecipes = computed(() => this.allRecipes().filter(r => r.isFavourite));

  editingName = signal(false);
  editName = '';
  confirmSignOut = signal(false);
  pendingDiets = signal<DietaryPreference[] | null>(null);
  dietsDirty = computed(() => this.pendingDiets() !== null);

  colorThemes: ColorTheme[] = ['teal', 'amber', 'coral', 'purple', 'blue', 'pink'];
  dietaryOptions: DietaryPreference[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher',
  ];

  ngOnInit(): void {
    if (this.allRecipes().length === 0) {
      this.store.dispatch(CookbookActions.loadRecipes());
    }
  }

  startEditName(current: string): void {
    this.editName = current;
    this.editingName.set(true);
  }

  saveName(): void {
    const name = this.editName.trim();
    if (!name) return;
    this.store.dispatch(AuthActions.saveProfile({ profile: { name } }));
    this.editingName.set(false);
  }

  themeColor(theme: ColorTheme): string {
    return COLOR_THEME_VALUES[theme];
  }

  setTheme(theme: ColorTheme): void {
    this.store.dispatch(AuthActions.saveProfile({ profile: { color_theme: theme } }));
  }

  isDietSelected(pref: DietaryPreference, profileDiets: DietaryPreference[]): boolean {
    const current = this.pendingDiets() ?? profileDiets;
    return current.includes(pref);
  }

  toggleDiet(pref: DietaryPreference): void {
    const current = this.pendingDiets() ?? (this.profile()?.dietary_preferences ?? []);
    this.pendingDiets.set(
      current.includes(pref) ? current.filter(d => d !== pref) : [...current, pref],
    );
  }

  saveDiets(): void {
    const diets = this.pendingDiets();
    if (diets === null) return;
    this.store.dispatch(AuthActions.saveProfile({ profile: { dietary_preferences: diets } }));
    this.pendingDiets.set(null);
  }

  dietLabel(pref: DietaryPreference): string {
    return DIETARY_LABELS[pref];
  }

  categoryEmoji(category: string): string {
    const map: Record<string, string> = {
      breakfast: '🥐', lunch: '🥗', dinner: '🍝', snack: '🍎', dessert: '🍰',
    };
    return map[category] ?? '🍴';
  }

  signOut(): void {
    this.store.dispatch(AuthActions.signOut());
  }
}
