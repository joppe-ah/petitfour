import { routerReducer } from '@ngrx/router-store';
import { themeFeature } from './theme/theme.reducer';

export const appReducers = {
  [themeFeature.name]: themeFeature.reducer,
  router: routerReducer,
};
