import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { CookbookActions } from './store/cookbook.actions';
import { selectFilteredRecipes, selectLoading, selectViewMode } from './store/cookbook.selectors';
import { CookbookFiltersComponent } from './components/cookbook-filters/cookbook-filters.component';
import { RecipeGalleryComponent } from './components/recipe-gallery/recipe-gallery.component';
import { RecipeTableComponent } from './components/recipe-table/recipe-table.component';
import { SkeletonComponent } from '../shared/components/skeleton/skeleton';
import { AddRecipeModalComponent } from './components/add-recipe-modal/add-recipe-modal.component';

@Component({
  selector: 'app-cookbook',
  imports: [
    CookbookFiltersComponent,
    RecipeGalleryComponent,
    RecipeTableComponent,
    SkeletonComponent,
    AddRecipeModalComponent,
  ],
  template: `
    <div class="relative p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-base text-pf-text font-[500]">Cookbook</h1>
        <p class="text-xs text-pf-subtle mt-0.5">Your family recipes</p>
      </div>

      <!-- Filters + view toggle -->
      <app-cookbook-filters />

      <!-- Loading state -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="rounded-[12px] overflow-hidden border border-[0.5px] border-pf-border">
              <pf-skeleton width="100%" height="140px" />
              <div class="p-3 space-y-2">
                <pf-skeleton width="70%" height="14px" />
                <pf-skeleton width="45%" height="11px" />
              </div>
            </div>
          }
        </div>
      } @else if (filteredRecipes().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <span class="text-3xl mb-3">◎</span>
          <p class="text-sm text-pf-text">No recipes found</p>
          <p class="text-xs text-pf-muted mt-1">Try adjusting your filters</p>
          <button
            (click)="clearFilters()"
            class="mt-4 px-4 py-2 rounded-[8px] border border-[0.5px] border-pf-border text-xs text-pf-subtle hover:text-pf-text hover:border-pf-subtle transition-colors"
          >
            Clear filters
          </button>
        </div>
      } @else if (viewMode() === 'gallery') {
        <app-recipe-gallery />
      } @else {
        <app-recipe-table />
      }

      <!-- FAB -->
      <button
        (click)="showAddModal.set(true)"
        class="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#1D9E75] text-white shadow-lg flex items-center justify-center text-2xl hover:bg-[#178a65] transition-colors z-30"
        aria-label="Add recipe"
      >
        +
      </button>

      <!-- Add Recipe Modal -->
      @if (showAddModal()) {
        <app-add-recipe-modal (close)="showAddModal.set(false)" />
      }
    </div>
  `,
})
export class CookbookComponent implements OnInit {
  private store = inject(Store);

  loading = this.store.selectSignal(selectLoading);
  filteredRecipes = this.store.selectSignal(selectFilteredRecipes);
  viewMode = this.store.selectSignal(selectViewMode);
  showAddModal = signal(false);

  ngOnInit() {
    this.store.dispatch(CookbookActions.loadRecipes());
  }

  clearFilters() {
    this.store.dispatch(
      CookbookActions.setFilter({
        filter: {
          search: '',
          category: null,
          favouritesOnly: false,
          maxCookingTime: null,
          season: null,
          ingredient: null,
        },
      }),
    );
  }
}
