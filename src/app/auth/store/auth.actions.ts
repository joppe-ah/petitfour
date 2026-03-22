import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';
import { Family, FamilyInvite } from '../models/family.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Init Auth':                       emptyProps(),
    'Init Auth Success':               props<{ user: User }>(),
    'Init Auth Failure':               emptyProps(),

    'Sign In With Magic Link':         props<{ email: string }>(),
    'Sign In With Google':             emptyProps(),
    'Sign Out':                        emptyProps(),
    'Sign Out Success':                emptyProps(),

    'Set New User':                    emptyProps(),
    'Load Profile':                    emptyProps(),
    'Load Profile Success':            props<{ profile: Profile }>(),
    'Save Profile':                    props<{ profile: Partial<Profile> }>(),
    'Save Profile Success':            props<{ profile: Profile }>(),

    'Load Family':                     emptyProps(),
    'Load Family Success':             props<{ family: Family }>(),
    'Create Family':                   props<{ name: string }>(),
    'Create Family Success':           props<{ family: Family }>(),
    'Join Family By Code':             props<{ code: string }>(),
    'Join Family By Code Success':     props<{ family: Family }>(),
    'Join Family By Invite':           props<{ token: string }>(),
    'Invite Family Member':            props<{ email: string }>(),
    'Invite Family Member Success':    props<{ email: string }>(),
    'Load Family Members':             emptyProps(),
    'Load Family Members Success':     props<{ members: Profile[] }>(),
    'Remove Family Member':            props<{ memberId: string }>(),
    'Load Family Invites':             emptyProps(),
    'Load Family Invites Success':     props<{ invites: FamilyInvite[] }>(),
    'Cancel Family Invite':            props<{ inviteId: string }>(),

    'Auth Error':                      props<{ error: string }>(),
  },
});
