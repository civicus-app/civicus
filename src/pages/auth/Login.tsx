import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DATA_PROVIDER } from '../../lib/supabase';
import { MFA_ENABLED } from '../../lib/authConfig';
import AuthShell from '../../components/auth/AuthShell';
import { useAuth } from '../../hooks/useAuth';
import { useLanguageStore } from '../../store/languageStore';

type LoginForm = {
  email: string;
  password: string;
};

type OtpForm = {
  code: string;
};

export default function Login() {
  const {
    user,
    profile,
    authStage,
    isAdmin,
    pendingLoginChallenge,
    signIn,
    requestLoginOtp,
    verifyLoginOtp,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(tx('Skriv en gyldig e-postadresse', 'Enter a valid email address')),
        password: z.string().min(6, tx('Passordet ma vaere minst 6 tegn', 'Password must be at least 6 characters')),
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

  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [autoOtpRequested, setAutoOtpRequested] = useState(false);

  const requestedFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const requestedTarget =
    requestedFrom && requestedFrom !== '/' && requestedFrom !== '/login' ? requestedFrom : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: profile?.email || '',
      password: '',
    },
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (profile?.email) {
      setValue('email', profile.email);
    }
  }, [profile?.email, setValue]);

  useEffect(() => {
    if (!user || authStage !== 'fully_verified') return;
    navigate(requestedTarget || (isAdmin ? '/admin' : '/home'), { replace: true });
  }, [authStage, isAdmin, navigate, requestedTarget, user]);

  useEffect(() => {
    if (!MFA_ENABLED) return;
    if (!user || authStage !== 'password_verified' || autoOtpRequested) return;

    setAutoOtpRequested(true);
    setOtpError('');
    void requestLoginOtp().catch((requestError) => {
      setOtpError(
        requestError instanceof Error
          ? requestError.message
          : tx('Kunne ikke sende verifiseringskoden', 'Could not send the verification code')
      );
    });
  }, [authStage, autoOtpRequested, requestLoginOtp, tx, user]);

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setOtpError('');
    setLoading(true);
    setAutoOtpRequested(MFA_ENABLED);

    try {
      const result = await signIn(data.email, data.password);
      if (result.error) throw result.error;
      if (!result.data?.requiresOtp) {
        navigate(requestedTarget || (result.data?.isAdmin ? '/admin' : '/home'), { replace: true });
      }
    } catch (signInError) {
      setAutoOtpRequested(false);
      setError(
        signInError instanceof Error ? signInError.message : tx('Innlogging feilet', 'Sign in failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpForm) => {
    setOtpError('');
    setOtpLoading(true);

    try {
      await verifyLoginOtp(data.code, rememberDevice);
      navigate(requestedTarget || (isAdmin ? '/admin' : '/home'), { replace: true });
    } catch (verificationError) {
      setOtpError(
        verificationError instanceof Error
          ? verificationError.message
          : tx('Kunne ikke bekrefte koden', 'Could not verify the code')
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpError('');
    setOtpLoading(true);
    try {
      await requestLoginOtp();
    } catch (requestError) {
      setOtpError(
        requestError instanceof Error
          ? requestError.message
          : tx('Kunne ikke sende ny kode', 'Could not resend the code')
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    await signOut();
    setAutoOtpRequested(false);
    setRememberDevice(true);
    setError('');
    setOtpError('');
  };

  const showOtpStep = MFA_ENABLED && !!user && authStage !== 'signed_out' && authStage !== 'fully_verified';
  const canTrustDevice =
    pendingLoginChallenge?.role === 'citizen' || pendingLoginChallenge?.role === 'super_admin' ? pendingLoginChallenge?.role === 'citizen' : profile?.role === 'citizen';

  return (
    <AuthShell
      title={showOtpStep ? tx('Bekreft innlogging', 'Verify sign in') : tx('Logg inn', 'Sign in')}
      subtitle={
        showOtpStep
          ? tx(
              'Skriv inn koden vi sendte til e-posten din for a fullfore innloggingen.',
              'Enter the code we sent to your email to finish signing in.'
            )
          : MFA_ENABLED
          ? tx('Logg inn for a fortsette i CIVICUS.', 'Sign in to continue in CIVICUS.')
          : tx(
              'Logg inn med e-post og passord for a fortsette i CIVICUS.',
              'Sign in with your email and password to continue in CIVICUS.'
            )
      }
      footer={
        showOtpStep ? (
          <button onClick={handleUseAnotherAccount} className="font-medium text-[#1c6ea4] hover:underline">
            {tx('Bruk en annen konto', 'Use another account')}
          </button>
        ) : (
          <>
            {tx('Har du ikke konto?', "Don't have an account?")}{' '}
            <Link to="/signup" className="font-medium text-[#1c6ea4] hover:underline">
              {tx('Opprett konto', 'Create account')}
            </Link>
          </>
        )
      }
    >
      {showOtpStep ? (
        <form onSubmit={handleSubmitOtp(onVerifyOtp)} className="space-y-4">
          {otpError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {otpError}
            </p>
          ) : null}

          <div className="rounded-2xl border border-[#d8e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#4f607a]">
            <p className="font-medium text-[#24354c]">{profile?.email || pendingLoginChallenge?.email}</p>
            <p className="mt-1">
              {tx(
                'Koden utloper etter 10 minutter.',
                'The code expires after 10 minutes.'
              )}
            </p>
            {DATA_PROVIDER === 'local' && pendingLoginChallenge?.debugCode ? (
              <p className="mt-2 font-medium text-[#1c6ea4]">
                {tx('Lokal testkode:', 'Local test code:')} {pendingLoginChallenge.debugCode}
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
              {...registerOtp('code')}
              placeholder="123456"
              className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-lg tracking-[0.22em] text-[#1d293d] outline-none focus:border-[#1c6ea4]"
            />
            {otpErrors.code ? <p className="mt-2 text-sm text-red-600">{otpErrors.code.message}</p> : null}
          </div>

          {canTrustDevice ? (
            <label className="flex items-start gap-3 rounded-2xl border border-[#d8e0ee] bg-[#fbfcfe] px-4 py-3 text-sm text-[#526277]">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#bfd0e4] text-[#1c6ea4] focus:ring-[#1c6ea4]"
              />
              <span>{tx('Husk denne enheten i 30 dager', 'Trust this device for 30 days')}</span>
            </label>
          ) : null}

          <button
            type="submit"
            disabled={otpLoading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {otpLoading ? tx('Bekrefter...', 'Verifying...') : tx('Bekreft og fortsett', 'Verify and continue')}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={otpLoading}
            className="w-full text-sm font-medium text-[#1c6ea4] hover:underline disabled:opacity-60"
          >
            {tx('Send ny kode', 'Send a new code')}
          </button>
        </form>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {DATA_PROVIDER === 'local' ? (
              <div className="rounded-2xl border border-[#d8e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#4f607a]">
                <p className="font-medium text-[#24354c]">{tx('Lokale demo-brukere', 'Local demo users')}</p>
                <p className="mt-1">admin@civicus.local / admin12345</p>
                <p>citizen@civicus.local / citizen12345</p>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
                {tx('E-post', 'Email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder={tx('navn@kommune.no', 'name@city.gov')}
                className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
              />
              {errors.email ? <p className="mt-2 text-sm text-red-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[#8694a9]">
                {tx('Passord', 'Password')}
              </label>
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••"
                className="h-14 w-full rounded-2xl border border-[#d6dfec] bg-[#f9fbff] px-4 text-base text-[#1d293d] outline-none focus:border-[#1c6ea4]"
              />
              {errors.password ? <p className="mt-2 text-sm text-red-600">{errors.password.message}</p> : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
            >
              {loading ? tx('Logger inn...', 'Signing in...') : tx('Fortsett', 'Continue')}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            <Link to="/reset-password" className="font-medium text-[#1c6ea4] hover:underline">
              {tx('Glemt passord?', 'Forgot password?')}
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
