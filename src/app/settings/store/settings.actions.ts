import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Language, NotificationPreferences, SettingsSection, WidgetVisibility } from './settings.state';

export const SettingsActions = createActionGroup({
  source: 'Settings',
  events: {
    'Open Settings': props<{ section?: SettingsSection }>(),
    'Close Settings': emptyProps(),
    'Set Active Section': props<{ section: SettingsSection }>(),
    'Set Language': props<{ language: Language }>(),
    'Update Notification Preferences': props<{ notifications: Partial<NotificationPreferences> }>(),
    'Toggle Widget': props<{ widget: keyof WidgetVisibility }>(),
    'Reset Dashboard Widgets': emptyProps(),
    'Load Saved Settings Success': props<{
      language: Language;
      notifications: NotificationPreferences;
      widgets: WidgetVisibility;
    }>(),
  },
});
