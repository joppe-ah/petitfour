import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CookbookActions } from '../../store/cookbook.actions';
import {
  selectImportedRecipe,
  selectImportSource,
  selectSaving,
  selectSelectedRecipe,
} from '../../store/cookbook.selectors';
import { Category, Season } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-form',
  imports: [ReactiveFormsModule, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div class="min-h-screen bg-pf-bg pb-24">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-pf-bg border-b border-[0.5px] border-pf-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 class="text-sm font-[500] text-pf-text">{{ isEditing() ? 'Edit Recipe' : 'New Recipe' }}</h1>
          @if (importBadge()) {
            <span class="text-xs text-[#1D9E75]">{{ importBadge() }}</span>
          }
        </div>
        <button
          (click)="cancel()"
          class="text-xs text-pf-subtle hover:text-pf-text transition-colors"
        >
          Cancel
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="px-4 pt-6 space-y-8">

        <!-- Photo -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Photo</p>
          @if (photoPreview()) {
            <div class="relative mb-2">
              <img [src]="photoPreview()!" class="w-full h-48 object-cover rounded-[10px]" alt="Recipe photo" />
              <button
                type="button"
                (click)="removePhoto()"
                class="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
              >✕</button>
            </div>
          }
          <label class="block cursor-pointer">
            <div class="border border-[0.5px] border-dashed border-pf-border rounded-[10px] p-6 text-center hover:border-pf-subtle transition-colors">
              <p class="text-2xl mb-1">📷</p>
              <p class="text-xs text-pf-subtle">{{ photoPreview() ? 'Change photo' : 'Add a photo (optional)' }}</p>
            </div>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onPhotoSelected($event)"
            />
          </label>
        </section>

        <!-- Basic Info -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Basic info</p>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Recipe name *</label>
              <input
                formControlName="name"
                type="text"
                placeholder="e.g. Avocado Toast"
                class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none transition-colors"
                [class]="nameInvalid() ? 'border-[#993556]' : 'border-pf-border focus:border-pf-subtle'"
              />
              @if (nameInvalid()) {
                <p class="text-xs text-[#993556] mt-1">Recipe name is required.</p>
              }
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Description</label>
              <textarea
                formControlName="description"
                placeholder="A short description of the recipe…"
                rows="3"
                class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle resize-none"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-pf-subtle block mb-1">Category</label>
                <select
                  formControlName="category"
                  class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none focus:border-pf-subtle"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-pf-subtle block mb-1">Season</label>
                <select
                  formControlName="season"
                  class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text focus:outline-none focus:border-pf-subtle"
                >
                  <option value="">Any season</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="autumn">Autumn</option>
                  <option value="winter">Winter</option>
                  <option value="all">All year</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-xs text-pf-subtle block mb-1">Time (min)</label>
                <input
                  formControlName="cookingTime"
                  type="number"
                  min="1"
                  placeholder="30"
                  class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
                />
              </div>
              <div>
                <label class="text-xs text-pf-subtle block mb-1">Servings</label>
                <input
                  formControlName="servings"
                  type="number"
                  min="1"
                  placeholder="4"
                  class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
                />
              </div>
              <div>
                <label class="text-xs text-pf-subtle block mb-1">Calories</label>
                <input
                  formControlName="calories"
                  type="number"
                  min="0"
                  placeholder="400"
                  class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Rating -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Rating</p>
          <div class="flex gap-1">
            @for (star of [1,2,3,4,5]; track star) {
              <button
                type="button"
                (click)="setRating(star)"
                class="text-2xl transition-colors"
                [class]="star <= rating() ? 'text-[#BA7517]' : 'text-pf-border'"
              >★</button>
            }
          </div>
        </section>

        <!-- Nutrition -->
        <section formGroupName="nutrition">
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Nutrition (per serving)</p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Protein (g)</label>
              <input
                formControlName="protein"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
              />
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Carbs (g)</label>
              <input
                formControlName="carbs"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
              />
            </div>
            <div>
              <label class="text-xs text-pf-subtle block mb-1">Fat (g)</label>
              <input
                formControlName="fat"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
              />
            </div>
          </div>
        </section>

        <!-- Tags -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Tags</p>
          <div class="flex flex-wrap gap-2 mb-2">
            @for (tag of tags(); track tag; let i = $index) {
              <span class="flex items-center gap-1 px-2.5 py-1 bg-pf-surface border border-[0.5px] border-pf-border rounded-full text-xs text-pf-subtle">
                {{ tag }}
                <button type="button" (click)="removeTag(i)" class="text-pf-muted hover:text-pf-text ml-0.5">×</button>
              </span>
            }
          </div>
          <div class="flex gap-2">
            <input
              type="text"
              [value]="tagInput()"
              (input)="tagInput.set($any($event.target).value)"
              (keydown.enter)="addTag(); $event.preventDefault()"
              placeholder="Add tag and press Enter"
              class="flex-1 px-3 py-2 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
            />
            <button
              type="button"
              (click)="addTag()"
              class="px-3 py-2 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] text-xs text-pf-subtle hover:text-pf-text"
            >Add</button>
          </div>
        </section>

        <!-- Ingredients -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Ingredients *</p>
          <div
            cdkDropList
            (cdkDropListDropped)="dropIngredient($event)"
            class="space-y-2"
          >
            @for (group of ingredientsArray.controls; track group; let i = $index) {
              <div
                cdkDrag
                [formGroup]="asFormGroup(group)"
                class="flex items-center gap-2 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] px-2 py-2"
              >
                <button type="button" cdkDragHandle class="text-pf-muted cursor-grab active:cursor-grabbing px-1">⠿</button>
                <input
                  formControlName="name"
                  type="text"
                  placeholder="Ingredient"
                  class="flex-1 min-w-0 bg-transparent text-sm text-pf-text placeholder:text-pf-muted focus:outline-none"
                />
                <input
                  formControlName="amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-16 bg-transparent text-sm text-pf-text placeholder:text-pf-muted focus:outline-none text-right"
                />
                <input
                  formControlName="unit"
                  type="text"
                  placeholder="unit"
                  class="w-14 bg-transparent text-sm text-pf-subtle placeholder:text-pf-muted focus:outline-none"
                />
                <button
                  type="button"
                  (click)="removeIngredient(i)"
                  class="text-pf-muted hover:text-[#993556] transition-colors ml-1 flex-shrink-0"
                >×</button>
              </div>
            }
          </div>
          <button
            type="button"
            (click)="addIngredient()"
            class="mt-2 flex items-center gap-1.5 text-xs text-[#1D9E75] hover:text-[#178a65] transition-colors"
          >
            + Add ingredient
          </button>
          @if (ingredientsInvalid()) {
            <p class="text-xs text-[#993556] mt-1">At least one ingredient is required.</p>
          }
        </section>

        <!-- Steps -->
        <section>
          <p class="text-xs font-[500] text-pf-subtle uppercase tracking-wide mb-3">Steps *</p>
          <div
            cdkDropList
            (cdkDropListDropped)="dropStep($event)"
            class="space-y-2"
          >
            @for (group of stepsArray.controls; track group; let i = $index) {
              <div
                cdkDrag
                [formGroup]="asFormGroup(group)"
                class="flex items-start gap-2 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px] px-2 py-2"
              >
                <button type="button" cdkDragHandle class="text-pf-muted cursor-grab active:cursor-grabbing px-1 mt-1.5">⠿</button>
                <span class="text-xs text-pf-muted font-[500] w-5 text-center mt-2 flex-shrink-0">{{ i + 1 }}</span>
                <textarea
                  formControlName="description"
                  placeholder="Describe this step…"
                  rows="2"
                  class="flex-1 bg-transparent text-sm text-pf-text placeholder:text-pf-muted focus:outline-none resize-none"
                ></textarea>
                <button
                  type="button"
                  (click)="removeStep(i)"
                  class="text-pf-muted hover:text-[#993556] transition-colors flex-shrink-0 mt-1.5"
                >×</button>
              </div>
            }
          </div>
          <button
            type="button"
            (click)="addStep()"
            class="mt-2 flex items-center gap-1.5 text-xs text-[#1D9E75] hover:text-[#178a65] transition-colors"
          >
            + Add step
          </button>
          @if (stepsInvalid()) {
            <p class="text-xs text-[#993556] mt-1">At least one step is required.</p>
          }
        </section>

        <!-- Save button -->
        <div class="fixed bottom-0 left-0 right-0 bg-pf-bg border-t border-[0.5px] border-pf-border px-4 py-4">
          <button
            type="submit"
            [disabled]="isFormInvalid() || saving()"
            class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#178a65] transition-colors"
          >
            @if (saving()) {
              Saving…
            } @else {
              {{ isEditing() ? 'Save changes' : 'Add recipe' }}
            }
          </button>
        </div>

      </form>
    </div>
  `,
})
export class RecipeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  saving = this.store.selectSignal(selectSaving);
  importedRecipe = this.store.selectSignal(selectImportedRecipe);
  importSource = this.store.selectSignal(selectImportSource);

  importBadge = computed(() => {
    const src = this.importSource();
    if (!src) return null;
    if (src === 'photo') return 'Scanned from photo';
    return `Imported from ${src}`;
  });

  isEditing = signal(false);
  editId = signal<string | null>(null);
  rating = signal(0);
  tags = signal<string[]>([]);
  tagInput = signal('');
  photoPreview = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    photo: [''],
    category: ['dinner' as Category],
    season: ['' as Season | ''],
    cookingTime: [30, [Validators.min(1)]],
    servings: [4, [Validators.min(1)]],
    calories: [0, [Validators.min(0)]],
    nutrition: this.fb.group({
      protein: [0],
      carbs: [0],
      fat: [0],
    }),
    ingredients: this.fb.array([]),
    steps: this.fb.array([]),
  });

  get ingredientsArray(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  get stepsArray(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  asFormGroup(control: unknown): FormGroup {
    return control as FormGroup;
  }

  // Validation helpers (checked on submit)
  private submitted = signal(false);

  nameInvalid = computed(() =>
    this.submitted() && !!this.form.get('name')?.invalid
  );

  ingredientsInvalid = computed(() =>
    this.submitted() && this.ingredientsArray.length === 0
  );

  stepsInvalid = computed(() =>
    this.submitted() && this.stepsArray.length === 0
  );

  isFormInvalid = computed(() =>
    this.form.invalid ||
    this.ingredientsArray.length === 0 ||
    this.stepsArray.length === 0
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.editId.set(id);
      this.store.dispatch(CookbookActions.selectRecipe({ id }));

      const recipe = this.store.selectSignal(selectSelectedRecipe)();
      if (recipe) {
        this.form.patchValue({
          name: recipe.name,
          description: recipe.description ?? '',
          photo: recipe.photo ?? '',
          category: recipe.category,
          season: recipe.season ?? '',
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          calories: recipe.calories,
          nutrition: {
            protein: recipe.nutrition?.protein ?? 0,
            carbs: recipe.nutrition?.carbs ?? 0,
            fat: recipe.nutrition?.fat ?? 0,
          },
        });
        if (recipe.photo) this.photoPreview.set(recipe.photo);
        this.rating.set(recipe.rating);
        this.tags.set([...recipe.tags]);
        this.ingredientsArray.clear();
        recipe.ingredients.forEach((ing) => {
          this.ingredientsArray.push(
            this.fb.group({
              id: [ing.id],
              name: [ing.name],
              amount: [ing.amount],
              unit: [ing.unit],
            }),
          );
        });
        this.stepsArray.clear();
        recipe.steps.forEach((step) => {
          this.stepsArray.push(this.fb.group({ description: [step] }));
        });
      }
    }

    // Pre-fill from imported recipe
    const imported = this.importedRecipe();
    if (imported) {
      this.form.patchValue({
        name: imported.name ?? '',
        description: imported.description ?? '',
        category: imported.category ?? 'dinner',
        cookingTime: imported.cookingTime ?? 30,
        servings: imported.servings ?? 4,
        calories: imported.calories ?? 0,
      });
      if (imported.tags) this.tags.set([...imported.tags]);
      if (imported.ingredients) {
        this.ingredientsArray.clear();
        imported.ingredients.forEach((ing) => {
          this.ingredientsArray.push(
            this.fb.group({
              id: [ing.id],
              name: [ing.name],
              amount: [ing.amount],
              unit: [ing.unit],
            }),
          );
        });
      }
      if (imported.steps) {
        this.stepsArray.clear();
        imported.steps.forEach((step) => {
          this.stepsArray.push(this.fb.group({ description: [step] }));
        });
      }
      this.store.dispatch(CookbookActions.clearImport());
    }

    // Add default rows if empty
    if (this.ingredientsArray.length === 0) {
      this.addIngredient();
    }
    if (this.stepsArray.length === 0) {
      this.addStep();
    }
  }

  setRating(star: number) {
    this.rating.set(star);
  }

  addTag() {
    const t = this.tagInput().trim().toLowerCase();
    if (t && !this.tags().includes(t)) {
      this.tags.set([...this.tags(), t]);
    }
    this.tagInput.set('');
  }

  removeTag(index: number) {
    const updated = [...this.tags()];
    updated.splice(index, 1);
    this.tags.set(updated);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.photoPreview.set(dataUrl);
        this.form.patchValue({ photo: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.photoPreview.set(null);
    this.form.patchValue({ photo: '' });
  }

  addIngredient() {
    this.ingredientsArray.push(
      this.fb.group({
        id: [crypto.randomUUID()],
        name: [''],
        amount: [1],
        unit: [''],
      }),
    );
  }

  removeIngredient(index: number) {
    this.ingredientsArray.removeAt(index);
  }

  dropIngredient(event: { previousIndex: number; currentIndex: number }) {
    moveItemInArray(
      this.ingredientsArray.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  addStep() {
    this.stepsArray.push(this.fb.group({ description: [''] }));
  }

  removeStep(index: number) {
    this.stepsArray.removeAt(index);
  }

  dropStep(event: { previousIndex: number; currentIndex: number }) {
    moveItemInArray(
      this.stepsArray.controls,
      event.previousIndex,
      event.currentIndex,
    );
  }

  save() {
    this.submitted.set(true);
    if (this.form.invalid || this.ingredientsArray.length === 0 || this.stepsArray.length === 0) return;

    const v = this.form.value;
    type IngRow = { id?: string; name?: string; amount?: number; unit?: string };
    type StepRow = { description?: string };

    const ingredients = ((v.ingredients ?? []) as IngRow[]).map((ing) => ({
      id: ing.id ?? crypto.randomUUID(),
      name: ing.name ?? '',
      amount: Number(ing.amount ?? 0),
      unit: ing.unit ?? '',
    }));
    const steps = ((v.steps ?? []) as StepRow[])
      .map((s) => s.description ?? '')
      .filter((s) => s.trim());

    // Determine the ID upfront so we can navigate to the detail page
    const savedId = this.editId() ?? crypto.randomUUID();

    const recipe = {
      id: savedId,
      name: v.name ?? '',
      description: v.description ?? '',
      photo: v.photo || undefined,
      category: (v.category ?? 'dinner') as Category,
      season: (v.season || undefined) as Season | undefined,
      cookingTime: Number(v.cookingTime ?? 30),
      servings: Number(v.servings ?? 4),
      calories: Number(v.calories ?? 0),
      rating: this.rating(),
      isFavourite: false,
      tags: this.tags(),
      ingredients,
      steps,
      nutrition: {
        protein: Number(v.nutrition?.protein ?? 0),
        carbs: Number(v.nutrition?.carbs ?? 0),
        fat: Number(v.nutrition?.fat ?? 0),
      },
    };

    this.store.dispatch(CookbookActions.saveRecipe({ recipe }));

    // Navigate to detail page after dispatch (save is synchronous in mock)
    setTimeout(() => {
      this.router.navigate(['/cookbook', savedId]);
    }, 50);
  }

  cancel() {
    if (this.form.dirty) {
      if (!confirm('Discard changes?')) return;
    }
    const editId = this.editId();
    if (editId) {
      this.router.navigate(['/cookbook', editId]);
    } else {
      this.router.navigate(['/cookbook']);
    }
  }
}
