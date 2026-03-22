import { Component, inject, signal, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsActions } from '../../store/settings.actions';
import { selectIsOpen, selectActiveSection, selectLanguage, selectNotifications, selectWidgets } from '../../store/settings.selectors';
import { selectProfile } from '../../../auth/store/auth.selectors';
import { selectTheme, selectIsSystemControlled } from '../../../core/store/theme/theme.selectors';
import { AuthActions } from '../../../auth/store/auth.actions';
import { ThemeActions, Theme } from '../../../core/store/theme/theme.actions';
import { SettingsSection, Language } from '../../store/settings.state';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { DIETARY_LABELS, DietaryPreference } from '../../../auth/models/profile.model';

const SECTIONS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'profile',       label: 'Profile',       icon: '◌' },
  { id: 'dietary',       label: 'Dietary',        icon: '◎' },
  { id: 'appearance',    label: 'Appearance',     icon: '◑' },
  { id: 'dashboard',     label: 'Dashboard',      icon: '⊞' },
  { id: 'notifications', label: 'Notifications',  icon: '◻' },
  { id: 'about',         label: 'About',          icon: '◈' },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const DIETARY_ALL: DietaryPreference[] = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher',
];

@Component({
  selector: 'app-settings-modal',
  imports: [FormsModule, AvatarComponent],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
        (click)="close()"
      >
        <!-- Modal card -->
        <div
          class="relative w-full max-w-[640px] max-h-[80vh] bg-pf-surface border border-[0.5px]
                 border-pf-border rounded-[16px] overflow-hidden flex shadow-xl"
          (click)="$event.stopPropagation()"
        >
          <!-- Left nav -->
          <div class="w-[160px] shrink-0 border-r border-[0.5px] border-pf-border
                      bg-pf-bg flex flex-col">
            <div class="px-4 py-4 border-b border-[0.5px] border-pf-border">
              <p class="text-xs font-[500] text-pf-text">Settings</p>
            </div>

            <nav class="flex-1 px-2 py-2 flex flex-col gap-0.5">
              @for (s of sections; track s.id) {
                <button
                  (click)="setSection(s.id)"
                  [class.bg-pf-surface]="activeSection() === s.id"
                  [class.text-pf-text]="activeSection() === s.id"
                  [class.text-pf-subtle]="activeSection() !== s.id"
                  class="flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs w-full text-left
                         hover:bg-pf-surface hover:text-pf-text transition-colors"
                >
                  <span class="leading-none">{{ s.icon }}</span>
                  <span>{{ s.label }}</span>
                </button>
              }
            </nav>

            <!-- Sign out -->
            <div class="px-2 py-3 border-t border-[0.5px] border-pf-border">
              <button
                (click)="signOut()"
                class="flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs text-pf-subtle
                       hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full text-left
                       transition-colors"
              >
                <span class="leading-none">↑</span>
                <span>Sign out</span>
              </button>
            </div>
          </div>

          <!-- Right content -->
          <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-[0.5px] border-pf-border shrink-0">
              <h2 class="text-sm font-[500] text-pf-text">{{ sectionLabel() }}</h2>
              <button
                (click)="close()"
                class="w-7 h-7 flex items-center justify-center rounded-[6px] text-pf-muted
                       hover:text-pf-text hover:bg-pf-bg transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <!-- Scrollable body -->
            <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

              <!-- ── Profile ─────────────────────────────────────── -->
              @if (activeSection() === 'profile') {
                @if (profile(); as p) {
                  <div class="flex items-center gap-4">
                    <pf-avatar [profile]="p" size="lg" />
                    <div>
                      <p class="text-sm font-[500] text-pf-text">{{ p.name }}</p>
                      <p class="text-xs text-pf-muted mt-0.5">{{ p.role }}</p>
                    </div>
                  </div>
                }
                <div>
                  <p class="text-xs text-pf-muted mb-2">Language</p>
                  <div class="flex flex-wrap gap-2">
                    @for (lang of languages; track lang.value) {
                      <button
                        (click)="setLanguage(lang.value)"
                        [class.bg-pf-text]="language() === lang.value"
                        [class.text-pf-bg]="language() === lang.value"
                        [class.bg-pf-bg]="language() !== lang.value"
                        [class.text-pf-subtle]="language() !== lang.value"
                        class="px-3 py-1.5 rounded-[6px] text-xs border border-[0.5px] border-pf-border
                               transition-colors"
                      >
                        {{ lang.label }}
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <a
                    (click)="goToProfile()"
                    class="inline-flex items-center gap-1.5 text-xs text-[#1D9E75] cursor-pointer
                           hover:underline"
                  >
                    Edit full profile →
                  </a>
                </div>
              }

              <!-- ── Dietary ──────────────────────────────────────── -->
              @if (activeSection() === 'dietary') {
                @if (profile(); as p) {
                  <div>
                    <p class="text-xs text-pf-muted mb-3">Your dietary preferences</p>
                    <div class="flex flex-wrap gap-2">
                      @for (pref of dietaryAll; track pref) {
                        <div
                          [class.border-[#1D9E75]]="hasDietary(p, pref)"
                          [class.bg-[#E1F5EE]]="hasDietary(p, pref)"
                          [class.text-[#1D9E75]]="hasDietary(p, pref)"
                          [class.dark:bg-[#0d2e22]]="hasDietary(p, pref)"
                          class="px-3 py-1.5 rounded-full text-xs border border-[0.5px]
                                 border-pf-border text-pf-subtle"
                        >
                          {{ dietaryLabels[pref] }}
                        </div>
                      }
                    </div>
                  </div>
                  <p class="text-xs text-pf-muted">
                    To change dietary preferences, edit your
                    <a (click)="goToProfile()" class="text-[#1D9E75] cursor-pointer hover:underline">
                      profile
                    </a>.
                  </p>
                } @else {
                  <p class="text-sm text-pf-muted">Profile not loaded.</p>
                }
              }

              <!-- ── Appearance ───────────────────────────────────── -->
              @if (activeSection() === 'appearance') {
                <div>
                  <p class="text-xs text-pf-muted mb-3">Theme</p>
                  <div class="flex gap-2">
                    <button
                      (click)="setTheme('light')"
                      [class.ring-1]="theme() === 'light' && !systemControlled()"
                      [class.ring-[#1D9E75]]="theme() === 'light' && !systemControlled()"
                      class="flex-1 py-2.5 rounded-[8px] text-xs border border-[0.5px] border-pf-border
                             text-pf-subtle hover:text-pf-text hover:bg-pf-bg transition-colors"
                    >
                      ☀ Light
                    </button>
                    <button
                      (click)="setTheme('dark')"
                      [class.ring-1]="theme() === 'dark' && !systemControlled()"
                      [class.ring-[#1D9E75]]="theme() === 'dark' && !systemControlled()"
                      class="flex-1 py-2.5 rounded-[8px] text-xs border border-[0.5px] border-pf-border
                             text-pf-subtle hover:text-pf-text hover:bg-pf-bg transition-colors"
                    >
                      ☽ Dark
                    </button>
                    <button
                      (click)="resetTheme()"
                      [class.ring-1]="systemControlled()"
                      [class.ring-[#1D9E75]]="systemControlled()"
                      class="flex-1 py-2.5 rounded-[8px] text-xs border border-[0.5px] border-pf-border
                             text-pf-subtle hover:text-pf-text hover:bg-pf-bg transition-colors"
                    >
                      ◑ System
                    </button>
                  </div>
                </div>
              }

              <!-- ── Dashboard ───────────────────────────────────── -->
              @if (activeSection() === 'dashboard') {
                <div>
                  <p class="text-xs text-pf-muted mb-3">Visible widgets</p>
                  <div class="flex flex-col gap-2">
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <span class="text-sm text-pf-text">Cookbook</span>
                      <div
                        (click)="toggleWidget('showCookbook')"
                        [class.bg-[#1D9E75]]="widgets().showCookbook"
                        [class.bg-pf-border]="!widgets().showCookbook"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                      >
                        <div
                          [class.translate-x-4]="widgets().showCookbook"
                          [class.translate-x-0.5]="!widgets().showCookbook"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <span class="text-sm text-pf-text">Money tracker</span>
                      <div
                        (click)="toggleWidget('showMoney')"
                        [class.bg-[#1D9E75]]="widgets().showMoney"
                        [class.bg-pf-border]="!widgets().showMoney"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                      >
                        <div
                          [class.translate-x-4]="widgets().showMoney"
                          [class.translate-x-0.5]="!widgets().showMoney"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <span class="text-sm text-pf-text">Meal planner</span>
                      <div
                        (click)="toggleWidget('showPlanner')"
                        [class.bg-[#1D9E75]]="widgets().showPlanner"
                        [class.bg-pf-border]="!widgets().showPlanner"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                      >
                        <div
                          [class.translate-x-4]="widgets().showPlanner"
                          [class.translate-x-0.5]="!widgets().showPlanner"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                  </div>
                  <button
                    (click)="resetWidgets()"
                    class="mt-3 text-xs text-pf-muted hover:text-pf-subtle transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
              }

              <!-- ── Notifications ────────────────────────────────── -->
              @if (activeSection() === 'notifications') {
                <div>
                  <p class="text-xs text-pf-muted mb-3">Push notifications</p>
                  <div class="flex flex-col gap-2">
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <div>
                        <p class="text-sm text-pf-text">New recipes</p>
                        <p class="text-[11px] text-pf-muted">When a family member adds a recipe</p>
                      </div>
                      <div
                        (click)="toggleNotification('newRecipes')"
                        [class.bg-[#1D9E75]]="notifications().newRecipes"
                        [class.bg-pf-border]="!notifications().newRecipes"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ml-3"
                      >
                        <div
                          [class.translate-x-4]="notifications().newRecipes"
                          [class.translate-x-0.5]="!notifications().newRecipes"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <div>
                        <p class="text-sm text-pf-text">Budget alerts</p>
                        <p class="text-[11px] text-pf-muted">When spending exceeds budget</p>
                      </div>
                      <div
                        (click)="toggleNotification('budgetAlerts')"
                        [class.bg-[#1D9E75]]="notifications().budgetAlerts"
                        [class.bg-pf-border]="!notifications().budgetAlerts"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ml-3"
                      >
                        <div
                          [class.translate-x-4]="notifications().budgetAlerts"
                          [class.translate-x-0.5]="!notifications().budgetAlerts"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                    <label class="flex items-center justify-between py-2.5 px-3 rounded-[8px]
                                  bg-pf-bg border border-[0.5px] border-pf-border cursor-pointer">
                      <div>
                        <p class="text-sm text-pf-text">Meal reminders</p>
                        <p class="text-[11px] text-pf-muted">Daily reminder to log meals</p>
                      </div>
                      <div
                        (click)="toggleNotification('mealReminders')"
                        [class.bg-[#1D9E75]]="notifications().mealReminders"
                        [class.bg-pf-border]="!notifications().mealReminders"
                        class="w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ml-3"
                      >
                        <div
                          [class.translate-x-4]="notifications().mealReminders"
                          [class.translate-x-0.5]="!notifications().mealReminders"
                          class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm
                                 transition-transform"
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>
              }

              <!-- ── About ───────────────────────────────────────── -->
              @if (activeSection() === 'about') {
                <div class="flex flex-col gap-4">
                  <div>
                    <p class="text-sm text-pf-text font-[500]">PetitFour</p>
                    <p class="text-xs text-pf-muted mt-0.5">Version 1.0.0</p>
                  </div>
                  <p class="text-xs text-pf-subtle leading-relaxed">
                    Your family's all-in-one app — recipes, meal planning, budgets, and more.
                    Built with Angular and Supabase.
                  </p>
                  <div class="flex flex-col gap-1">
                    <p class="text-[11px] text-pf-muted uppercase tracking-wider">Support</p>
                    <a
                      href="mailto:support@petitfour.app"
                      class="text-xs text-[#1D9E75] hover:underline"
                    >
                      support@petitfour.app
                    </a>
                  </div>
                  <div class="pt-2 border-t border-[0.5px] border-pf-border">
                    <p class="text-[11px] text-pf-muted">
                      © 2026 PetitFour. All rights reserved.
                    </p>
                  </div>
                </div>
              }

            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SettingsModalComponent {
  private store = inject(Store);
  private router = inject(Router);

  sections = SECTIONS;
  languages = LANGUAGES;
  dietaryAll = DIETARY_ALL;
  dietaryLabels = DIETARY_LABELS;

  isOpen = this.store.selectSignal(selectIsOpen);
  activeSection = this.store.selectSignal(selectActiveSection);
  language = this.store.selectSignal(selectLanguage);
  notifications = this.store.selectSignal(selectNotifications);
  widgets = this.store.selectSignal(selectWidgets);
  profile = this.store.selectSignal(selectProfile);
  theme = this.store.selectSignal(selectTheme);
  systemControlled = this.store.selectSignal(selectIsSystemControlled);

  sectionLabel = computed(() => SECTIONS.find(s => s.id === this.activeSection())?.label ?? '');

  close() {
    this.store.dispatch(SettingsActions.closeSettings());
  }

  setSection(section: SettingsSection) {
    this.store.dispatch(SettingsActions.setActiveSection({ section }));
  }

  setLanguage(language: Language) {
    this.store.dispatch(SettingsActions.setLanguage({ language }));
  }

  setTheme(theme: Theme) {
    this.store.dispatch(ThemeActions.setTheme({ theme, isSystemControlled: false }));
  }

  resetTheme() {
    this.store.dispatch(ThemeActions.resetToSystemTheme());
  }

  toggleWidget(widget: 'showCookbook' | 'showMoney' | 'showPlanner') {
    this.store.dispatch(SettingsActions.toggleWidget({ widget }));
  }

  resetWidgets() {
    this.store.dispatch(SettingsActions.resetDashboardWidgets());
  }

  toggleNotification(key: 'newRecipes' | 'budgetAlerts' | 'mealReminders') {
    this.store.dispatch(SettingsActions.updateNotificationPreferences({
      notifications: { [key]: !this.notifications()[key] },
    }));
  }

  signOut() {
    this.store.dispatch(SettingsActions.closeSettings());
    this.store.dispatch(AuthActions.signOut());
  }

  goToProfile() {
    this.store.dispatch(SettingsActions.closeSettings());
    this.router.navigate(['/profile']);
  }

  hasDietary(profile: { dietary_preferences: string[] }, pref: string): boolean {
    return profile.dietary_preferences.includes(pref);
  }
}
