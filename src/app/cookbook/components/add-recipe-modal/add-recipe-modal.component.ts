import { Component, effect, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { CookbookActions } from '../../store/cookbook.actions';
import { selectImportLoading, selectImportedRecipe } from '../../store/cookbook.selectors';

type ModalView = 'menu' | 'url' | 'photo';

@Component({
  selector: 'app-add-recipe-modal',
  imports: [FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
      (click)="close.emit()"
    >
      <!-- Card -->
      <div
        class="bg-pf-surface rounded-[16px] p-6 w-full max-w-sm mx-4 z-50"
        (click)="$event.stopPropagation()"
      >
        @if (view() === 'menu') {
          <h2 class="text-sm font-[500] text-pf-text mb-5">Add a recipe</h2>
          <div class="space-y-2">
            <button
              (click)="addManually()"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[0.5px] border-pf-border text-sm text-pf-text hover:border-pf-subtle transition-colors text-left"
            >
              <span class="text-lg">✏️</span>
              <div>
                <p class="text-sm font-[450] text-pf-text">Add manually</p>
                <p class="text-xs text-pf-muted">Fill in the recipe form</p>
              </div>
            </button>
            <button
              (click)="view.set('url')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[0.5px] border-pf-border text-sm text-pf-text hover:border-pf-subtle transition-colors text-left"
            >
              <span class="text-lg">🔗</span>
              <div>
                <p class="text-sm font-[450] text-pf-text">Import from URL</p>
                <p class="text-xs text-pf-muted">Paste a recipe link</p>
              </div>
            </button>
            <button
              (click)="view.set('photo')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[0.5px] border-pf-border text-sm text-pf-text hover:border-pf-subtle transition-colors text-left"
            >
              <span class="text-lg">📷</span>
              <div>
                <p class="text-sm font-[450] text-pf-text">Scan recipe</p>
                <p class="text-xs text-pf-muted">Take or upload a photo</p>
              </div>
            </button>
          </div>
          <button
            (click)="close.emit()"
            class="mt-4 w-full py-2 text-xs text-pf-subtle hover:text-pf-text transition-colors"
          >
            Cancel
          </button>
        }

        @if (view() === 'url') {
          <div class="flex items-center gap-2 mb-5">
            <button (click)="view.set('menu')" class="text-pf-subtle hover:text-pf-text text-sm">←</button>
            <h2 class="text-sm font-[500] text-pf-text">Import from URL</h2>
          </div>
          <input
            type="url"
            [(ngModel)]="urlInput"
            placeholder="https://example.com/recipe"
            class="w-full px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px] text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-pf-subtle"
          />
          @if (urlError()) {
            <p class="text-xs text-[#993556] mt-1.5">{{ urlError() }}</p>
          }
          <button
            (click)="importUrl()"
            [disabled]="importLoading()"
            class="mt-3 w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (importLoading()) {
              Importing…
            } @else {
              Import
            }
          </button>
          <button
            (click)="close.emit()"
            class="mt-2 w-full py-2 text-xs text-pf-subtle hover:text-pf-text transition-colors"
          >
            Cancel
          </button>
        }

        @if (view() === 'photo') {
          <div class="flex items-center gap-2 mb-5">
            <button (click)="view.set('menu')" class="text-pf-subtle hover:text-pf-text text-sm">←</button>
            <h2 class="text-sm font-[500] text-pf-text">Scan recipe</h2>
          </div>
          <label class="block cursor-pointer">
            <div class="border border-[0.5px] border-dashed border-pf-border rounded-[10px] p-8 text-center hover:border-pf-subtle transition-colors">
              <p class="text-3xl mb-2">📷</p>
              <p class="text-sm text-pf-subtle">Tap to select a photo</p>
              <p class="text-xs text-pf-muted mt-1">JPG, PNG supported</p>
            </div>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </label>
          @if (importLoading()) {
            <div class="mt-3 text-center">
              <p class="text-sm text-pf-subtle">Scanning recipe…</p>
            </div>
          }
          <button
            (click)="close.emit()"
            class="mt-3 w-full py-2 text-xs text-pf-subtle hover:text-pf-text transition-colors"
          >
            Cancel
          </button>
        }
      </div>
    </div>
  `,
})
export class AddRecipeModalComponent {
  close = output<void>();

  private store = inject(Store);
  private router = inject(Router);

  view = signal<ModalView>('menu');
  urlInput = '';
  urlError = signal('');
  importLoading = this.store.selectSignal(selectImportLoading);
  importedRecipe = this.store.selectSignal(selectImportedRecipe);

  constructor() {
    effect(() => {
      if (this.importedRecipe()) {
        this.router.navigate(['/cookbook', 'new']);
        this.close.emit();
      }
    });
  }

  addManually() {
    this.router.navigate(['/cookbook', 'new']);
    this.close.emit();
  }

  importUrl() {
    this.urlError.set('');
    const url = this.urlInput.trim();
    if (!url) {
      this.urlError.set('Please enter a URL.');
      return;
    }
    try {
      new URL(url);
    } catch {
      this.urlError.set('Please enter a valid URL.');
      return;
    }
    this.store.dispatch(CookbookActions.importFromUrl({ url }));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.store.dispatch(CookbookActions.importFromPhoto());
    }
  }
}
