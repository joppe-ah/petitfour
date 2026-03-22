import { inject, Injectable, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, from, of } from 'rxjs';
import { catchError, exhaustMap, filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AuthActions } from './auth.actions';
import { selectProfile, selectFamily, selectUser } from './auth.selectors';
import { Profile } from '../models/profile.model';
import { Family, FamilyInvite } from '../models/family.model';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // ── Auth init ─────────────────────────────────────────────────────────────

  initAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initAuth),
      exhaustMap(() => {
        // Set up ongoing auth change listener
        this.supabase.client.auth.onAuthStateChange((event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            this.store.dispatch(AuthActions.initAuthSuccess({ user: session.user }));
          } else if (event === 'SIGNED_OUT') {
            this.store.dispatch(AuthActions.signOutSuccess());
          }
        });

        // Return action based on current session
        return from(this.supabase.client.auth.getSession()).pipe(
          map(({ data: { session } }) => {
            if (session) {
              if (isDevMode()) {
                console.log('[PetitFour Auth] Session restored:', session.user.email);
              }
              return AuthActions.initAuthSuccess({ user: session.user });
            }
            return AuthActions.initAuthFailure();
          }),
          catchError(() => of(AuthActions.initAuthFailure())),
        );
      }),
    ),
  );

  // ── Sign in ───────────────────────────────────────────────────────────────

  signInWithMagicLink$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signInWithMagicLink),
        tap(({ email }) => {
          this.supabase.client.auth
            .signInWithOtp({
              email,
              options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            })
            .catch(() => this.toast.show('Failed to send magic link. Please try again.'));
        }),
      ),
    { dispatch: false },
  );

  signInWithGoogle$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signInWithGoogle),
        tap(() => {
          this.supabase.client.auth
            .signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            })
            .catch(() => this.toast.show('Failed to sign in with Google. Please try again.'));
        }),
      ),
    { dispatch: false },
  );

  // ── Sign out ──────────────────────────────────────────────────────────────

  signOut$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signOut),
      switchMap(() =>
        from(this.supabase.client.auth.signOut()).pipe(
          map(() => AuthActions.signOutSuccess()),
          catchError(() => of(AuthActions.signOutSuccess())),
        ),
      ),
    ),
  );

  navigateAfterSignOut$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signOutSuccess),
        tap(() => {
          // Clear the sessionStorage rehydration key so a future reload doesn't
          // restore a stale authenticated state after an explicit sign-out.
          sessionStorage.removeItem('pf-ngrx-auth');
          this.router.navigate(['/auth/login']);
        }),
      ),
    { dispatch: false },
  );

  // ── Profile ───────────────────────────────────────────────────────────────

  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initAuthSuccess),
      switchMap(({ user }) =>
        from(
          this.supabase.client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) return AuthActions.setNewUser();
            return AuthActions.loadProfileSuccess({ profile: data as Profile });
          }),
          catchError(() => of(AuthActions.setNewUser())),
        ),
      ),
    ),
  );

  navigateToSetup$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.setNewUser),
        tap(() => this.router.navigate(['/auth/setup'])),
      ),
    { dispatch: false },
  );

  saveProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.saveProfile),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([{ profile }, user]) => {
        if (!user) return of(AuthActions.authError({ error: 'Not authenticated' }));
        const payload = {
          ...profile,
          id: user.id,
          updated_at: new Date().toISOString(),
        };
        return from(
          this.supabase.client
            .from('profiles')
            .upsert(payload)
            .select()
            .single(),
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) return AuthActions.authError({ error: error?.message ?? 'Save failed' });
            return AuthActions.saveProfileSuccess({ profile: data as Profile });
          }),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        );
      }),
    ),
  );

  // ── Family ────────────────────────────────────────────────────────────────

  loadFamilyAfterProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadProfileSuccess),
      filter(({ profile }) => !!profile.family_id),
      map(() => AuthActions.loadFamily()),
    ),
  );

  loadFamily$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadFamily),
      withLatestFrom(this.store.select(selectProfile)),
      switchMap(([, profile]) => {
        if (!profile?.family_id) return EMPTY;
        return from(
          this.supabase.client
            .from('families')
            .select('*')
            .eq('id', profile.family_id)
            .single(),
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) return AuthActions.authError({ error: 'Family not found' });
            return AuthActions.loadFamilySuccess({ family: data as Family });
          }),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        );
      }),
    ),
  );

  loadFamilyMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadFamilySuccess, AuthActions.loadFamilyMembers),
      withLatestFrom(this.store.select(selectFamily)),
      switchMap(([, family]) => {
        if (!family) return EMPTY;
        return from(
          this.supabase.client
            .from('profiles')
            .select('*')
            .eq('family_id', family.id),
        ).pipe(
          map(({ data }) =>
            AuthActions.loadFamilyMembersSuccess({ members: (data ?? []) as Profile[] }),
          ),
          catchError(() => of(AuthActions.loadFamilyMembersSuccess({ members: [] }))),
        );
      }),
    ),
  );

  loadFamilyInvites$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadFamilyInvites),
      withLatestFrom(this.store.select(selectFamily)),
      switchMap(([, family]) => {
        if (!family) return EMPTY;
        return from(
          this.supabase.client
            .from('family_invites')
            .select('*')
            .eq('family_id', family.id)
            .is('used_at', null)
            .order('created_at', { ascending: false }),
        ).pipe(
          map(({ data }) =>
            AuthActions.loadFamilyInvitesSuccess({ invites: (data ?? []) as FamilyInvite[] }),
          ),
          catchError(() => of(AuthActions.loadFamilyInvitesSuccess({ invites: [] }))),
        );
      }),
    ),
  );

  createFamily$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.createFamily),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([{ name }, user]) => {
        if (!user) return of(AuthActions.authError({ error: 'Not authenticated' }));
        const inviteCode = generateInviteCode();
        return from(
          this.supabase.client
            .from('families')
            .insert({ name, invite_code: inviteCode, created_by: user.id })
            .select()
            .single(),
        ).pipe(
          switchMap(({ data: family, error }) => {
            if (error || !family) return of(AuthActions.authError({ error: error?.message ?? 'Failed' }));
            return from(
              this.supabase.client
                .from('profiles')
                .update({ family_id: family.id, role: 'admin' })
                .eq('id', user.id),
            ).pipe(
              map(() => AuthActions.createFamilySuccess({ family: family as Family })),
            );
          }),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        );
      }),
    ),
  );

  joinFamilyByCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.joinFamilyByCode),
      withLatestFrom(this.store.select(selectUser)),
      switchMap(([{ code }, user]) => {
        if (!user) return of(AuthActions.authError({ error: 'Not authenticated' }));
        return from(
          this.supabase.client
            .from('families')
            .select('*')
            .eq('invite_code', code.toUpperCase())
            .single(),
        ).pipe(
          switchMap(({ data: family, error }) => {
            if (error || !family) return of(AuthActions.authError({ error: 'Invalid code. Please check and try again.' }));
            return from(
              this.supabase.client
                .from('profiles')
                .update({ family_id: family.id, role: 'member' })
                .eq('id', user.id),
            ).pipe(
              map(() => AuthActions.joinFamilyByCodeSuccess({ family: family as Family })),
            );
          }),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        );
      }),
    ),
  );

  inviteFamilyMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.inviteFamilyMember),
      withLatestFrom(this.store.select(selectFamily)),
      switchMap(([{ email }, family]) => {
        if (!family) return of(AuthActions.authError({ error: 'No family found' }));
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        return from(
          this.supabase.client
            .from('family_invites')
            .insert({ family_id: family.id, email, token, expires_at: expiresAt }),
        ).pipe(
          map(() => AuthActions.inviteFamilyMemberSuccess({ email })),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        );
      }),
    ),
  );

  inviteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.inviteFamilyMemberSuccess),
        tap(({ email }) => {
          this.toast.show(`Invite sent to ${email}`);
          this.store.dispatch(AuthActions.loadFamilyInvites());
        }),
      ),
    { dispatch: false },
  );

  removeFamilyMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.removeFamilyMember),
      switchMap(({ memberId }) =>
        from(
          this.supabase.client
            .from('profiles')
            .update({ family_id: null, role: 'member' })
            .eq('id', memberId),
        ).pipe(
          map(() => AuthActions.loadFamilyMembers()),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        ),
      ),
    ),
  );

  cancelFamilyInvite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.cancelFamilyInvite),
      switchMap(({ inviteId }) =>
        from(
          this.supabase.client
            .from('family_invites')
            .delete()
            .eq('id', inviteId),
        ).pipe(
          map(() => AuthActions.loadFamilyInvites()),
          catchError(err => of(AuthActions.authError({ error: err.message }))),
        ),
      ),
    ),
  );

  // ── Error toast ───────────────────────────────────────────────────────────

  authError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.authError),
        tap(({ error }) => this.toast.show(error)),
      ),
    { dispatch: false },
  );
}
