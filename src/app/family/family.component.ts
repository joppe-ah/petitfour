import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../auth/store/auth.actions';
import {
  selectProfile,
  selectFamily,
  selectFamilyMembers,
  selectFamilyInvites,
  selectIsAdmin,
  selectHasFamily,
  selectUser,
} from '../auth/store/auth.selectors';
import { AvatarComponent } from '../shared/components/avatar/avatar.component';
import { Profile } from '../auth/models/profile.model';

type Tab = 'members' | 'invite' | 'settings';

@Component({
  selector: 'app-family',
  imports: [FormsModule, AvatarComponent],
  template: `
    <div class="min-h-full bg-pf-bg pb-24">

      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-[0.5px] border-pf-border">
        <h1 class="text-base font-[500] text-pf-text">Family</h1>
        @if (family(); as f) {
          <p class="text-xs text-pf-muted mt-0.5">{{ f.name }}</p>
        }
      </div>

      @if (!hasFamily()) {
        <!-- ── No family: Create or Join ───────────────────────────────── -->
        <div class="px-6 py-6 flex flex-col gap-4">
          <p class="text-sm text-pf-subtle">
            Join or create a family to share recipes and meal plans.
          </p>

          <!-- Create family card -->
          <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-5">
            <p class="text-sm font-[500] text-pf-text mb-1">Create a family</p>
            <p class="text-xs text-pf-muted mb-4">Start fresh and invite your family members.</p>
            <input
              [(ngModel)]="createFamilyName"
              placeholder="Family name (e.g. The Smiths)"
              class="w-full px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px]
                     text-sm focus:outline-none focus:border-[#1D9E75] transition-colors mb-3"
            />
            <button
              (click)="createFamily()"
              [disabled]="!createFamilyName.trim()"
              class="w-full py-2.5 bg-[#1D9E75] text-white text-sm font-[500] rounded-[8px]
                     hover:bg-[#178F68] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create family
            </button>
          </div>

          <!-- Join family card -->
          <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-5">
            <p class="text-sm font-[500] text-pf-text mb-1">Join with a code</p>
            <p class="text-xs text-pf-muted mb-4">Enter the 6-character code from a family admin.</p>
            <input
              [(ngModel)]="joinCode"
              placeholder="ABCD12"
              maxlength="6"
              class="w-full px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px]
                     text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-[#1D9E75]
                     transition-colors mb-3"
              (input)="joinCode = joinCode.toUpperCase()"
            />
            <button
              (click)="joinFamily()"
              [disabled]="joinCode.length !== 6"
              class="w-full py-2.5 border border-[0.5px] border-[#1D9E75] text-[#1D9E75] text-sm
                     font-[500] rounded-[8px] hover:bg-[#E1F5EE] dark:hover:bg-[#1D9E7522] transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join family
            </button>
          </div>
        </div>

      } @else {
        <!-- ── Tabs ─────────────────────────────────────────────────────── -->
        <div class="flex border-b border-[0.5px] border-pf-border px-6">
          @for (tab of visibleTabs(); track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="py-3 mr-5 text-sm border-b-2 transition-colors -mb-[0.5px]"
              [class]="activeTab() === tab.id
                ? 'border-[#1D9E75] text-pf-text font-[500]'
                : 'border-transparent text-pf-muted hover:text-pf-subtle'"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Members tab -->
        @if (activeTab() === 'members') {
          <div class="px-6 py-4 flex flex-col gap-3">
            @if (familyMembers().length === 0) {
              <p class="text-xs text-pf-muted py-8 text-center">No members yet. Invite your family!</p>
            }
            @for (member of familyMembers(); track member.id) {
              <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[12px] p-4
                          flex items-center gap-3">
                <pf-avatar [profile]="member" size="md" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="text-sm font-[500] text-pf-text truncate">{{ member.name }}</p>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-[500]"
                      [class]="member.role === 'admin'
                        ? 'bg-[#EEEDFE] text-[#3C3489]'
                        : 'bg-[#F1EFE8] text-[#444441]'"
                    >
                      {{ member.role === 'admin' ? 'Admin' : 'Member' }}
                    </span>
                  </div>
                  @if (member.dietary_preferences.length > 0) {
                    <div class="flex flex-wrap gap-1">
                      @for (d of member.dietary_preferences; track d) {
                        <span class="px-1.5 py-0.5 bg-pf-bg rounded-full text-[10px] text-pf-muted">{{ d }}</span>
                      }
                    </div>
                  }
                </div>
                @if (isAdmin() && member.id !== currentUserId()) {
                  <button
                    (click)="confirmRemove(member)"
                    class="text-xs text-pf-muted hover:text-[#D85A30] transition-colors flex-shrink-0"
                  >Remove</button>
                }
              </div>
            }

            @if (memberToRemove(); as m) {
              <div class="fixed inset-0 bg-black/40 flex items-end justify-center z-50 pb-8 px-6">
                <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[16px] p-6 w-full max-w-[400px]">
                  <p class="text-sm font-[500] text-pf-text mb-1">Remove {{ m.name }}?</p>
                  <p class="text-xs text-pf-muted mb-4">
                    They will lose access to the family's shared recipes and meal plans.
                  </p>
                  <div class="flex gap-2">
                    <button (click)="removeMember(m.id)"
                      class="flex-1 py-2.5 bg-[#D85A30] text-white text-sm rounded-[8px]">Remove</button>
                    <button (click)="memberToRemove.set(null)"
                      class="flex-1 py-2.5 border border-[0.5px] border-pf-border text-sm text-pf-subtle rounded-[8px]">Cancel</button>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Invite tab (admin only) -->
        @if (activeTab() === 'invite') {
          <div class="px-6 py-4 flex flex-col gap-5">

            <!-- Family code -->
            <div>
              <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">Family code</p>
              <div class="flex items-center gap-3">
                <div class="bg-[#fafaf9] dark:bg-[#1c1c1c] border border-[0.5px] border-pf-border
                            rounded-[8px] px-5 py-3 font-mono text-2xl tracking-[0.2em] text-pf-text select-all">
                  {{ family()?.invite_code }}
                </div>
                <button
                  (click)="copyCode()"
                  class="px-3 py-2 border border-[0.5px] border-pf-border rounded-[8px] text-xs
                         text-pf-subtle hover:text-pf-text transition-colors"
                >{{ codeCopied() ? '✓ Copied' : 'Copy' }}</button>
              </div>
              <p class="text-xs text-pf-muted mt-2">
                Share this code so family members can join from the Family page.
              </p>
            </div>

            <!-- Email invite -->
            <div>
              <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">Invite by email</p>
              <div class="flex gap-2">
                <input
                  [(ngModel)]="inviteEmail"
                  type="email"
                  placeholder="family@example.com"
                  class="flex-1 px-3 py-2.5 bg-pf-bg border border-[0.5px] border-pf-border rounded-[8px]
                         text-sm focus:outline-none focus:border-[#1D9E75] transition-colors"
                />
                <button
                  (click)="sendInvite()"
                  [disabled]="!inviteEmail.trim()"
                  class="px-4 py-2.5 bg-[#1D9E75] text-white text-sm rounded-[8px]
                         disabled:opacity-40 disabled:cursor-not-allowed"
                >Send</button>
              </div>
            </div>

            <!-- Pending invites -->
            @if (familyInvites().length > 0) {
              <div>
                <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-3">Pending invites</p>
                @for (invite of familyInvites(); track invite.id) {
                  <div class="flex items-center gap-3 py-3 border-b border-[0.5px] border-pf-border last:border-0">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-pf-text truncate">{{ invite.email }}</p>
                      <p class="text-[11px] text-pf-muted mt-0.5">Expires {{ formatExpiry(invite.expires_at) }}</p>
                    </div>
                    <button (click)="resendInvite(invite.email)"
                      class="text-xs text-pf-subtle hover:text-pf-text transition-colors mr-2">Resend</button>
                    <button (click)="cancelInvite(invite.id)"
                      class="text-xs text-pf-muted hover:text-[#D85A30] transition-colors">Cancel</button>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Settings tab -->
        @if (activeTab() === 'settings') {
          <div class="px-6 py-4 flex flex-col gap-5">

            @if (isAdmin()) {
              <div>
                <p class="text-[11px] font-[500] text-pf-muted uppercase tracking-wider mb-2">Family name</p>
                @if (!editingFamilyName()) {
                  <div class="flex items-center gap-2">
                    <p class="text-sm text-pf-text">{{ family()?.name }}</p>
                    <button (click)="startEditFamilyName()" class="text-xs text-pf-muted hover:text-pf-subtle">✎</button>
                  </div>
                } @else {
                  <div class="flex gap-2">
                    <input
                      [(ngModel)]="newFamilyName"
                      class="flex-1 px-3 py-2 bg-pf-bg border border-[0.5px] border-[#1D9E75]
                             rounded-[8px] text-sm focus:outline-none"
                    />
                    <button (click)="saveFamilyName()"
                      class="px-3 py-2 bg-[#1D9E75] text-white text-xs rounded-[8px]">Save</button>
                    <button (click)="editingFamilyName.set(false)"
                      class="px-3 py-2 border border-[0.5px] border-pf-border text-xs text-pf-subtle rounded-[8px]">Cancel</button>
                  </div>
                }
              </div>
            }

            @if (!isAdmin()) {
              <div>
                @if (!confirmLeave()) {
                  <button (click)="confirmLeave.set(true)"
                    class="w-full py-2.5 border border-[0.5px] border-pf-border rounded-[8px]
                           text-sm text-pf-subtle hover:border-[#D85A30] hover:text-[#D85A30] transition-colors">
                    Leave family
                  </button>
                } @else {
                  <div class="bg-pf-surface border border-[0.5px] border-pf-border rounded-[10px] p-4">
                    <p class="text-sm text-pf-text mb-3">Leave {{ family()?.name }}?</p>
                    <div class="flex gap-2">
                      <button (click)="leaveFamily()"
                        class="flex-1 py-2 bg-[#D85A30] text-white text-sm rounded-[8px]">Leave</button>
                      <button (click)="confirmLeave.set(false)"
                        class="flex-1 py-2 border border-[0.5px] border-pf-border text-sm text-pf-subtle rounded-[8px]">Cancel</button>
                    </div>
                  </div>
                }
              </div>
            }

            @if (isAdmin()) {
              <div class="pt-4 border-t border-[0.5px] border-pf-border">
                @if (!confirmDelete()) {
                  <button (click)="confirmDelete.set(true)"
                    class="text-sm text-pf-muted hover:text-[#D85A30] transition-colors">
                    Delete family…
                  </button>
                } @else {
                  <div class="bg-pf-surface border border-[0.5px] border-[#D85A30] rounded-[10px] p-4">
                    <p class="text-sm font-[500] text-pf-text mb-1">Delete family?</p>
                    <p class="text-xs text-pf-muted mb-4">
                      All members will be removed. Recipes and meal plans are not deleted.
                    </p>
                    <div class="flex gap-2">
                      <button (click)="deleteFamily()"
                        class="flex-1 py-2 bg-[#D85A30] text-white text-sm rounded-[8px]">Delete</button>
                      <button (click)="confirmDelete.set(false)"
                        class="flex-1 py-2 border border-[0.5px] border-pf-border text-sm text-pf-subtle rounded-[8px]">Cancel</button>
                    </div>
                  </div>
                }
              </div>
            }

          </div>
        }

      }
    </div>
  `,
})
export class FamilyComponent implements OnInit {
  private store = inject(Store);

