import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,

    on(AuthActions.initAuth, state => ({
      ...state, loading: true, authInitialized: false,
    })),
    on(AuthActions.initAuthSuccess, (state, { user }) => ({
      ...state, user, isAuthenticated: true, loading: false, authInitialized: true,
    })),
    on(AuthActions.initAuthFailure, state => ({
      ...state, user: null, isAuthenticated: false, loading: false, authInitialized: true,
    })),

    on(AuthActions.signOutSuccess, state => ({
      ...state,
      user: null, profile: null, family: null,
      familyMembers: [], familyInvites: [],
      isAuthenticated: false, isNewUser: false,
    })),

    on(AuthActions.setNewUser, state => ({
      ...state, isNewUser: true, loading: false,
    })),
    on(AuthActions.loadProfileSuccess, (state, { profile }) => ({
      ...state, profile, isNewUser: false,
    })),
    on(AuthActions.saveProfileSuccess, (state, { profile }) => ({
      ...state, profile, isNewUser: false,
    })),

    on(AuthActions.loadFamilySuccess, (state, { family }) => ({
      ...state, family,
    })),
    on(AuthActions.loadFamilyMembersSuccess, (state, { members }) => ({
      ...state, familyMembers: members,
    })),
    on(AuthActions.loadFamilyInvitesSuccess, (state, { invites }) => ({
      ...state, familyInvites: invites,
    })),

    on(AuthActions.createFamilySuccess, (state, { family }) => ({
      ...state,
      family,
      profile: state.profile
        ? { ...state.profile, family_id: family.id, role: 'admin' as const }
        : null,
    })),
    on(AuthActions.joinFamilyByCodeSuccess, (state, { family }) => ({
      ...state,
      family,
      profile: state.profile
        ? { ...state.profile, family_id: family.id, role: 'member' as const }
        : null,
    })),

    on(AuthActions.authError, (state, { error }) => ({
      ...state, error, loading: false,
    })),
  ),
});

export const {
  selectUser,
  selectProfile,
  selectFamily,
  selectFamilyMembers,
  selectFamilyInvites,
  selectLoading: selectAuthLoading,
  selectError: selectAuthError,
  selectIsAuthenticated,
  selectIsNewUser,
  selectAuthInitialized,
} = authFeature;
