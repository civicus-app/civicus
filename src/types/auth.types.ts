export type AccountMode = 'citizen' | 'admin';
export type OtpPurpose = 'signup' | 'login';
export type AuthStage = 'signed_out' | 'password_verified' | 'otp_pending' | 'fully_verified';
export type AuthChallengeStatus = 'pending' | 'verified' | 'completed' | 'expired' | 'cancelled';
export type VerifiedSessionSource = 'otp' | 'trusted_device';

export interface AdminInvite {
  id: string;
  email?: string | null;
  expires_at: string;
  used_at?: string | null;
  used_by?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthChallenge {
  id: string;
  email: string;
  user_id?: string | null;
  purpose: OtpPurpose;
  account_mode: AccountMode;
  invite_id?: string | null;
  status: AuthChallengeStatus;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  resend_available_at: string;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustedDevice {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerifiedSession {
  id: string;
  user_id: string;
  session_id: string;
  role: AccountMode | 'super_admin';
  source: VerifiedSessionSource;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface OtpChallengeResponse {
  challengeId: string;
  email: string;
  accountMode: AccountMode;
  expiresAt: string;
  resendAvailableAt: string;
  debugCode?: string;
}

export interface VerifiedSignupResponse {
  verificationToken: string;
  email: string;
  accountMode: AccountMode;
}

export interface CompleteSignupInput {
  email: string;
  accountMode: AccountMode;
  verificationToken: string;
  fullName: string;
  password: string;
}

export interface PendingLoginChallenge {
  email: string;
  role: AccountMode | 'super_admin';
  challengeId?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
  debugCode?: string;
}

export interface VerifyLoginOtpResponse {
  verified: boolean;
  role: AccountMode | 'super_admin';
  trustedDeviceToken?: string;
  trustedDeviceExpiresAt?: string;
}

export interface VerifyTrustedDeviceResponse {
  verified: boolean;
  role: AccountMode | 'super_admin';
}
