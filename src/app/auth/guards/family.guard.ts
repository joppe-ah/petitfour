import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { selectAuthInitialized, selectHasFamily } from '../store/auth.selectors';

export const familyGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectAuthInitialized),
    store.select(selectHasFamily),
  ]).pipe(
    filter(([initialized]) => initialized),
    take(1),
    map(([, hasFamily]) =>
      hasFamily ? true : router.createUrlTree(['/family']),
    ),
  );
};
