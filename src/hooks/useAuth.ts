import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, getAuthSessionId } from '../lib/supabase';
import { MFA_ENABLED } from '../lib/authConfig';
import { authMfa } from '../lib/authMfa';
import type { Profile } from '../types/user.types';
import { useAuthStore } from '../store/authStore';

let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return data as Profile;
};

const resolveVerifiedSession = async (
  session: Session | null,
  profile: Profile | null
): Promise<'fully_verified' | 'otp_pending' | 'password_verified' | 'signed_out'> => {
  if (!session || !profile) return 'signed_out';

  if (!MFA_ENABLED) {
    try {
      await authMfa.markSessionVerified();
    } catch {
      // In dev mode, the frontend still treats a valid password session as fully authenticated.
    }
    return 'fully_verified';
  }

  const { data, error } = await supabase.rpc('is_current_session_verified');
  if (!error && data === true) {
    return 'fully_verified';
  }

  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    const trustedDeviceToken = authMfa.getTrustedDeviceToken(profile.id);
    if (trustedDeviceToken) {
      try {
        const result = await authMfa.verifyTrustedDevice({ token: trustedDeviceToken });
        if (result.verified) return 'fully_verified';
      } catch {
        authMfa.clearTrustedDeviceToken(profile.id);
      }
    }
  }

  const sessionId = getAuthSessionId(session);
  if (sessionId && authMfa.getPendingLoginSessionId() === sessionId) {
    return 'otp_pending';
  }

  return 'password_verified';
};

const hydrateAuthState = async (session: Session | null) => {
  const state = useAuthStore.getState();

  if (!session?.user) {
    authMfa.setPendingLoginSessionId(null);
    state.hydrate({
      user: null,
      profile: null,
      session: null,
      authStage: 'signed_out',
      pendingLoginChallenge: null,
      loading: false,
    });
    return;
  }

  const profile = await fetchProfile(session.user.id);
  const authStage = await resolveVerifiedSession(session, profile);

  state.hydrate({
    user: session.user,
    session,
    profile,
    authStage,
    pendingLoginChallenge:
      authStage === 'fully_verified'
        ? null
        : state.pendingLoginChallenge && state.pendingLoginChallenge.email === session.user.email
        ? state.pendingLoginChallenge
        : profile
        ? {
            email: profile.email,
            role: profile.role,
          }
        : null,
    loading: false,
  });
};

const initializeAuth = async () => {
  if (authInitialized) return;
  authInitialized = true;

  useAuthStore.getState().setLoading(true);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await hydrateAuthState(session);

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
    await hydrateAuthState(nextSession);
  });
  authSubscription = subscription;
};

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    void initializeAuth();

    return () => {
      if (!authSubscription) return;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      return { error: authError, data: null };
    }

    const session = data.session;
    const user = data.user;
    if (!session || !user) {
      return { error: new Error('Missing session after sign in'), data: null };
    }

    const profile = await fetchProfile(user.id);
    const sessionId = getAuthSessionId(session);

    if (!MFA_ENABLED) {
      try {
        await authMfa.markSessionVerified();
      } catch (verificationError) {
        return {
          error:
            verificationError instanceof Error
              ? verificationError
              : new Error('Failed to mark this session as verified'),
          data: null,
        };
      }

      useAuthStore.getState().hydrate({
        user,
        profile,
        session,
        authStage: 'fully_verified',
        pendingLoginChallenge: null,
        loading: false,
      });

      return {
        error: null,
        data: {
          requiresOtp: false,
          isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
        },
      };
    }

    useAuthStore.getState().hydrate({
      user,
      profile,
      session,
      authStage: 'password_verified',
      pendingLoginChallenge: profile
        ? {
            email: profile.email,
            role: profile.role,
          }
        : null,
      loading: false,
    });

    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
      const trustedDeviceToken = authMfa.getTrustedDeviceToken(profile.id);
      if (trustedDeviceToken) {
        try {
          const trustedDeviceResult = await authMfa.verifyTrustedDevice({ token: trustedDeviceToken });
          if (trustedDeviceResult.verified) {
            authMfa.setPendingLoginSessionId(null);
            useAuthStore.getState().hydrate({
              authStage: 'fully_verified',
              pendingLoginChallenge: null,
            });
            return {
              error: null,
              data: {
                requiresOtp: false,
                isAdmin: false,
              },
            };
          }
        } catch {
          authMfa.clearTrustedDeviceToken(profile.id);
        }
      }
    }

    try {
      const otpChallenge = await authMfa.startLoginOtp();
      if (sessionId) authMfa.setPendingLoginSessionId(sessionId);
      useAuthStore.getState().hydrate({
        authStage: 'otp_pending',
        pendingLoginChallenge: {
          email: otpChallenge.email,
          role: profile?.role || otpChallenge.accountMode,
          challengeId: otpChallenge.challengeId,
          expiresAt: otpChallenge.expiresAt,
          resendAvailableAt: otpChallenge.resendAvailableAt,
          debugCode: otpChallenge.debugCode,
        },
      });
      return {
        error: null,
        data: {
          requiresOtp: true,
          isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin',
        },
      };
    } catch (otpError) {
      useAuthStore.getState().setAuthStage('password_verified');
      return {
        error: otpError instanceof Error ? otpError : new Error('Failed to start sign-in verification'),
        data: null,
      };
    }
  };

  const requestLoginOtp = async () => {
    const session = useAuthStore.getState().session;
    const profile = useAuthStore.getState().profile;

    const result = await authMfa.startLoginOtp();
    const sessionId = getAuthSessionId(session);
    if (sessionId) authMfa.setPendingLoginSessionId(sessionId);
    useAuthStore.getState().hydrate({
      authStage: 'otp_pending',
      pendingLoginChallenge: {
        email: result.email,
        role: profile?.role || result.accountMode,
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
        debugCode: result.debugCode,
      },
    });
    return result;
  };

  const verifyLoginOtp = async (code: string, rememberDevice = false) => {
    const result = await authMfa.verifyLoginOtp({ code, rememberDevice });
    const profile = useAuthStore.getState().profile;
    if (profile && result.trustedDeviceToken && result.trustedDeviceExpiresAt) {
      authMfa.saveTrustedDeviceToken(profile.id, result.trustedDeviceToken, result.trustedDeviceExpiresAt);
    }
    authMfa.setPendingLoginSessionId(null);
    useAuthStore.getState().hydrate({
      authStage: 'fully_verified',
      pendingLoginChallenge: null,
    });
    return result;
  };

  const signOut = async () => {
    authMfa.setPendingLoginSessionId(null);
    const { error } = await supabase.auth.signOut();
    useAuthStore.getState().reset();
    return { error };
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL || '/'}reset-password`,
    });
  };

  const refetchProfile = async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    const profile = await fetchProfile(userId);
    useAuthStore.getState().setProfile(profile);
    return profile;
  };

  return {
    user: store.user,
    profile: store.profile,
    session: store.session,
    loading: store.loading,
    isAdmin: store.profile?.role === 'admin' || store.profile?.role === 'super_admin',
    authStage: store.authStage,
    pendingLoginChallenge: store.pendingLoginChallenge,
    signIn,
    requestLoginOtp,
    verifyLoginOtp,
    signOut,
    resetPassword,
    refetchProfile,
  };
};
