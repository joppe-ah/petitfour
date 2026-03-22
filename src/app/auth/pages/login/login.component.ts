import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth.actions';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-pf-bg flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-[400px]">

        <!-- Logo -->
        <div class="text-center mb-8">
          <p class="text-lg text-pf-text tracking-tight">
            PetitFour <span class="text-pf-muted">✦</span>
          </p>
        </div>

        <!-- Card -->
        <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-8">
          <h1 class="text-base font-[500] text-pf-text text-center mb-1">
            Welcome to PetitFour
          </h1>
          <p class="text-xs text-pf-muted text-center mb-6">
            Sign in to access your family app
          </p>

          @if (!magicLinkSent()) {

            <!-- Email input -->
            <input
              [(ngModel)]="email"
              type="email"
              placeholder="your@email.com"
              (keydown.enter)="sendMagicLink()"
              class="w-full px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px]
                     text-sm text-pf-text placeholder:text-pf-muted focus:outline-none
                     focus:border-[#1D9E75] transition-colors mb-3"
            />

            <!-- Magic link button -->
            <button
              (click)="sendMagicLink()"
              [disabled]="!email.trim() || sending()"
              class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]
                     hover:bg-[#178F68] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            >
              {{ sending() ? 'Sending…' : 'Send magic link' }}
            </button>

            <!-- Divider -->
            <div class="flex items-center gap-3 mb-5">
              <div class="flex-1 border-t border-[0.5px] border-pf-border"></div>
              <span class="text-[11px] text-pf-muted">or</span>
              <div class="flex-1 border-t border-[0.5px] border-pf-border"></div>
            </div>

            <!-- Google button -->
            <button
              (click)="signInWithGoogle()"
              class="w-full py-2.5 bg-pf-surface border border-[0.5px] border-pf-border rounded-[8px]
                     text-sm text-pf-text hover:bg-pf-bg transition-colors flex items-center justify-center gap-2.5"
            >
              <!-- Google G icon -->
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.20c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

          } @else {

            <!-- Success state -->
            <div class="flex flex-col items-center gap-3 py-4">
              <div class="w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center">
                <span class="text-lg">✉️</span>
              </div>
              <p class="text-sm font-[500] text-pf-text text-center">
                Check your email for a sign in link
              </p>
              <p class="text-xs text-pf-muted text-center">
                We sent a magic link to <strong class="text-pf-text">{{ email }}</strong>
              </p>
              <button
                (click)="magicLinkSent.set(false)"
                class="mt-2 text-xs text-pf-subtle hover:text-pf-text transition-colors"
              >
                Use a different email
              </button>
            </div>

          }
        </div>

      </div>
    </div>
  `,
})
export class LoginComponent {
  private store = inject(Store);
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  email = '';
  sending = signal(false);
  magicLinkSent = signal(false);

  sendMagicLink(): void {
    if (!this.email.trim()) return;
    this.sending.set(true);
    this.supabase.client.auth
      .signInWithOtp({
        email: this.email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      .then(({ error }) => {
        this.sending.set(false);
        if (error) {
          const msg = error.status === 429
            ? 'Too many attempts. Please wait a few minutes and try again.'
            : error.message;
          this.toast.show(msg);
        } else {
          this.magicLinkSent.set(true);
        }
      });
  }

  signInWithGoogle(): void {
    this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
}