  profile = this.store.selectSignal(selectProfile);
  family = this.store.selectSignal(selectFamily);
  familyMembers = this.store.selectSignal(selectFamilyMembers);
  familyInvites = this.store.selectSignal(selectFamilyInvites);
  isAdmin = this.store.selectSignal(selectIsAdmin);
  hasFamily = this.store.selectSignal(selectHasFamily);
  private user = this.store.selectSignal(selectUser);

  currentUserId = computed(() => this.user()?.id ?? '');

  activeTab = signal<Tab>('members');
  createFamilyName = '';
  joinCode = '';
  inviteEmail = '';
  codeCopied = signal(false);
  memberToRemove = signal<Profile | null>(null);
  editingFamilyName = signal(false);
  newFamilyName = '';
  confirmLeave = signal(false);
  confirmDelete = signal(false);

  visibleTabs = computed(() => {
    const all = [
      { id: 'members' as Tab, label: 'Members' },
      { id: 'invite' as Tab, label: 'Invite' },
      { id: 'settings' as Tab, label: 'Settings' },
    ];
    return this.isAdmin() ? all : all.filter(t => t.id !== 'invite');
  });

  ngOnInit(): void {
    if (this.hasFamily()) {
      this.store.dispatch(AuthActions.loadFamilyMembers());
      if (this.isAdmin()) this.store.dispatch(AuthActions.loadFamilyInvites());
    }
  }

