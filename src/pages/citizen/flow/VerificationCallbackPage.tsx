import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { aiService } from '../../../services/ai';
import { useLanguageStore } from '../../../store/languageStore';
import { useVerificationStore } from '../../../store/verificationStore';

export default function VerificationCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const isEnglish = language === 'en';
  const tx = (no: string, en: string) => (isEnglish ? en : no);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(
    isEnglish ? 'Confirming verification...' : 'Bekrefter verifisering...'
  );

  const { consumePendingState, markVerified } = useVerificationStore();

  useEffect(() => {
    let active = true;

    const run = async () => {
      const state = params.get('state') || '';
      const code = params.get('code') || '';
      const policyIdFromQuery = params.get('policyId') || '';

      if (!state || !code) {
        setStatus('error');
        setMessage(tx('Mangler verifiseringsdata i callback.', 'Missing verification data in callback.'));
        return;
      }

      try {
        const policyId = consumePendingState(state) || policyIdFromQuery;
        if (!policyId) {
          throw new Error(tx('Fant ikke aktiv verifiseringssesjon.', 'No active verification session found.'));
        }

        const result = await aiService.completeVerification({ state, code });
        if (!result.verified) throw new Error(tx('Verifisering mislyktes.', 'Verification failed.'));

        markVerified(policyId, result.expiresAt);
        if (!active) return;

        setStatus('success');
        setMessage(tx('Verifisering fullfort. Du sendes videre...', 'Verification complete. Redirecting...'));

        window.setTimeout(() => {
          navigate(`/policies/${policyId}/tilbakemelding`, { replace: true });
        }, 800);
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : tx('Verifisering mislyktes.', 'Verification failed.'));
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [consumePendingState, isEnglish, markVerified, navigate, params]);

  return (
    <CivicusMobileShell compact>
      <div className="space-y-4 text-center">
        <div
          className={`mx-auto h-16 w-16 rounded-full grid place-items-center text-white text-2xl ${
            status === 'error' ? 'bg-red-500' : 'bg-[#1d95ca]'
          }`}
        >
          {status === 'success' ? 'OK' : status === 'error' ? 'X' : '...'}
        </div>

        <h1 className="text-2xl font-bold text-[#187fb2]">{tx('Verifisering', 'Verification')}</h1>
        <p className="text-[#4b6680]">{message}</p>

        {status === 'error' ? (
          <Link to="/home" className="inline-block rounded-xl bg-[#1d95ca] px-4 py-2 text-white">
            {tx('Tilbake til startsiden', 'Back to home')}
          </Link>
        ) : null}
      </div>
    </CivicusMobileShell>
  );
}
