import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types/user.types';
import type { AuthStage, PendingLoginChallenge } from '../types/auth.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  authStage: AuthStage;
  pendingLoginChallenge: PendingLoginChallenge | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthStage: (authStage: AuthStage) => void;
  setPendingLoginChallenge: (challenge: PendingLoginChallenge | null) => void;
  hydrate: (payload: Partial<Pick<AuthState, 'user' | 'profile' | 'session' | 'loading' | 'authStage' | 'pendingLoginChallenge'>>) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  authStage: 'signed_out' as AuthStage,
  pendingLoginChallenge: null,
};

export const useAuthStore = create<AuthState>()((set) => ({
  ...INITIAL_STATE,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setAuthStage: (authStage) => set({ authStage }),
  setPendingLoginChallenge: (pendingLoginChallenge) => set({ pendingLoginChallenge }),
  hydrate: (payload) => set(payload),
  reset: () => set({ ...INITIAL_STATE, loading: false }),
}));
