import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookbookActions } from '../../store/cookbook.actions';
import { selectFilters, selectViewMode } from '../../store/cookbook.selectors';
import { Category } from '../../models/recipe.model';

interface CategoryOption {
  value: Category | null;
  label: string;
}

function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

@Component({
  selector: 'app-cookbook-filters',
  template: `
    <div class="flex flex-col gap-3 pb-4 border-b border-[0.5px] border-pf-border mb-6">
      <!-- Row 1: search + view toggle -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-pf-muted text-sm pointer-events-none">
            ⌕
          </span>
          <input
            type="text"
            [value]="searchValue"
            (input)="onSearchInput($event)"
            placeholder="Search recipes…"
            class="w-full pl-8 pr-3 py-2 rounded-[8px] border border-[0.5px] border-pf-border
                   bg-pf-surface text-sm text-pf-text placeholder:text-pf-muted
                   focus:outline-none focus:border-pf-subtle transition-colors"
          />
        </div>

        <!-- View toggle -->
        <div class="flex rounded-[8px] border border-[0.5px] border-pf-border overflow-hidden shrink-0">
          <button
            (click)="setView('gallery')"
            [class]="viewMode() === 'gallery' ? activeViewBtn : inactiveViewBtn"
            title="Gallery view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="5" height="5" rx="1"/>
              <rect x="8" y="1" width="5" height="5" rx="1"/>
              <rect x="1" y="8" width="5" height="5" rx="1"/>
              <rect x="8" y="8" width="5" height="5" rx="1"/>
            </svg>
          </button>
          <button
            (click)="setView('pro')"
            [class]="viewMode() === 'pro' ? activeViewBtn : inactiveViewBtn"
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="2" width="12" height="2" rx="1"/>
              <rect x="1" y="6" width="12" height="2" rx="1"/>
              <rect x="1" y="10" width="12" height="2" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Row 2: filter chips -->
      <div class="flex flex-wrap gap-1.5 items-center">
        @for (cat of categories; track cat.label) {
          <button
            (click)="setCategory(cat.value)"
            [class]="filters().category === cat.value ? activeChip : inactiveChip"
          >
            {{ cat.label }}
          </button>
        }

        <div class="w-px h-4 bg-pf-border mx-0.5"></div>

        <button
          (click)="toggleSeason()"
          [class]="filters().season ? seasonActiveChip : inactiveChip"
        >
          In season 🌱
        </button>

        <button
          (click)="toggleFavourites()"
          [class]="filters().favouritesOnly ? favActiveChip : inactiveChip"
        >
          Favourites ♥
        </button>
      </div>
    </div>
  `,
})
export class CookbookFiltersComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private searchSubject = new Subject<string>();

  filters = this.store.selectSignal(selectFilters);
  viewMode = this.store.selectSignal(selectViewMode);

  searchValue = '';

  readonly categories: CategoryOption[] = [
    { value: null, label: 'All' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
    { value: 'dessert', label: 'Dessert' },
  ];

  // Chip style constants
  readonly inactiveChip =
    'px-3 py-1.5 rounded-[20px] text-xs border border-[0.5px] border-pf-border ' +
    'bg-pf-surface text-pf-subtle hover:text-pf-text hover:border-pf-subtle ' +
    'transition-colors cursor-pointer';

  readonly activeChip =
    'px-3 py-1.5 rounded-[20px] text-xs border border-[0.5px] ' +
    'bg-[#1a1a1a] text-white border-[#1a1a1a] ' +
    'dark:bg-[#f0f0ee] dark:text-[#1a1a1a] dark:border-[#f0f0ee] ' +
    'transition-colors cursor-pointer';

  readonly seasonActiveChip =
    'px-3 py-1.5 rounded-[20px] text-xs border border-[0.5px] ' +
    'bg-[#E1F5EE] text-[#0F6E56] border-[#0F6E56]/20 ' +
    'transition-colors cursor-pointer';

  readonly favActiveChip =
    'px-3 py-1.5 rounded-[20px] text-xs border border-[0.5px] ' +
    'bg-[#FBEAF0] text-[#993556] border-[#993556]/20 ' +
    'transition-colors cursor-pointer';

  readonly activeViewBtn =
    'px-2.5 py-2 bg-pf-text text-pf-bg transition-colors cursor-pointer';

  readonly inactiveViewBtn =
    'px-2.5 py-2 bg-pf-surface text-pf-subtle hover:text-pf-text transition-colors cursor-pointer';

  ngOnInit() {
    this.searchValue = this.filters().search;

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.store.dispatch(CookbookActions.setFilter({ filter: { search: value } }));
      });
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  setCategory(value: Category | null) {
    this.store.dispatch(CookbookActions.setFilter({ filter: { category: value } }));
  }

  toggleSeason() {
    const current = this.filters().season;
    this.store.dispatch(
      CookbookActions.setFilter({
        filter: { season: current ? null : getCurrentSeason() },
      }),
    );
  }

  toggleFavourites() {
    this.store.dispatch(
      CookbookActions.setFilter({
        filter: { favouritesOnly: !this.filters().favouritesOnly },
      }),
    );
  }

  setView(viewMode: 'gallery' | 'pro') {
    this.store.dispatch(CookbookActions.setViewMode({ viewMode }));
  }
}
