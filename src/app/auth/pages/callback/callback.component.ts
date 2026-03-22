import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AuthActions } from '../../store/auth.actions';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="min-h-screen bg-pf-bg flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-pf-muted">Signing you in…</p>
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private store = inject(Store);
  private router = inject(Router);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.supabase.client.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        this.toast.show('Sign in failed. Please try again.');
        this.router.navigate(['/auth/login']);
      } else {
        this.store.dispatch(AuthActions.initAuthSuccess({ user: session.user }));
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