  createFamily(): void {
    const name = this.createFamilyName.trim();
    if (!name) return;
    this.store.dispatch(AuthActions.createFamily({ name }));
    this.createFamilyName = '';
  }

  joinFamily(): void {
    if (this.joinCode.length !== 6) return;
    this.store.dispatch(AuthActions.joinFamilyByCode({ code: this.joinCode }));
    this.joinCode = '';
  }

  copyCode(): void {
    const code = this.family()?.invite_code;
    if (code) navigator.clipboard.writeText(code);
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 2000);
  }

  sendInvite(): void {
    const email = this.inviteEmail.trim();
    if (!email) return;
    this.store.dispatch(AuthActions.inviteFamilyMember({ email }));
    this.inviteEmail = '';
  }

  resendInvite(email: string): void {
    this.store.dispatch(AuthActions.inviteFamilyMember({ email }));
  }

  cancelInvite(inviteId: string): void {
    this.store.dispatch(AuthActions.cancelFamilyInvite({ inviteId }));
  }

  confirmRemove(member: Profile): void {
    this.memberToRemove.set(member);
  }

  removeMember(memberId: string): void {
    this.store.dispatch(AuthActions.removeFamilyMember({ memberId }));
    this.memberToRemove.set(null);
  }

  startEditFamilyName(): void {
    this.newFamilyName = this.family()?.name ?? '';
    this.editingFamilyName.set(true);
  }

  saveFamilyName(): void {
    // Note: Family name update requires a dedicated DB effect (future work)
    this.editingFamilyName.set(false);
  }

  leaveFamily(): void {
    const userId = this.currentUserId();
    if (userId) this.store.dispatch(AuthActions.removeFamilyMember({ memberId: userId }));
  }

  deleteFamily(): void {
    this.leaveFamily();
    this.confirmDelete.set(false);
  }

  formatExpiry(expiresAt: string): string {
    const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return `in ${diffDays} days`;
  }
}
