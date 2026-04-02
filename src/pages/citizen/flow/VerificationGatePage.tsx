import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import BrandMark from '../../../components/common/BrandMark';
import { aiService } from '../../../services/ai';
import { useLanguageStore } from '../../../store/languageStore';
import { useVerificationStore } from '../../../store/verificationStore';

export default function VerificationGatePage() {
  const { id = '' } = useParams();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { registerPendingState, isVerified } = useVerificationStore();

  const startVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await aiService.startVerification({
        provider: 'minid',
        policyId: id,
      });

      registerPendingState(result.state, id);
      window.location.assign(result.redirectUrl);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : tx('Kunne ikke starte verifisering.', 'Could not start verification.')
      );
      setLoading(false);
    }
  };

  const alreadyVerified = isVerified(id);

  return (
    <CivicusMobileShell compact backTo={`/policies/${id}`}>
      <div className="space-y-6 text-center">
        <BrandMark className="mx-auto h-16 w-16 rounded-xl border-[#b8d7ea]" />

        <h1 className="text-[2.4rem] font-extrabold leading-tight text-[#0d87c5] drop-shadow-[0_2px_2px_rgba(8,41,65,0.18)]">
          {tx('LOGG INN FOR A STEMME', 'SIGN IN TO VOTE')}
        </h1>

        <button
          onClick={startVerification}
          disabled={loading || alreadyVerified}
          className="w-full rounded-xl bg-[#158fcb] px-4 py-3 text-2xl font-semibold text-white disabled:opacity-60"
        >
          {alreadyVerified ? tx('Verifisert', 'Verified') : loading ? tx('Starter...', 'Starting...') : 'MinID / BankID'}
        </button>

        <h2 className="text-[2.2rem] font-extrabold text-[#0d87c5]">{tx('SI DIN MENING', 'SHARE YOUR OPINION')}</h2>

        {alreadyVerified ? (
          <Link
            to={`/policies/${id}/tilbakemelding`}
            className="inline-block rounded-xl border border-[#1d93cb] px-4 py-2 text-[#1d93cb]"
          >
            {tx('Fortsett til tilbakemelding', 'Continue to feedback')}
          </Link>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </CivicusMobileShell>
  );
}
