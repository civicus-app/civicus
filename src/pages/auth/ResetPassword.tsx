import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '../../components/auth/AuthShell';
import { useAuth } from '../../hooks/useAuth';
import { useLanguageStore } from '../../store/languageStore';

type ResetForm = {
  email: string;
};

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetSchema = z.object({
    email: z.string().email(tx('Skriv en gyldig e-postadresse', 'Enter a valid email address')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setError('');
    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(data.email);
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : tx('Kunne ikke sende tilbakestillingslenken', 'Could not send the reset link')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={success ? tx('Sjekk e-posten din', 'Check your email') : tx('Tilbakestill passord', 'Reset password')}
      subtitle={
        success
          ? tx(
              'Vi har sendt en lenke for passordtilbakestilling til e-posten din.',
              'We sent a password reset link to your email.'
            )
          : tx(
              'Oppgi e-posten din, sa sender vi instruksjoner for a velge et nytt passord.',
              'Enter your email and we will send instructions for choosing a new password.'
            )
      }
      footer={
        <Link to="/login" className="font-medium text-[#1c6ea4] hover:underline">
          {tx('Tilbake til innlogging', 'Back to sign in')}
        </Link>
      }
    >
      {success ? null : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[#1c6ea4] text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? tx('Sender...', 'Sending...') : tx('Send lenke', 'Send link')}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
