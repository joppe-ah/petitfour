import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PlannerActions } from '../../store/planner.actions';
import {
  selectCurrentWeekPlans,
  selectWeekProgress,
  selectSelectedWeek,
  selectSuggestedRecipes,
  selectSuggestionRules,
  selectShoppingList,
  selectSelectedDay,
  selectSelectedDayPlan,
  selectMealPlans,
} from '../../store/planner.selectors';
import { MOCK_RECIPES } from '../../../cookbook/data/mock-recipes';
import { Recipe } from '../../../cookbook/models/recipe.model';
import { MealPlan } from '../../models/meal-plan.model';
import { SuggestionRules } from '../../models/suggestion-rules.model';
import { getWeekDates, toDateKey } from '../../store/planner.state';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-weekly-overview',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="px-4 pt-4">
      <!-- Week navigator -->
      <div class="flex items-center justify-between mb-4">
        <button
          (click)="prevWeek()"
          class="w-8 h-8 flex items-center justify-center rounded-full border border-[0.5px] border-pf-border text-pf-subtle hover:text-pf-text hover:bg-pf-surface transition-colors"
        >‹</button>
        <span class="text-xs font-[500] text-pf-text">{{ weekLabel() }}</span>
        <button
          (click)="nextWeek()"
          class="w-8 h-8 flex items-center justify-center rounded-full border border-[0.5px] border-pf-border text-pf-subtle hover:text-pf-text hover:bg-pf-surface transition-colors"
        >›</button>
      </div>

      <!-- 7-day grid -->
      <div class="grid grid-cols-7 gap-1 mb-4">
        @for (date of weekDates(); track date.toISOString(); let i = $index) {
          @let dateKey = toDateKey(date);
          @let isToday = dateKey === todayKey;
          @let plan = planMap().get(dateKey);
          @let recipe = getRecipe(plan?.dinnerRecipeId);
          <div class="flex flex-col items-center gap-1">
            <!-- Day header -->
            <span
              class="text-[10px] font-[500]"
              [class]="isToday ? 'text-[#1D9E75]' : 'text-pf-muted'"
            >
              {{ dayNames[i] }}
            </span>
            <!-- Slot card -->
            <div
              class="w-full h-14 rounded-[8px] border border-[0.5px] flex flex-col items-center justify-center cursor-pointer transition-all text-center px-0.5"
              [class]="slotClass(dateKey, !!recipe, isToday)"
              (click)="onSlotClick(dateKey, !!recipe)"
            >
              @if (recipe) {
                <span class="text-base leading-none">{{ recipeEmoji(recipe) }}</span>
                <span class="text-[9px] leading-tight mt-0.5 font-[450] text-[#0F6E56]">
                  {{ recipe.name.slice(0, 9) }}
                </span>
              } @else {
                <span class="text-pf-muted text-xs">+</span>
              }
            </div>
          </div>
        }
      </div>

      <!-- Week summary bar -->
      <div class="flex items-center justify-between mb-6 py-2 border-y border-[0.5px] border-pf-border">
        <span class="text-xs text-pf-subtle">{{ weekProgress() }} of 7 dinners planned</span>
        <button
          (click)="generateList()"
          [disabled]="weekProgress() === 0"
          class="px-3 py-1.5 bg-[#1D9E75] text-white text-xs rounded-[8px] font-[450] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate list
        </button>
      </div>

      <!-- Suggestions section -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-[500] text-pf-text">Suggestions for you</p>
          <button
            (click)="openSuggestionRules()"
            class="text-pf-muted hover:text-pf-subtle text-base leading-none"
          >⚙</button>
        </div>
        @for (recipeId of suggestedRecipes(); track recipeId) {
          @let rec = getRecipe(recipeId);
          @if (rec) {
            <div class="flex items-center gap-3 py-2.5 border-b border-[0.5px] border-pf-border last:border-0">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-pf-surface border border-[0.5px] border-pf-border">
                {{ recipeEmoji(rec) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-pf-text">{{ rec.name }}</p>
                <p class="text-[9px] text-pf-muted italic">{{ suggestionReason(rec) }}</p>
              </div>
              <button
                (click)="addSuggestion(recipeId)"
                class="text-xs text-[#1D9E75] border border-[0.5px] border-[#9FE1CB] px-2 py-1 rounded-[6px] hover:bg-[#E1F5EE] dark:hover:bg-[#1D9E7522] flex-shrink-0"
              >
                + Add
              </button>
            </div>
          }
        }
        @if (suggestedRecipes().length === 0) {
          <p class="text-xs text-pf-muted italic">No suggestions yet. Tap ⚙ to configure.</p>
        }
      </div>

      <!-- Day detail panel (shown when selectedDay is set) -->
      @if (selectedDay()) {
        <div class="mt-6 bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-[500] text-pf-text">{{ selectedDayLabel() }}</p>
            <button
              (click)="closeDay()"
              class="text-xs text-pf-subtle hover:text-pf-text"
            >✕</button>
          </div>

          @let dayPlan = selectedDayPlan();
          @let dayRecipe = getRecipe(dayPlan?.dinnerRecipeId);

          @if (dayRecipe) {
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-[10px] bg-[#E1F5EE] dark:bg-[#1D9E7522] flex items-center justify-center text-2xl">
                {{ recipeEmoji(dayRecipe) }}
              </div>
              <div>
                <p class="text-sm font-[450] text-pf-text">{{ dayRecipe.name }}</p>
                <p class="text-xs text-pf-subtle">{{ dayRecipe.cookingTime }} min · {{ dayRecipe.servings }} servings</p>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <a
                [routerLink]="['/cookbook', dayRecipe.id]"
                class="px-3 py-1.5 text-xs border border-[0.5px] border-pf-border rounded-[8px] text-pf-subtle hover:text-pf-text"
              >View recipe</a>
              <button
                (click)="openPickerForDay(selectedDay()!)"
                class="px-3 py-1.5 text-xs border border-[0.5px] border-pf-border rounded-[8px] text-pf-subtle hover:text-pf-text"
              >Change</button>
              <button
                (click)="removeFromDay(selectedDay()!)"
                class="px-3 py-1.5 text-xs text-[#A32D2D] border border-[0.5px] border-[#A32D2D]/30 rounded-[8px]"
              >Remove</button>
            </div>
          } @else {
            <button
              (click)="openPickerForDay(selectedDay()!)"
              class="w-full py-4 border border-dashed border-[#9FE1CB] rounded-[10px] text-sm text-[#1D9E75] hover:bg-[#E1F5EE] dark:hover:bg-[#1D9E7522] transition-colors"
            >
              + Pick a recipe
            </button>
          }

          <!-- This-week mini list -->
          <div class="mt-4 pt-4 border-t border-[0.5px] border-pf-border">
            <p class="text-xs text-pf-subtle mb-2">This week</p>
            @for (d of weekDates(); track d.toISOString(); let wi = $index) {
              @let dk = toDateKey(d);
              @let wp = planMap().get(dk);
              @let wr = getRecipe(wp?.dinnerRecipeId);
              <div
                class="flex items-center gap-2 py-1 cursor-pointer"
                (click)="selectDay(dk)"
                [class]="dk === selectedDay() ? 'opacity-100' : 'opacity-70 hover:opacity-100'"
              >
                <span class="text-[10px] w-6 text-pf-muted">{{ dayNames[wi] }}</span>
                <span class="text-xs" [class]="wr ? 'text-pf-text' : 'text-pf-muted italic'">
                  {{ wr ? wr.name : 'empty' }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Recipe picker modal -->
    @if (showRecipePicker()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
        (click)="showRecipePicker.set(false)"
      >
        <div
          class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-4 w-full sm:max-w-lg sm:mx-4 max-h-[80vh] flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-[500] text-pf-text">Choose a recipe</p>
            <button (click)="showRecipePicker.set(false)" class="text-pf-muted text-lg">✕</button>
          </div>
          <!-- Search -->
          <input
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search recipes…"
            class="w-full px-3 py-2 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm focus:outline-none mb-3"
          />
          <!-- Filter chips -->
          <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
            @for (f of pickerFilters; track f.id) {
              <button
                (click)="pickerFilter.set(f.id)"
                class="px-2.5 py-1 rounded-full text-xs flex-shrink-0 border border-[0.5px] transition-colors"
                [class]="pickerFilter() === f.id
                  ? 'bg-[#1a1a1a] text-white border-transparent dark:bg-[#f0f0ee] dark:text-[#1a1a1a]'
                  : 'border-pf-border text-pf-subtle'"
              >
                {{ f.label }}
              </button>
            }
          </div>
          <!-- Recipe list -->
          <div class="overflow-y-auto flex-1">
            @for (recipe of filteredPickerRecipes(); track recipe.id) {
              <div
                class="flex items-center gap-3 py-2.5 border-b border-[0.5px] border-pf-border last:border-0 cursor-pointer hover:bg-pf-bg rounded-[8px] px-2 transition-colors"
                (click)="pickRecipe(recipe.id)"
              >
                <span class="text-xl flex-shrink-0">{{ recipeEmoji(recipe) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-pf-text truncate">{{ recipe.name }}</p>
                  <p class="text-xs text-pf-muted">{{ recipe.cookingTime }} min · {{ recipe.category }}</p>
                </div>
                <span class="text-sm" [class]="recipe.isFavourite ? 'text-[#D4537E]' : 'text-pf-muted'">♥</span>
              </div>
            }
            @if (filteredPickerRecipes().length === 0) {
              <p class="text-xs text-pf-muted text-center py-6 italic">No recipes match your filter.</p>
            }
          </div>
        </div>
      </div>
    }

    <!-- Suggestion rules modal -->
    @if (showSuggestionRules()) {
      <div
        class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
        (click)="showSuggestionRules.set(false)"
      >
        <div
          class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-6 w-full sm:max-w-sm sm:mx-4 max-h-[85vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h3 class="text-sm font-[500] text-pf-text mb-5">Suggestion settings</h3>

          <!-- Use favourites -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm text-pf-text">Prioritise favourites</p>
              <p class="text-xs text-pf-muted">Show family favourites first</p>
            </div>
            <button
              (click)="rulesFavourites.set(!rulesFavourites())"
              class="w-10 h-6 rounded-full transition-colors relative flex-shrink-0"
              [class]="rulesFavourites() ? 'bg-[#1D9E75]' : 'bg-pf-border'"
            >
              <span
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class]="rulesFavourites() ? 'translate-x-4' : 'translate-x-0.5'"
              ></span>
            </button>
          </div>

          <!-- Seasonal -->
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm text-pf-text">Seasonal recipes</p>
              <p class="text-xs text-pf-muted">Prefer ingredients in season</p>
            </div>
            <button
              (click)="rulesUseSeasonal.set(!rulesUseSeasonal())"
              class="w-10 h-6 rounded-full transition-colors relative flex-shrink-0"
              [class]="rulesUseSeasonal() ? 'bg-[#1D9E75]' : 'bg-pf-border'"
            >
              <span
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class]="rulesUseSeasonal() ? 'translate-x-4' : 'translate-x-0.5'"
              ></span>
            </button>
          </div>

          <!-- Not cooked recently -->
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-sm text-pf-text">Avoid recent meals</p>
              <p class="text-xs text-pf-muted">Skip recently cooked recipes</p>
            </div>
            <button
              (click)="rulesUseRecent.set(!rulesUseRecent())"
              class="w-10 h-6 rounded-full transition-colors relative flex-shrink-0"
              [class]="rulesUseRecent() ? 'bg-[#1D9E75]' : 'bg-pf-border'"
            >
              <span
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                [class]="rulesUseRecent() ? 'translate-x-4' : 'translate-x-0.5'"
              ></span>
            </button>
          </div>
          @if (rulesUseRecent()) {
            <div class="flex items-center gap-2 mb-4 pl-1">
              <span class="text-xs text-pf-muted">Within</span>
              <input
                type="number"
                [ngModel]="rulesRecentDays()"
                (ngModelChange)="rulesRecentDays.set($event)"
                min="1"
                max="60"
                class="w-16 px-2 py-1 bg-pf-bg border border-[0.5px] border-pf-border rounded-[6px] text-sm focus:outline-none text-center"
              />
              <span class="text-xs text-pf-muted">days</span>
            </div>
          }

          <!-- Max cooking time -->
          <div class="mb-4">
            <p class="text-sm text-pf-text mb-1">Max cooking time</p>
            <div class="flex gap-2 flex-wrap">
              @for (t of cookingTimeOptions; track t.value) {
                <button
                  (click)="rulesMaxTime.set(t.value)"
                  class="px-2.5 py-1 rounded-full text-xs border border-[0.5px] transition-colors"
                  [class]="rulesMaxTime() === t.value
                    ? 'bg-[#1D9E75] text-white border-transparent'
                    : 'border-pf-border text-pf-subtle'"
                >
                  {{ t.label }}
                </button>
              }
            </div>
          </div>

          <button
            (click)="saveRules()"
            class="w-full mt-5 py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px] hover:bg-[#178a65] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    }
  `,
})
export class WeeklyOverviewComponent implements OnInit {
  protected store = inject(Store);
  private toast = inject(ToastService);

  // Store selectors
  currentWeekPlans = this.store.selectSignal(selectCurrentWeekPlans);
  weekProgress = this.store.selectSignal(selectWeekProgress);
  selectedWeek = this.store.selectSignal(selectSelectedWeek);
  suggestedRecipes = this.store.selectSignal(selectSuggestedRecipes);
  currentRules = this.store.selectSignal(selectSuggestionRules);
  selectedDay = this.store.selectSignal(selectSelectedDay);
  selectedDayPlan = this.store.selectSignal(selectSelectedDayPlan);
  allMealPlans = this.store.selectSignal(selectMealPlans);

  // UI state signals
  showRecipePicker = signal(false);
  pickerDateKey = signal<string | null>(null);
  showSuggestionRules = signal(false);
  searchQuery = signal('');
  pickerFilter = signal<'all' | 'favourites' | 'seasonal' | 'quick'>('all');

  // Local rule signals for the modal
  rulesUseSeasonal = signal(true);
  rulesUseRecent = signal(true);
  rulesRecentDays = signal(14);
  rulesFavourites = signal(true);
  rulesMaxTime = signal<number | null>(null);

  // Constants
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  todayKey = toDateKey(new Date());
  pickerFilters: { id: 'all' | 'favourites' | 'seasonal' | 'quick'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'favourites', label: 'Favourites' },
    { id: 'seasonal', label: 'In season' },
    { id: 'quick', label: 'Quick' },
  ];
  cookingTimeOptions: { value: number | null; label: string }[] = [
    { value: null, label: 'Any' },
    { value: 20, label: '≤20 min' },
    { value: 30, label: '≤30 min' },
    { value: 45, label: '≤45 min' },
  ];

  // Helper to expose toDateKey in template
  toDateKey = toDateKey;

  // Computed
  weekDates = computed(() => getWeekDates(this.selectedWeek().weekNumber, this.selectedWeek().year));

  weekLabel = computed(() => {
    const { weekNumber, year } = this.selectedWeek();
    const dates = getWeekDates(weekNumber, year);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dates[0].getUTCMonth()];
    return `Week ${weekNumber} — ${month} ${year}`;
  });

  planMap = computed(() => {
    const map = new Map<string, MealPlan>();
    for (const plan of this.currentWeekPlans()) {
      map.set(toDateKey(plan.date), plan);
    }
    return map;
  });

  filteredPickerRecipes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.pickerFilter();
    const month = new Date().getMonth() + 1;
    let currentSeason: string;
    if (month >= 3 && month <= 5) currentSeason = 'spring';
    else if (month >= 6 && month <= 8) currentSeason = 'summer';
    else if (month >= 9 && month <= 11) currentSeason = 'autumn';
    else currentSeason = 'winter';

    return MOCK_RECIPES.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.tags.some(t => t.toLowerCase().includes(q))) {
        return false;
      }
      if (filter === 'favourites' && !r.isFavourite) return false;
      if (filter === 'seasonal' && r.season !== currentSeason && r.season !== 'all') return false;
      if (filter === 'quick' && r.cookingTime > 25) return false;
      return true;
    });
  });

  selectedDayLabel = computed(() => {
    const dk = this.selectedDay();
    if (!dk) return '';
    const date = new Date(dk + 'T00:00:00Z');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${dayNames[date.getUTCDay()]} ${date.getUTCDate()} ${monthNames[date.getUTCMonth()]}`;
  });

  ngOnInit(): void {
    this.store.dispatch(PlannerActions.loadSuggestions());
  }

  getRecipe(id: string | null | undefined): Recipe | undefined {
    if (!id) return undefined;
    return MOCK_RECIPES.find(r => r.id === id);
  }

  recipeEmoji(recipe: Recipe): string {
    switch (recipe.category) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🍪';
      case 'dessert': return '🍰';
      default: return '🍴';
    }
  }

  slotClass(dateKey: string, filled: boolean, isToday: boolean): string {
    if (filled) {
      return 'bg-[#E1F5EE] dark:bg-[#1D9E7522] border-[#9FE1CB]';
    }
    if (isToday) {
      return 'bg-pf-surface border-[#1D9E75] hover:border-dashed';
    }
    return 'bg-pf-surface border-pf-border hover:border-dashed hover:border-[#9FE1CB]';
  }

  onSlotClick(dateKey: string, filled: boolean): void {
    if (filled) {
      this.store.dispatch(PlannerActions.setSelectedDay({ dateKey }));
    } else {
      this.openPickerForDay(dateKey);
    }
  }

  openPickerForDay(dateKey: string): void {
    this.pickerDateKey.set(dateKey);
    this.searchQuery.set('');
    this.pickerFilter.set('all');
    this.showRecipePicker.set(true);
  }

  pickRecipe(recipeId: string): void {
    const dateKey = this.pickerDateKey();
    if (!dateKey) return;
    const { weekNumber, year } = this.selectedWeek();
    this.store.dispatch(PlannerActions.assignRecipeToDay({ dateKey, recipeId, weekNumber, year }));
    this.showRecipePicker.set(false);
    this.store.dispatch(PlannerActions.setSelectedDay({ dateKey }));
    const recipe = this.getRecipe(recipeId);
    this.toast.show(`${recipe?.name ?? 'Recipe'} added to plan`, 'success');
  }

  removeFromDay(dateKey: string): void {
    this.store.dispatch(PlannerActions.removeRecipeFromDay({ dateKey }));
    this.toast.show('Recipe removed', 'info');
  }

  selectDay(dateKey: string): void {
    this.store.dispatch(PlannerActions.setSelectedDay({ dateKey }));
  }

  closeDay(): void {
    this.store.dispatch(PlannerActions.setSelectedDay({ dateKey: null }));
  }

  prevWeek(): void {
    const { weekNumber, year } = this.selectedWeek();
    let newWeek = weekNumber - 1;
    let newYear = year;
    if (newWeek < 1) {
      newYear = year - 1;
      newWeek = 52;
    }
    this.store.dispatch(PlannerActions.setSelectedWeek({ weekNumber: newWeek, year: newYear }));
  }

  nextWeek(): void {
    const { weekNumber, year } = this.selectedWeek();
    let newWeek = weekNumber + 1;
    let newYear = year;
    if (newWeek > 52) {
      newWeek = 1;
      newYear = year + 1;
    }
    this.store.dispatch(PlannerActions.setSelectedWeek({ weekNumber: newWeek, year: newYear }));
  }

  generateList(): void {
    this.store.dispatch(PlannerActions.generateShoppingList());
    this.toast.show('Shopping list generated!', 'success');
  }

  addSuggestion(recipeId: string): void {
    const dates = this.weekDates();
    const map = this.planMap();
    // Find first empty day in the current week
    const emptyDay = dates.find(d => {
      const dk = toDateKey(d);
      const plan = map.get(dk);
      return !plan || plan.dinnerRecipeId === null;
    });

    if (!emptyDay) {
      this.toast.show('All days are planned!', 'info');
      return;
    }

    const dateKey = toDateKey(emptyDay);
    const { weekNumber, year } = this.selectedWeek();
    this.store.dispatch(PlannerActions.assignRecipeToDay({ dateKey, recipeId, weekNumber, year }));
    const recipe = this.getRecipe(recipeId);
    this.toast.show(`${recipe?.name ?? 'Recipe'} added to ${dateKey}`, 'success');
  }

  suggestionReason(recipe: Recipe): string {
    const reasons: string[] = [];
    const month = new Date().getMonth() + 1;
    let currentSeason: string;
    if (month >= 3 && month <= 5) currentSeason = 'spring';
    else if (month >= 6 && month <= 8) currentSeason = 'summer';
    else if (month >= 9 && month <= 11) currentSeason = 'autumn';
    else currentSeason = 'winter';

    if (recipe.isFavourite) reasons.push('family favourite');
    if (recipe.season === currentSeason || recipe.season === 'all') reasons.push('spring seasonal');
    if (recipe.cookingTime < 20) reasons.push(`quick — ${recipe.cookingTime}min`);

    const rules = this.currentRules();
    if (rules.useNotCookedRecently) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - rules.notCookedRecentlyDays);
      const recentlyCooked = this.allMealPlans().some(p => {
        if (p.dinnerRecipeId !== recipe.id) return false;
        return new Date(p.date) >= cutoff;
      });
      if (!recentlyCooked) reasons.push('not recently cooked');
    }

    return reasons.length > 0 ? reasons.join(' · ') : 'suggested for you';
  }

  openSuggestionRules(): void {
    // Initialize form from current store rules
    const rules = this.currentRules();
    this.rulesUseSeasonal.set(rules.useSeasonal);
    this.rulesUseRecent.set(rules.useNotCookedRecently);
    this.rulesRecentDays.set(rules.notCookedRecentlyDays);
    this.rulesFavourites.set(rules.useFavourites);
    this.rulesMaxTime.set(rules.maxCookingTime);
    this.showSuggestionRules.set(true);
  }

  saveRules(): void {
    const rules: SuggestionRules = {
      useSeasonal: this.rulesUseSeasonal(),
      useNotCookedRecently: this.rulesUseRecent(),
      notCookedRecentlyDays: this.rulesRecentDays(),
      useFavourites: this.rulesFavourites(),
      maxCookingTime: this.rulesMaxTime(),
      excludeCategories: [],
    };
    this.store.dispatch(PlannerActions.updateSuggestionRules({ rules }));
    this.store.dispatch(PlannerActions.loadSuggestions());
    this.showSuggestionRules.set(false);
    this.toast.show('Suggestions updated', 'success');
  }
}
