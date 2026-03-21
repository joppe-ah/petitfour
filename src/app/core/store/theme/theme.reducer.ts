import { createFeature, createReducer, on } from '@ngrx/store';
import { Theme, ThemeActions } from './theme.actions';

export interface ThemeState {
  theme: Theme;
  isSystemControlled: boolean;
}

const initialState: ThemeState = {
  theme: 'light',
  isSystemControlled: true,
};

export const themeFeature = createFeature({
  name: 'theme',
  reducer: createReducer(
    initialState,

    on(ThemeActions.setTheme, (_state, { theme, isSystemControlled }) => ({
      theme,
      isSystemControlled,
    })),

    on(ThemeActions.toggleTheme, (state) => ({
      theme: state.theme === 'light' ? ('dark' as Theme) : ('light' as Theme),
      isSystemControlled: false,
    })),

    // resetToSystemTheme is handled fully in effects → dispatches setTheme
    // Reducer is a no-op for it; we leave state unchanged until effect resolves
  ),
});

export const {
  name: themeFeatureName,
  reducer: themeReducer,
  selectThemeState,
  selectTheme,
  selectIsSystemControlled,
} = themeFeature;
