import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import AuthShell from '../../components/auth/AuthShell';
import { MFA_ENABLED } from '../../lib/authConfig';
import { authMfa } from '../../lib/authMfa';
import { DATA_PROVIDER } from '../../lib/supabase';
import type { AccountMode, OtpChallengeResponse } from '../../types/auth.types';
import { useAuth } from '../../hooks/useAuth';
import { useLanguageStore } from '../../store/languageStore';

type SignupStep = 'details' | 'otp' | 'complete' | 'success';

export default function Signup() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const [step, setStep] = useState<SignupStep>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AccountMode>('citizen');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [verificationToken, setVerificationToken] = useState('');

  const detailsSchema = useMemo(
    () =>
      z
        .object({
          mode: z.enum(['citizen', 'admin']),
          email: z.string().email(tx('Skriv en gyldig e-postadresse', 'Enter a valid email address')),
          inviteCode: z.string().optional(),
        })
        .superRefine((value, ctx) => {
          if (value.mode === 'admin' && (!value.inviteCode || value.inviteCode.trim().length < 4)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['inviteCode'],
              message: tx('Skriv inn en gyldig admin-invitasjon', 'Enter a valid admin invite code'),
            });
          }
        }),
    [tx]
  );

  const otpSchema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/, tx('Skriv inn den 6-sifrede koden', 'Enter the 6-digit code')),
      }),
    [tx]
  );

  const completeSchema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().min(2, tx('Navn ma vaere minst 2 tegn', 'Name must be at least 2 characters')),
          password: z.string().min(8, tx('Passordet ma vaere minst 8 tegn', 'Password must be at least 8 characters')),
          confirmPassword: z.string(),
        })
        .refine((value) => value.password === value.confirmPassword, {
          path: ['confirmPassword'],
          message: tx('Passordene matcher ikke', 'Passwords do not match'),
        }),
    [tx]
  );

  const handleStartSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = detailsSchema.safeParse({
      mode,
      email,
      inviteCode,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || tx('Sjekk feltene dine', 'Check your fields'));
      return;
    }

    setLoading(true);
    try {
      const response = await authMfa.startSignup({
        email,
        accountMode: mode,
        inviteCode: mode === 'admin' ? inviteCode.trim() : undefined,
      });
      setChallenge(response);
      setStep('otp');
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : tx('Kunne ikke starte registreringen', 'Could not start account creation')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = otpSchema.safeParse({ code: otpCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || tx('Skriv inn koden', 'Enter the code'));
      return;
    }

    setLoading(true);
    try {
      const response = await authMfa.verifySignupCode({
        email,
        code: otpCode,
        accountMode: mode,
      });
      setVerificationToken(response.verificationToken);
      setStep('complete');
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : tx('Kunne ikke bekrefte e-posten', 'Could not verify the email')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsed = completeSchema.safeParse({
      fullName,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || tx('Sjekk feltene dine', 'Check your fields'));
      return;
    }

    setLoading(true);
    try {
      await authMfa.completeSignup({
        email,
        accountMode: mode,
        verificationToken,
        fullName,
        password,
      });
      setStep('success');
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : tx('Kunne ikke opprette kontoen', 'Could not create the account')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const detailsParsed = detailsSchema.safeParse({
      mode,
      email,
      inviteCode,
    });
    if (!detailsParsed.success) {
      setError(detailsParsed.error.issues[0]?.message || tx('Sjekk feltene dine', 'Check your fields'));
      return;
    }

    const completeParsed = completeSchema.safeParse({
      fullName,
      password,
      confirmPassword,
    });
    if (!completeParsed.success) {
      setError(completeParsed.error.issues[0]?.message || tx('Sjekk feltene dine', 'Check your fields'));
      return;
    }

    setLoading(true);
    try {
      await authMfa.devSignup({
        email,
        accountMode: mode,
        inviteCode: mode === 'admin' ? inviteCode.trim() : undefined,
        fullName,
        password,
      });

      const result = await signIn(email, password);
      if (result.error) throw result.error;
      navigate(result.data?.isAdmin ? '/admin' : '/home', { replace: true });
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : tx('Kunne ikke opprette kontoen', 'Could not create the account')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await authMfa.startSignup({
        email,
        accountMode: mode,
        inviteCode: mode === 'admin' ? inviteCode.trim() : undefined,
      });
      setChallenge(response);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : tx('Kunne ikke sende ny kode', 'Could not resend the code')
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <AuthShell
        title={tx('Konto opprettet', 'Account created')}
        subtitle={tx(
          'E-posten din er bekreftet og kontoen er klar for innlogging.',
          'Your email has been verified and the account is ready to sign in.'
        )}
      >
        <button
          onClick={() => navigate('/login')}
          className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white"
        >
          {tx('Gaa til innlogging', 'Go to sign in')}
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={tx('Opprett konto', 'Create account')}
      subtitle={
        !MFA_ENABLED
          ? tx(
              'Velg kontotype og opprett kontoen direkte med e-post og passord.',
              'Choose an account type and create the account directly with email and password.'
            )
          : step === 'details'
          ? tx(
              'Velg kontotype og bekreft e-posten din for a komme i gang.',
              'Choose an account type and verify your email to get started.'
            )
          : step === 'otp'
          ? tx(
              'Skriv inn engangskoden vi sendte til e-posten din.',
              'Enter the one-time code we sent to your email.'
            )
          : tx(
              'Fullfor kontoen med navn og passord.',
              'Finish the account with your name and password.'
            )
      }
      footer={
        <>
          {tx('Har du allerede konto?', 'Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-[#1c6ea4] hover:underline">
            {tx('Logg inn', 'Sign in')}
          </Link>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!MFA_ENABLED ? (
        <form onSubmit={handleDirectSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['citizen', 'admin'] as AccountMode[]).map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    active
                      ? 'border-[#1c6ea4] bg-[#edf6ff] text-[#163650]'
                      : 'border-[#d8e0ee] bg-[#fbfcfe] text-[#5d6d83]'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {option === 'citizen' ? tx('Borger', 'Citizen') : tx('Admin', 'Admin')}
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    {option === 'citizen'
                      ? tx('Apen registrering', 'Open registration')
                      : tx('Krever invitasjonskode', 'Requires invite code')}
                  </p>
                </button>
              );
            })}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('E-post', 'Email')}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={tx('navn@kommune.no', 'name@city.gov')}
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          {mode === 'admin' ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
                {tx('Invitasjonskode', 'Invite code')}
              </label>
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ADMIN-INVITE"
                className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
              />
              <p className="mt-2 text-xs text-[#708099]">
                {tx(
                  'Admin-kontoer kan bare opprettes med en gyldig invitasjon.',
                  'Admin accounts can only be created with a valid invite.'
                )}
              </p>
            </div>
          ) : null}

          {DATA_PROVIDER === 'local' && mode === 'admin' ? (
            <p className="rounded-2xl border border-[#d8e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#4f607a]">
              {tx('Lokal testkode for admin: CIVICUS-ADMIN-ACCESS', 'Local admin invite code: CIVICUS-ADMIN-ACCESS')}
            </p>
          ) : null}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Fullt navn', 'Full name')}
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={tx('Ola Nordmann', 'Jane Doe')}
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Passord', 'Password')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Bekreft passord', 'Confirm password')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? tx('Oppretter konto...', 'Creating account...') : tx('Opprett konto', 'Create account')}
          </button>
        </form>
      ) : step === 'details' ? (
        <form onSubmit={handleStartSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['citizen', 'admin'] as AccountMode[]).map((option) => {
              const active = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                    active
                      ? 'border-[#1c6ea4] bg-[#edf6ff] text-[#163650]'
                      : 'border-[#d8e0ee] bg-[#fbfcfe] text-[#5d6d83]'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {option === 'citizen' ? tx('Borger', 'Citizen') : tx('Admin', 'Admin')}
                  </p>
                  <p className="mt-1 text-xs leading-5">
                    {option === 'citizen'
                      ? tx('Apen registrering', 'Open registration')
                      : tx('Krever invitasjonskode', 'Requires invite code')}
                  </p>
                </button>
              );
            })}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('E-post', 'Email')}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={tx('navn@kommune.no', 'name@city.gov')}
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          {mode === 'admin' ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
                {tx('Invitasjonskode', 'Invite code')}
              </label>
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ADMIN-INVITE"
                className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
              />
              <p className="mt-2 text-xs text-[#708099]">
                {tx(
                  'Admin-kontoer kan bare opprettes med en gyldig invitasjon.',
                  'Admin accounts can only be created with a valid invite.'
                )}
              </p>
            </div>
          ) : null}

          {DATA_PROVIDER === 'local' && mode === 'admin' ? (
            <p className="rounded-2xl border border-[#d8e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#4f607a]">
              {tx('Lokal testkode for admin: CIVICUS-ADMIN-ACCESS', 'Local admin invite code: CIVICUS-ADMIN-ACCESS')}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? tx('Sender kode...', 'Sending code...') : tx('Fortsett med e-postkode', 'Continue with email code')}
          </button>
        </form>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-2xl border border-[#d8e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#4f607a]">
            <p className="font-medium text-[#24354c]">{email}</p>
            <p className="mt-1">{tx('Koden utloper etter 10 minutter.', 'The code expires after 10 minutes.')}</p>
            {DATA_PROVIDER === 'local' && challenge?.debugCode ? (
              <p className="mt-2 font-medium text-[#1c6ea4]">
                {tx('Lokal testkode:', 'Local test code:')} {challenge.debugCode}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Engangskode', 'One-time code')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder="123456"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-lg tracking-[0.22em] text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? tx('Bekrefter...', 'Verifying...') : tx('Bekreft e-post', 'Verify email')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full text-sm font-medium text-[#1c6ea4] hover:underline disabled:opacity-60"
          >
            {tx('Send ny kode', 'Send a new code')}
          </button>
        </form>
      ) : null}

      {step === 'complete' ? (
        <form onSubmit={handleCompleteSignup} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Fullt navn', 'Full name')}
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={tx('Ola Nordmann', 'Jane Doe')}
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Passord', 'Password')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
              {tx('Bekreft passord', 'Confirm password')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? tx('Oppretter konto...', 'Creating account...') : tx('Opprett konto', 'Create account')}
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}
