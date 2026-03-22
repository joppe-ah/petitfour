import { User } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';
import { Family, FamilyInvite } from '../models/family.model';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  family: Family | null;
  familyMembers: Profile[];
  familyInvites: FamilyInvite[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  authInitialized: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  profile: null,
  family: null,
  familyMembers: [],
  familyInvites: [],
  loading: false,
  error: null,
  isAuthenticated: false,
  isNewUser: false,
  authInitialized: false,
};
