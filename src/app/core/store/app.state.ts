import { RouterReducerState } from '@ngrx/router-store';
import { ThemeState } from './theme/theme.reducer';

export interface AppState {
  theme: ThemeState;
  router: RouterReducerState;
}
