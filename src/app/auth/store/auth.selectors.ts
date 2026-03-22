import { createSelector } from '@ngrx/store';
import {
  selectUser,
  selectProfile,
  selectFamily,
  selectFamilyMembers,
  selectFamilyInvites,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectIsNewUser,
  selectAuthInitialized,
} from './auth.reducer';

// Re-export feature selectors
export {
  selectUser,
  selectProfile,
  selectFamily,
  selectFamilyMembers,
  selectFamilyInvites,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectIsNewUser,
  selectAuthInitialized,
};

export const selectCurrentUserInitials = createSelector(
  selectProfile,
  (profile) => {
    if (!profile?.name) return '?';
    const parts = profile.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },
);

export const selectCurrentUserColor = createSelector(
  selectProfile,
  (profile) => profile?.color_theme ?? 'teal',
);

export const selectIsAdmin = createSelector(
  selectProfile,
  (profile) => profile?.role === 'admin',
);

export const selectHasFamily = createSelector(
  selectProfile,
  (profile) => !!profile?.family_id,
);
