import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import jsPDF from 'jspdf';
import { CookbookActions } from '../../store/cookbook.actions';
import { selectAllRecipes, selectSelectedRecipe } from '../../store/cookbook.selectors';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-recipe-detail',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="relative">
      <!-- Back nav + edit button -->
      <div class="no-print flex items-center justify-between px-4 py-3 border-b border-[0.5px] border-pf-border">
        <a
          routerLink="/cookbook"
          class="inline-flex items-center gap-1 text-xs text-pf-subtle hover:text-pf-text transition-colors"
        >
          ← Cookbook
        </a>
        @if (recipe()) {
          <a
            [routerLink]="['/cookbook', recipe()!.id, 'edit']"
            class="text-xs text-pf-subtle hover:text-pf-text transition-colors px-3 py-1.5 rounded-[6px] border border-[0.5px] border-pf-border"
          >
            Edit
          </a>
        }
      </div>

      @if (recipe()) {
        <!-- HERO -->
        <div class="relative h-[240px] overflow-hidden">
          @if (recipe()!.photo) {
            <img [src]="recipe()!.photo" alt="{{ recipe()!.name }}" class="w-full h-full object-cover" />
          } @else {
            <div [class]="heroBg(recipe()!.category)" class="w-full h-full flex items-center justify-center">
              <span class="text-6xl opacity-40">{{ categoryEmoji(recipe()!.category) }}</span>
            </div>
          }
          <!-- Overlay buttons -->
          <div class="absolute top-3 right-3 flex gap-2 no-print">
            <button
              (click)="exportPdf()"
              class="w-8 h-8 bg-white border border-[0.5px] border-gray-200 rounded-[8px] flex items-center justify-center text-xs font-[500] text-gray-700 hover:bg-gray-50"
            >PDF</button>
            <button
              (click)="share()"
              class="w-8 h-8 bg-white border border-[0.5px] border-gray-200 rounded-[8px] flex items-center justify-center text-xs hover:bg-gray-50"
            >⤴</button>
            <button
              (click)="toggleFavourite()"
              class="w-8 h-8 bg-white border border-[0.5px] border-gray-200 rounded-[8px] flex items-center justify-center text-sm hover:bg-gray-50"
              [class]="recipe()!.isFavourite ? 'text-[#D4537E]' : 'text-gray-400'"
            >♥</button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pt-4 pb-24">
          <!-- Title -->
          <h1 class="text-[20px] font-[500] text-pf-text">{{ recipe()!.name }}</h1>

          <!-- Meta chips -->
          <div class="flex flex-wrap gap-2 mt-3">
            <span class="px-2.5 py-1 bg-pf-surface border border-[0.5px] border-pf-border rounded-full text-xs text-pf-subtle">
              ⏱ {{ recipe()!.cookingTime }} min
            </span>
            <span class="px-2.5 py-1 bg-pf-surface border border-[0.5px] border-pf-border rounded-full text-xs text-pf-amber">
              {{ recipe()!.calories }} kcal
            </span>
            <span class="px-2.5 py-1 bg-pf-surface border border-[0.5px] border-pf-border rounded-full text-xs text-pf-subtle capitalize">
              {{ recipe()!.category }}
            </span>
            <span class="px-2.5 py-1 bg-pf-surface border border-[0.5px] border-pf-border rounded-full text-xs text-[#BA7517]">
              {{ starRating(recipe()!.rating) }}
            </span>
          </div>

          <!-- Actions row -->
          <div class="flex gap-2 mt-4 no-print">
            <button
              (click)="showMealPlanModal.set(true)"
              class="px-3 py-2 bg-[#1D9E75] text-white text-xs font-[500] rounded-[8px] hover:bg-[#178a65]"
            >+ Meal plan</button>
            <button
              (click)="nutritionExpanded.set(!nutritionExpanded())"
              class="px-3 py-2 bg-pf-surface border border-[0.5px] border-pf-border text-xs text-pf-subtle rounded-[8px] hover:border-pf-subtle"
            >Nutrition</button>
            <button
              (click)="print()"
              class="px-3 py-2 bg-pf-surface border border-[0.5px] border-pf-border text-xs text-pf-subtle rounded-[8px] hover:border-pf-subtle no-print"
            >Print</button>
          </div>

          <!-- Tabs -->
          <div class="mt-6 border-b border-[0.5px] border-pf-border flex gap-6 no-print">
            @for (tab of tabs; track tab.id) {
              <button
                (click)="activeTab.set(tab.id)"
                class="pb-2 text-sm transition-colors relative"
                [class]="activeTab() === tab.id ? 'text-pf-text font-[500]' : 'text-pf-subtle'"
              >
                {{ tab.label }}
                @if (activeTab() === tab.id) {
                  <span class="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#1a1a1a] dark:bg-[#f0f0ee]"></span>
                }
              </button>
            }
          </div>

          <!-- Tab: Overview -->
          @if (activeTab() === 'overview') {
            <!-- 2x2 stat cards -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 text-center">
                <p class="text-2xl font-[500] text-pf-amber">{{ recipe()!.calories }}</p>
                <p class="text-xs text-pf-subtle mt-1">Calories</p>
              </div>
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 text-center">
                <p class="text-2xl font-[500] text-pf-text">{{ recipe()!.nutrition?.protein ?? '—' }}g</p>
                <p class="text-xs text-pf-subtle mt-1">Protein</p>
              </div>
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 text-center">
                <p class="text-2xl font-[500] text-pf-text">{{ recipe()!.nutrition?.carbs ?? '—' }}g</p>
                <p class="text-xs text-pf-subtle mt-1">Carbs</p>
              </div>
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4 text-center">
                <p class="text-2xl font-[500] text-pf-text">{{ recipe()!.nutrition?.fat ?? '—' }}g</p>
                <p class="text-xs text-pf-subtle mt-1">Fat</p>
              </div>
            </div>

            <!-- Description -->
            <p class="text-sm text-pf-subtle italic mt-4 leading-relaxed">{{ recipe()!.description }}</p>

            <!-- Nutrition expanded (scales with servings adjuster) -->
            @if (nutritionExpanded()) {
              <div class="mt-4 bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4">
                <p class="text-xs font-[500] text-pf-text mb-3">
                  Nutrition per serving
                  @if (servings() !== baseServings()) {
                    <span class="text-pf-muted font-normal"> (scaled to {{ servings() }} servings)</span>
                  }
                </p>
                @for (macro of nutritionMacros(); track macro.label) {
                  <div class="mb-3">
                    <div class="flex justify-between mb-1">
                      <span class="text-xs text-pf-subtle">{{ macro.label }}</span>
                      <span class="text-xs text-pf-text">{{ macro.value }}</span>
                    </div>
                    <div class="h-[6px] rounded-[3px] bg-pf-border overflow-hidden">
                      <div
                        class="h-full rounded-[3px] transition-all"
                        [style.width]="macro.pct + '%'"
                        [style.background-color]="macro.color"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Notes -->
            <div class="mt-6">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-[500] text-pf-text">My notes</p>
                @if (!editingNote()) {
                  <button (click)="startEditNote()" class="text-xs text-pf-subtle hover:text-pf-text">Edit</button>
                }
              </div>
              @if (editingNote()) {
                <textarea
                  [ngModel]="noteText()"
                  (ngModelChange)="noteText.set($event)"
                  class="w-full text-sm text-pf-text bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] p-3 resize-none focus:outline-none focus:border-pf-subtle"
                  rows="3"
                  placeholder="Add a personal note..."
                ></textarea>
                <div class="flex gap-2 mt-2">
                  <button (click)="saveNote()" class="px-3 py-1.5 bg-[#1D9E75] text-white text-xs rounded-[6px]">Save</button>
                  <button (click)="cancelNote()" class="px-3 py-1.5 bg-pf-surface border border-[0.5px] border-pf-border text-xs text-pf-subtle rounded-[6px]">Cancel</button>
                </div>
              } @else {
                <p class="text-sm text-pf-muted italic">{{ recipe()!.notes || 'No notes yet. Tap Edit to add one.' }}</p>
              }
            </div>
          }

          <!-- Tab: Ingredients -->
          @if (activeTab() === 'ingredients') {
            <!-- Servings adjuster -->
            <div class="flex items-center gap-3 mt-4 mb-4">
              <span class="text-sm text-pf-subtle">Servings</span>
              <button
                (click)="adjustServings(-1)"
                class="w-7 h-7 rounded-full border border-[0.5px] border-pf-border flex items-center justify-center text-[#1D9E75] hover:bg-pf-surface text-sm"
              >−</button>
              <span class="text-sm font-[500] text-pf-text w-4 text-center">{{ servings() }}</span>
              <button
                (click)="adjustServings(1)"
                class="w-7 h-7 rounded-full border border-[0.5px] border-pf-border flex items-center justify-center text-[#1D9E75] hover:bg-pf-surface text-sm"
              >+</button>
            </div>

            <!-- Ingredient list -->
            <div class="divide-y divide-pf-border border-y border-[0.5px] border-pf-border">
              @for (ingredient of recipe()!.ingredients; track ingredient.id) {
                <div class="flex items-center justify-between py-2.5">
                  <span class="text-sm text-pf-text">{{ ingredient.name }}</span>
                  <span class="text-sm text-pf-subtle">{{ scaledAmount(ingredient.amount) }} {{ ingredient.unit }}</span>
                </div>
              }
            </div>
          }

          <!-- Tab: Steps -->
          @if (activeTab() === 'steps') {
            <!-- Progress indicator -->
            <div class="flex items-center justify-between mt-4 mb-4">
              <span class="text-xs text-pf-muted">
                Step {{ completedCount() + 1 > recipe()!.steps.length ? recipe()!.steps.length : completedCount() + 1 }} of {{ recipe()!.steps.length }}
              </span>
              <button (click)="resetSteps()" class="text-xs text-pf-subtle hover:text-pf-text">Reset steps</button>
            </div>

            <!-- Steps list -->
            <div class="space-y-3">
              @for (step of recipe()!.steps; track step; let i = $index) {
                <div (click)="toggleStep(i)" class="flex gap-3 cursor-pointer group">
                  <div
                    class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-[500] transition-colors mt-0.5"
                    [class]="isStepDone(i) ? 'bg-pf-border text-pf-muted' : 'bg-[#1D9E75] text-white'"
                  >{{ i + 1 }}</div>
                  <p
                    class="text-sm leading-relaxed pt-0.5 transition-colors"
                    [class]="isStepDone(i) ? 'line-through text-pf-muted' : 'text-pf-text'"
                  >{{ step }}</p>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="p-6">
          <p class="text-sm text-pf-muted">Recipe not found.</p>
          <a routerLink="/cookbook" class="text-xs text-pf-subtle hover:text-pf-text mt-2 inline-block">← Back to Cookbook</a>
        </div>
      }

      <!-- Meal Plan Modal -->
      @if (showMealPlanModal()) {
        <div
          class="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center"
          (click)="showMealPlanModal.set(false)"
        >
          <div
            class="bg-pf-surface rounded-t-[20px] sm:rounded-[16px] p-6 w-full sm:max-w-sm sm:mx-4"
            (click)="$event.stopPropagation()"
          >
            <h3 class="text-sm font-[500] text-pf-text mb-4">Add to meal plan</h3>
            <div class="mb-4">
              <label class="text-xs text-pf-subtle block mb-2">Day</label>
              <div class="flex flex-wrap gap-2">
                @for (day of days; track day) {
                  <button
                    (click)="selectedDay.set(day)"
                    class="px-2.5 py-1 rounded-full text-xs border border-[0.5px] transition-colors"
                    [class]="selectedDay() === day ? 'bg-[#1a1a1a] text-white dark:bg-[#f0f0ee] dark:text-[#1a1a1a] border-transparent' : 'border-pf-border text-pf-subtle hover:border-pf-subtle'"
                  >{{ day }}</button>
                }
              </div>
            </div>
            <div class="mb-6">
              <label class="text-xs text-pf-subtle block mb-2">Meal slot</label>
              <div class="flex gap-2">
                @for (slot of slots; track slot) {
                  <button
                    (click)="selectedSlot.set(slot)"
                    class="px-3 py-1.5 rounded-full text-xs border border-[0.5px] transition-colors"
                    [class]="selectedSlot() === slot ? 'bg-[#1a1a1a] text-white dark:bg-[#f0f0ee] dark:text-[#1a1a1a] border-transparent' : 'border-pf-border text-pf-subtle hover:border-pf-subtle'"
                  >{{ slot }}</button>
                }
              </div>
            </div>
            <button
              (click)="confirmMealPlan()"
              class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]"
            >Add to plan</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class RecipeDetailComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  recipe = this.store.selectSignal(selectSelectedRecipe);
  private allRecipes = this.store.selectSignal(selectAllRecipes);

  // Local state signals
  activeTab = signal<'overview' | 'ingredients' | 'steps'>('overview');
  servings = signal(0);
  baseServings = signal(0);
  completedSteps = signal<Set<number>>(new Set());
  editingNote = signal(false);
  noteText = signal('');
  nutritionExpanded = signal(false);
  showMealPlanModal = signal(false);
  selectedDay = signal('Mon');
  selectedSlot = signal('Dinner');

  tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'ingredients' as const, label: 'Ingredients' },
    { id: 'steps' as const, label: 'Steps' },
  ];

  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  slots = ['Breakfast', 'Lunch', 'Dinner'];

  completedCount = computed(() => this.completedSteps().size);

  // Initialize servings when recipe first loads (handles async + direct URL nav)
  private servingsInit = effect(() => {
    const r = this.recipe();
    if (r && this.servings() === 0) {
      this.servings.set(r.servings);
      this.baseServings.set(r.servings);
    }
  });

  // Nutrition macros scaled to current servings
  nutritionMacros = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    const base = this.baseServings() || r.servings || 1;
    const ratio = this.servings() > 0 ? this.servings() / base : 1;
    const cal = Math.round((r.calories ?? 0) * ratio);
    const n = r.nutrition;
    return [
      { label: 'Calories', value: cal + ' kcal', pct: Math.min((cal / 800) * 100, 100), color: '#BA7517' },
      { label: 'Protein', value: Math.round((n?.protein ?? 0) * ratio) + 'g', pct: Math.min(((n?.protein ?? 0) * ratio / 60) * 100, 100), color: '#1D9E75' },
      { label: 'Carbs', value: Math.round((n?.carbs ?? 0) * ratio) + 'g', pct: Math.min(((n?.carbs ?? 0) * ratio / 130) * 100, 100), color: '#BA7517' },
      { label: 'Fat', value: Math.round((n?.fat ?? 0) * ratio) + 'g', pct: Math.min(((n?.fat ?? 0) * ratio / 70) * 100, 100), color: '#E07B54' },
      ...(n?.sugar != null ? [{ label: 'Sugar', value: Math.round(n.sugar * ratio) + 'g', pct: Math.min((n.sugar * ratio / 50) * 100, 100), color: '#D4537E' }] : []),
      ...(n?.fiber != null ? [{ label: 'Fiber', value: Math.round(n.fiber * ratio) + 'g', pct: Math.min((n.fiber * ratio / 30) * 100, 100), color: '#6B8F71' }] : []),
      ...(n?.saturatedFat != null ? [{ label: 'Sat. fat', value: Math.round(n.saturatedFat * ratio) + 'g', pct: Math.min((n.saturatedFat * ratio / 20) * 100, 100), color: '#C07040' }] : []),
      ...(n?.salt != null ? [{ label: 'Salt', value: (n.salt * ratio).toFixed(1) + 'g', pct: Math.min((n.salt * ratio / 6) * 100, 100), color: '#8888AA' }] : []),
    ];
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Load recipes if store is empty (e.g. direct URL navigation)
      if (this.allRecipes().length === 0) {
        this.store.dispatch(CookbookActions.loadRecipes());
      }
      this.store.dispatch(CookbookActions.selectRecipe({ id }));
    }
  }

  heroBg(category: string): string {
    switch (category) {
      case 'breakfast': return 'bg-[#FBEAF0]';
      case 'lunch': return 'bg-[#E1F5EE]';
      case 'dinner': return 'bg-[#FFF3E0]';
      default: return 'bg-[#EEF0FB]';
    }
  }

  categoryEmoji(category: string): string {
    switch (category) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🍪';
      case 'dessert': return '🍰';
      default: return '🍽️';
    }
  }

  starRating(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  scaledAmount(amount: number): string {
    const base = this.baseServings() || this.recipe()?.servings || 1;
    const scaled = amount * this.servings() / base;
    const str = scaled.toFixed(1);
    return str.endsWith('.0') ? str.slice(0, -2) : str;
  }

  adjustServings(delta: number) {
    const next = Math.min(20, Math.max(1, this.servings() + delta));
    this.servings.set(next);
  }

  toggleStep(i: number) {
    const s = new Set(this.completedSteps());
    s.has(i) ? s.delete(i) : s.add(i);
    this.completedSteps.set(s);
  }

  isStepDone(i: number): boolean {
    return this.completedSteps().has(i);
  }

  resetSteps() {
    this.completedSteps.set(new Set());
  }

  startEditNote() {
    this.editingNote.set(true);
    this.noteText.set(this.recipe()?.notes ?? '');
  }

  saveNote() {
    const r = this.recipe();
    if (r) {
      this.store.dispatch(
        CookbookActions.updateRecipeNote({ id: r.id, note: this.noteText() }),
      );
      console.log('[Cookbook] Note saved (Supabase coming soon):', this.noteText());
    }
    this.editingNote.set(false);
  }

  cancelNote() {
    this.editingNote.set(false);
  }

  toggleFavourite() {
    const r = this.recipe();
    if (r) {
      this.store.dispatch(CookbookActions.toggleFavourite({ id: r.id }));
    }
  }

  exportPdf() {
    const r = this.recipe();
    if (!r) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(r.name, 15, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`${r.cookingTime} min | ${r.servings} servings | ${r.calories} kcal`, 15, y);
    y += 8;
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(r.description, 180);
    doc.text(descLines, 15, y);
    y += descLines.length * 5 + 6;
    doc.setFontSize(13);
    doc.text('Ingredients', 15, y);
    y += 7;
    doc.setFontSize(10);
    r.ingredients.forEach((ing) => {
      doc.text(`• ${ing.name}: ${ing.amount} ${ing.unit}`, 18, y);
      y += 5;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 4;
    doc.setFontSize(13);
    doc.text('Steps', 15, y);
    y += 7;
    doc.setFontSize(10);
    r.steps.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, 178);
      doc.text(lines, 15, y);
      y += lines.length * 5 + 2;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    const filename = r.name.toLowerCase().replace(/\s+/g, '-') + '.pdf';
    doc.save(filename);
  }

  share() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.toastService.show('Link copied!');
    });
  }

  print() {
    window.print();
  }

  confirmMealPlan() {
    const r = this.recipe();
    if (r) {
      this.store.dispatch(
        CookbookActions.addToMealPlan({
          recipeId: r.id,
          day: this.selectedDay(),
          slot: this.selectedSlot(),
        }),
      );
    }
    this.showMealPlanModal.set(false);
    this.toastService.show('Added to meal plan!');
  }
}
