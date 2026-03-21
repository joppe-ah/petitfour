import { createActionGroup, emptyProps, props } from '@ngrx/store';

export type Theme = 'light' | 'dark';

export const ThemeActions = createActionGroup({
  source: 'Theme',
  events: {
    'Set Theme': props<{ theme: Theme; isSystemControlled: boolean }>(),
    'Toggle Theme': emptyProps(),
    'Reset To System Theme': emptyProps(),
  },
});
