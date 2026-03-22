export type Language = 'en' | 'nl' | 'fr' | 'de';

export interface NotificationPreferences {
  newRecipes: boolean;
  budgetAlerts: boolean;
  mealReminders: boolean;
}

export interface WidgetVisibility {
  showCookbook: boolean;
  showMoney: boolean;
  showPlanner: boolean;
}

export interface SettingsState {
  isOpen: boolean;
  activeSection: SettingsSection;
  language: Language;
  notifications: NotificationPreferences;
  widgets: WidgetVisibility;
}

export type SettingsSection =
  | 'profile'
  | 'dietary'
  | 'appearance'
  | 'dashboard'
  | 'notifications'
  | 'about';

export const initialSettingsState: SettingsState = {
  isOpen: false,
  activeSection: 'profile',
  language: 'en',
  notifications: {
    newRecipes: true,
    budgetAlerts: true,
    mealReminders: true,
  },
  widgets: {
    showCookbook: true,
    showMoney: true,
    showPlanner: true,
  },
};
