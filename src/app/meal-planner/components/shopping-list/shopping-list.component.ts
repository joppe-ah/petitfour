import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PlannerActions } from '../../store/planner.actions';
import {
  selectShoppingList,
  selectShoppingListByCategory,
  selectWeekProgress,
} from '../../store/planner.selectors';
import { MOCK_RECIPES } from '../../../cookbook/data/mock-recipes';
import { ShoppingCategory } from '../../models/shopping-list.model';

const CATEGORY_LABELS: Record<ShoppingCategory, string> = {
  vegetables: 'Vegetables',
  fruit: 'Fruit',
  meat: 'Meat',
  fish: 'Fish',
  dairy: 'Dairy',
  pasta: 'Pasta & Grains',
  bakery: 'Bakery',
  canned: 'Canned & Jarred',
  condiments: 'Condiments & Spices',
  other: 'Other',
};

const CATEGORY_ORDER: ShoppingCategory[] = [
  'vegetables', 'fruit', 'meat', 'fish', 'dairy',
  'pasta', 'bakery', 'canned', 'condiments', 'other',
];

@Component({
  selector: 'app-shopping-list',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="bg-pf-bg min-h-full pb-24">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[0.5px] border-pf-border">
        <div class="flex items-center gap-3">
          <a routerLink="/planner" class="text-pf-subtle hover:text-pf-text text-lg leading-none">←</a>
          <div>
            <h1 class="text-base text-pf-text font-[500]">Shopping list</h1>
            @if (shoppingList()) {
              <p class="text-xs text-pf-subtle mt-0.5">
                {{ checkedCount() }} of {{ totalCount() }} checked
              </p>
            }
          </div>
        </div>
        @if (hasChecked()) {
          <button
            (click)="clearChecked()"
            class="text-xs text-pf-subtle hover:text-[#D85A30] transition-colors"
          >
            Clear checked
          </button>
        }
      </div>

      @if (shoppingList(); as list) {
        <!-- Progress card -->
        <div class="mx-6 mt-4 mb-4 bg-[#E1F5EE] dark:bg-[#1D9E7522] rounded-[12px] p-4">
          <p class="text-sm font-[500] text-[#0F6E56]">
            {{ checkedCount() }} of {{ totalCount() }} items checked
          </p>
          <p class="text-xs text-[#0F6E56] opacity-70 mt-0.5">
            Generated from {{ plannedCount() }} meals · week {{ list.weekNumber }}
          </p>
        </div>

        <!-- Items by category -->
        @for (category of orderedCategories(); track category) {
          @let items = groupedItems()[category];
          @if (items && items.length > 0) {
            <div class="px-6 mb-4">
              <p class="text-[10px] font-[500] text-pf-muted uppercase tracking-wider mb-2">
                {{ categoryLabel(category) }}
              </p>
              @for (item of items; track item.id) {
                <div
                  class="flex items-start gap-3 py-3 border-b border-[0.5px] border-pf-border last:border-0 cursor-pointer"
                  (click)="toggleItem(item.id)"
                >
                  <!-- Checkbox -->
                  <div
                    class="w-5 h-5 rounded-[4px] border border-[0.5px] flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                    [class]="item.isChecked
                      ? 'bg-[#1D9E75] border-[#1D9E75]'
                      : 'border-pf-border bg-pf-surface'"
                  >
                    @if (item.isChecked) {
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    }
                  </div>
                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-sm transition-colors"
                      [class]="item.isChecked ? 'line-through text-[#b4b2a9]' : 'text-pf-text'"
                    >
                      {{ item.name }}
                    </p>
                    @if (!item.isManual && item.recipeIds.length > 0) {
                      <p class="text-[10px] text-pf-muted mt-0.5">
                        from {{ recipeNames(item.recipeIds) }}
                      </p>
                    }
                    @if (item.isManual) {
                      <p class="text-[10px] text-pf-muted mt-0.5 italic">added manually</p>
                    }
                  </div>
                  <!-- Amount -->
                  <span
                    class="text-sm flex-shrink-0 transition-colors"
                    [class]="item.isChecked ? 'text-[#b4b2a9]' : 'text-pf-subtle'"
                  >
                    {{ item.amount }} {{ item.unit }}
                  </span>
                  <!-- Remove manual items -->
                  @if (item.isManual) {
                    <button
                      (click)="$event.stopPropagation(); removeItem(item.id)"
                      class="text-pf-muted hover:text-[#D85A30] text-xs flex-shrink-0 ml-1 mt-0.5"
                    >✕</button>
                  }
                </div>
              }
            </div>
          }
        }

        <!-- Add item manually -->
        <div class="px-6 mt-2">
          @if (!showAddForm()) {
            <button
              (click)="showAddForm.set(true)"
              class="w-full py-3 border border-dashed border-pf-border rounded-[10px] text-xs text-pf-muted hover:text-pf-subtle hover:border-pf-subtle transition-colors"
            >
              + Add item manually
            </button>
          } @else {
            <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
              <p class="text-xs font-[500] text-pf-text mb-3">Add item</p>
              <input
                [(ngModel)]="newItemName"
                placeholder="Item name"
                class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm focus:outline-none mb-2"
              />
              <div class="flex gap-2 mb-3">
                <input
                  [(ngModel)]="newItemAmount"
                  type="number"
                  placeholder="Amount"
                  class="flex-1 px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm focus:outline-none"
                />
                <input
                  [(ngModel)]="newItemUnit"
                  placeholder="Unit (g, ml…)"
                  class="flex-1 px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm focus:outline-none"
                />
              </div>
              <div class="flex gap-2">
                <button
                  (click)="addItem()"
                  [disabled]="!newItemName.trim()"
                  class="flex-1 py-2 bg-[#1D9E75] text-white text-sm rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  (click)="cancelAdd()"
                  class="flex-1 py-2 border border-[0.5px] border-pf-border text-sm text-pf-subtle rounded-[8px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          }
        </div>

      } @else {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span class="text-4xl mb-4">🛒</span>
          <p class="text-sm font-[500] text-pf-text mb-2">No shopping list yet</p>
          <p class="text-xs text-pf-muted mb-6">
            Plan your week first, then generate your list
          </p>
          <a
            routerLink="/planner"
            class="px-4 py-2 text-xs text-[#1D9E75] border border-[0.5px] border-[#9FE1CB] rounded-[8px] hover:bg-[#E1F5EE] dark:hover:bg-[#1D9E7522] transition-colors"
          >
            Back to planner
          </a>
        </div>
      }
    </div>
  `,
})
export class ShoppingListComponent implements OnInit {
  private store = inject(Store);

  shoppingList = this.store.selectSignal(selectShoppingList);
  groupedItems = this.store.selectSignal(selectShoppingListByCategory);
  weekProgress = this.store.selectSignal(selectWeekProgress);

  showAddForm = signal(false);
  newItemName = '';
  newItemAmount = 0;
  newItemUnit = '';

  totalCount = computed(() => this.shoppingList()?.items.length ?? 0);
  checkedCount = computed(() => this.shoppingList()?.items.filter(i => i.isChecked).length ?? 0);
  hasChecked = computed(() => this.checkedCount() > 0);
  plannedCount = computed(() => this.weekProgress());

  orderedCategories = computed(() => {
    const grouped = this.groupedItems();
    return CATEGORY_ORDER.filter(c => grouped[c] && grouped[c].length > 0);
  });

  ngOnInit(): void {
    // If no shopping list, dispatch generateShoppingList when week has plans
    // (user may navigate here directly after generating)
  }

  categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat as ShoppingCategory] ?? cat;
  }

  recipeNames(ids: string[]): string {
    return ids
      .map(id => MOCK_RECIPES.find(r => r.id === id)?.name ?? id)
      .join(', ');
  }

  toggleItem(itemId: string): void {
    this.store.dispatch(PlannerActions.toggleShoppingItem({ itemId }));
  }

  removeItem(itemId: string): void {
    this.store.dispatch(PlannerActions.removeShoppingItem({ itemId }));
  }

  clearChecked(): void {
    this.store.dispatch(PlannerActions.clearCheckedItems());
  }

  addItem(): void {
    const name = this.newItemName.trim();
    if (!name) return;
    this.store.dispatch(
      PlannerActions.addManualShoppingItem({
        item: {
          name,
          amount: this.newItemAmount || 1,
          unit: this.newItemUnit.trim() || 'pcs',
          category: 'other',
          isChecked: false,
        },
      })
    );
    this.cancelAdd();
  }

  cancelAdd(): void {
    this.newItemName = '';
    this.newItemAmount = 0;
    this.newItemUnit = '';
    this.showAddForm.set(false);
  }
}
