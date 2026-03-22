import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth.actions';
import {
  ColorTheme,
  COLOR_THEME_VALUES,
  DietaryPreference,
  DIETARY_LABELS,
} from '../../models/profile.model';

const PRESET_AVATARS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const PRESET_COLORS = ['#1D9E75', '#BA7517', '#D85A30', '#7F77DD', '#378ADD', '#D4537E', '#888780', '#5E9E5A'];

@Component({
  selector: 'app-auth-setup',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-pf-bg flex items-center justify-center px-4 py-12 overflow-y-auto">
      <div class="w-full max-w-[440px]">

        <!-- Header -->
        <div class="text-center mb-8">
          <p class="text-lg text-pf-text tracking-tight mb-1">PetitFour <span class="text-pf-muted">✦</span></p>
          <h1 class="text-base font-[500] text-pf-text">Set up your profile</h1>
          <p class="text-xs text-pf-muted mt-1">Tell us a bit about yourself</p>
        </div>

        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-6 flex flex-col gap-5">

          <!-- Name -->
          <div>
            <label class="text-[11px] font-[500] text-pf-subtle uppercase tracking-wider mb-1.5 block">
              Your name *
            </label>
            <input
              [(ngModel)]="name"
              placeholder="Full name"
              class="w-full px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px]
                     text-sm text-pf-text placeholder:text-pf-muted focus:outline-none focus:border-[#1D9E75]
                     transition-colors"
            />
            @if (submitted() && !name.trim()) {
              <p class="text-xs text-[#D85A30] mt-1">Name is required</p>
            }
          </div>

          <!-- Avatar -->
          <div>
            <label class="text-[11px] font-[500] text-pf-subtle uppercase tracking-wider mb-2 block">
              Avatar
            </label>

            <!-- Preset circles -->
            <div class="flex gap-2 flex-wrap mb-3">
              @for (letter of presetAvatars; track letter; let i = $index) {
                <button
                  (click)="selectPreset(letter, i)"
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-[500] transition-all"
                  [style.background-color]="presetColors[i]"
                  [class]="selectedPreset() === letter ? 'ring-2 ring-offset-2 ring-[#1D9E75]' : ''"
                >
                  {{ letter }}
                </button>
              }
            </div>

            <!-- Upload photo -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onPhotoSelected($event)"
              />
              @if (photoPreview()) {
                <div class="relative">
                  <img [src]="photoPreview()" class="w-10 h-10 rounded-full object-cover" />
                  <button
                    (click)="$event.preventDefault(); removePhoto()"
                    class="absolute -top-1 -right-1 w-4 h-4 bg-[#D85A30] rounded-full text-white text-[10px] flex items-center justify-center"
                  >✕</button>
                </div>
                <span class="text-xs text-pf-subtle">Photo selected</span>
              } @else {
                <div class="w-10 h-10 rounded-full border border-dashed border-pf-border flex items-center justify-center text-pf-muted text-lg">+</div>
                <span class="text-xs text-pf-subtle">Upload photo (optional)</span>
              }
            </label>
          </div>

          <!-- Color theme -->
          <div>
            <label class="text-[11px] font-[500] text-pf-subtle uppercase tracking-wider mb-2 block">
              Personal color
            </label>
            <div class="flex gap-2">
              @for (theme of colorThemes; track theme) {
                <button
                  (click)="selectedTheme.set(theme)"
                  class="w-9 h-9 rounded-full transition-all flex items-center justify-center"
                  [style.background-color]="themeColor(theme)"
                  [attr.title]="theme"
                >
                  @if (selectedTheme() === theme) {
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
            <label class="text-[11px] font-[500] text-pf-subtle uppercase tracking-wider mb-2 block">
              Dietary preferences
            </label>
            <div class="flex flex-wrap gap-2">
              @for (pref of dietaryOptions; track pref) {
                <button
                  (click)="toggleDiet(pref)"
                  class="px-3 py-1.5 rounded-full text-xs border border-[0.5px] transition-colors"
                  [class]="isDietSelected(pref)
                    ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
                    : 'border-pf-border text-pf-subtle hover:border-pf-subtle'"
                >
                  {{ dietLabel(pref) }}
                </button>
              }
            </div>
          </div>

          <!-- Submit -->
          <button
            (click)="submit()"
            [disabled]="saving()"
            class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]
                   hover:bg-[#178F68] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {{ saving() ? 'Saving…' : 'Get started' }}
          </button>

        </div>
      </div>
    </div>
  `,
})
export class AuthSetupComponent {
  private store = inject(Store);
  private router = inject(Router);

  name = '';
  saving = signal(false);
  submitted = signal(false);
  selectedPreset = signal<string>('A');
  photoPreview = signal<string | null>(null);
  selectedTheme = signal<ColorTheme>('teal');
  selectedDiets = signal<DietaryPreference[]>([]);

  presetAvatars = PRESET_AVATARS;
  presetColors = PRESET_COLORS;
  colorThemes: ColorTheme[] = ['teal', 'amber', 'coral', 'purple', 'blue', 'pink'];
  dietaryOptions: DietaryPreference[] = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher',
  ];

  selectPreset(letter: string, _i: number): void {
    this.selectedPreset.set(letter);
    this.photoPreview.set(null);
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.photoPreview.set(e.target?.result as string);
      this.selectedPreset.set('');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoPreview.set(null);
    this.selectedPreset.set('A');
  }

  themeColor(theme: ColorTheme): string {
    return COLOR_THEME_VALUES[theme];
  }

  toggleDiet(pref: DietaryPreference): void {
    this.selectedDiets.update(diets =>
      diets.includes(pref) ? diets.filter(d => d !== pref) : [...diets, pref],
    );
  }

  isDietSelected(pref: DietaryPreference): boolean {
    return this.selectedDiets().includes(pref);
  }

  dietLabel(pref: DietaryPreference): string {
    return DIETARY_LABELS[pref];
  }

  submit(): void {
    this.submitted.set(true);
    if (!this.name.trim()) return;

    this.saving.set(true);
    this.store.dispatch(
      AuthActions.saveProfile({
        profile: {
          name: this.name.trim(),
          avatar_url: this.photoPreview(),
          avatar_preset: this.selectedPreset() || null,
          color_theme: this.selectedTheme(),
          dietary_preferences: this.selectedDiets(),
        },
      }),
    );
    this.router.navigate(['/dashboard']);
  }
}
