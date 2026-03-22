import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  handleSupabaseError(error: unknown): string {
    if (!error) return 'An unexpected error occurred';

    const err = error as { code?: string; message?: string; status?: number };

    if (err.code === 'PGRST116') return 'Item not found';
    if (err.code === '23505') return 'This item already exists';
    if (err.code === '42501') return "You don't have permission to do this";
    if (err.status === 401) return 'Session expired — please sign in again';
    if (err.status === 403) return "You don't have permission to do this";
    if (err.status === 404) return 'Item not found';
    if (err.status === 409) return 'This item already exists';
    if (err.status === 429) return 'Too many requests — please slow down';

    if (!navigator.onLine) return 'No internet connection';

    return err.message ?? 'An unexpected error occurred';
  }
}
