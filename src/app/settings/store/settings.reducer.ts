import { createFeature, createReducer, on } from '@ngrx/store';
import { SettingsActions } from './settings.actions';
import { initialSettingsState } from './settings.state';

export const settingsFeature = createFeature({
  name: 'settings',
  reducer: createReducer(
    initialSettingsState,

    on(SettingsActions.openSettings, (state, { section }) => ({
      ...state,
      isOpen: true,
      activeSection: section ?? state.activeSection,
    })),

    on(SettingsActions.closeSettings, (state) => ({
      ...state,
      isOpen: false,
    })),

    on(SettingsActions.setActiveSection, (state, { section }) => ({
      ...state,
      activeSection: section,
    })),

    on(SettingsActions.setLanguage, (state, { language }) => ({
      ...state,
      language,
    })),

    on(SettingsActions.updateNotificationPreferences, (state, { notifications }) => ({
      ...state,
      notifications: { ...state.notifications, ...notifications },
    })),

    on(SettingsActions.toggleWidget, (state, { widget }) => ({
      ...state,
      widgets: { ...state.widgets, [widget]: !state.widgets[widget] },
    })),

    on(SettingsActions.resetDashboardWidgets, (state) => ({
      ...state,
      widgets: { showCookbook: true, showMoney: true, showPlanner: true },
    })),

    on(SettingsActions.loadSavedSettingsSuccess, (state, { language, notifications, widgets }) => ({
      ...state,
      language,
      notifications,
      widgets,
    })),
  ),
});
