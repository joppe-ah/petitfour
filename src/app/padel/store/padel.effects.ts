import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AuthActions } from '../../auth/store/auth.actions';
import { selectProfile, selectUser } from '../../auth/store/auth.selectors';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PadelSupabaseService } from '../services/padel-supabase.service';
import { PadelActions } from './padel.actions';

export class PadelEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private service = inject(PadelSupabaseService);
  private toast = inject(ToastService);
  private errorHandler = inject(ErrorHandlerService);

  // ── Load on auth ────────────────────────────────────────────

  loadPadelDataOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadProfileSuccess),
      switchMap(({ profile }) => {
        if (!profile.family_id) {
          return of(PadelActions.loadPadelDataSuccess({ players: [], matches: [] }));
        }
        return this.service.loadPlayers(profile.family_id).pipe(
          switchMap((players) =>
            this.service.loadMatches(profile.family_id!).pipe(
              map((matches) => PadelActions.loadPadelDataSuccess({ players, matches })),
            ),
          ),
          catchError((err) =>
            of(PadelActions.loadPadelDataFailure({ error: this.errorHandler.handleSupabaseError(err) })),
          ),
        );
      }),
    ),
  );

  loadPadelData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PadelActions.loadPadelData),
      withLatestFrom(this.store.select(selectProfile)),
      switchMap(([, profile]) => {
        if (!profile?.family_id) {
          return of(PadelActions.loadPadelDataSuccess({ players: [], matches: [] }));
        }
        return this.service.loadPlayers(profile.family_id).pipe(
          switchMap((players) =>
            this.service.loadMatches(profile.family_id!).pipe(
              map((matches) => PadelActions.loadPadelDataSuccess({ players, matches })),
            ),
          ),
          catchError((err) =>
            of(PadelActions.loadPadelDataFailure({ error: this.errorHandler.handleSupabaseError(err) })),
          ),
        );
      }),
    ),
  );

  // ── Add match ────────────────────────────────────────────────

  addMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PadelActions.addMatch),
      withLatestFrom(this.store.select(selectProfile), this.store.select(selectUser)),
      switchMap(([{ match }, profile, user]) => {
        if (!profile?.family_id || !user?.id) return EMPTY;
        return this.service.saveMatch(match, profile.family_id, user.id).pipe(
          map((saved) => PadelActions.addMatchSuccess({ match: saved })),
          catchError((err) => {
            this.toast.show(this.errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  );

  // ── Delete match ─────────────────────────────────────────────

  deleteMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PadelActions.deleteMatch),
      switchMap(({ id }) =>
        this.service.deleteMatch(id).pipe(
          map(() => PadelActions.deleteMatchSuccess({ id })),
          catchError((err) => {
            this.toast.show(this.errorHandler.handleSupabaseError(err));
            return of(PadelActions.deleteMatchSuccess({ id })); // optimistic
          }),
        ),
      ),
    ),
  );

  // ── Add player ───────────────────────────────────────────────

  addPlayer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PadelActions.addPlayer),
      withLatestFrom(this.store.select(selectProfile), this.store.select(selectUser)),
      switchMap(([{ player }, profile, user]) => {
        if (!profile?.family_id || !user?.id) return EMPTY;
        return this.service.savePlayer(player, profile.family_id, user.id).pipe(
          map((saved) => PadelActions.addPlayerSuccess({ player: saved })),
          catchError((err) => {
            this.toast.show(this.errorHandler.handleSupabaseError(err));
            return EMPTY;
          }),
        );
      }),
    ),
  );
}
