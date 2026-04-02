import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VerificationState {
  verifiedUntilByPolicy: Record<string, string>;
  pendingByState: Record<string, string>;
  markVerified: (policyId: string, expiresAt: string) => void;
  registerPendingState: (state: string, policyId: string) => void;
  consumePendingState: (state: string) => string | null;
  isVerified: (policyId: string) => boolean;
  clearExpired: () => void;
  clearAll: () => void;
}

const isNotExpired = (dateIso?: string) => {
  if (!dateIso) return false;
  const expires = new Date(dateIso).getTime();
  if (Number.isNaN(expires)) return false;
  return expires > Date.now();
};

export const useVerificationStore = create<VerificationState>()(
  persist(
    (set, get) => ({
      verifiedUntilByPolicy: {},
      pendingByState: {},
      markVerified: (policyId, expiresAt) =>
        set((state) => ({
          verifiedUntilByPolicy: {
            ...state.verifiedUntilByPolicy,
            [policyId]: expiresAt,
          },
        })),
      registerPendingState: (stateToken, policyId) =>
        set((state) => ({
          pendingByState: {
            ...state.pendingByState,
            [stateToken]: policyId,
          },
        })),
      consumePendingState: (stateToken) => {
        const policyId = get().pendingByState[stateToken] || null;
        if (!policyId) return null;

        set((state) => {
          const next = { ...state.pendingByState };
          delete next[stateToken];
          return { pendingByState: next };
        });

        return policyId;
      },
      isVerified: (policyId) => isNotExpired(get().verifiedUntilByPolicy[policyId]),
      clearExpired: () =>
        set((state) => {
          const next = Object.fromEntries(
            Object.entries(state.verifiedUntilByPolicy).filter(([, value]) => isNotExpired(value))
          );
          return { verifiedUntilByPolicy: next };
        }),
      clearAll: () => set({ verifiedUntilByPolicy: {}, pendingByState: {} }),
    }),
    {
      name: 'civicus-verification',
      partialize: (state) => ({
        verifiedUntilByPolicy: state.verifiedUntilByPolicy,
        pendingByState: state.pendingByState,
      }),
    }
  )
);
