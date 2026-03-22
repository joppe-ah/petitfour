import { routerReducer } from '@ngrx/router-store';
import { themeFeature } from './theme/theme.reducer';
import { authFeature } from '../../auth/store/auth.reducer';
import { settingsFeature } from '../../settings/store/settings.reducer';

export const appReducers = {
  [themeFeature.name]: themeFeature.reducer,
  [authFeature.name]: authFeature.reducer,
  [settingsFeature.name]: settingsFeature.reducer,
  router: routerReducer,
};
