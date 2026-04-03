import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import BrandMark from '../../../components/common/BrandMark';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useFeedback, useSentimentVote } from '../../../hooks/useFeedback';
import type { SentimentType } from '../../../types/policy.types';
import { useLanguageStore } from '../../../store/languageStore';
import { useVerificationStore } from '../../../store/verificationStore';

const sentimentOptions: Array<{ value: SentimentType; labelNo: string; labelEn: string; symbol: string }> = [
  { value: 'positive', labelNo: 'Bra', labelEn: 'Positive', symbol: '+' },
  { value: 'neutral', labelNo: 'Noytral', labelEn: 'Neutral', symbol: '0' },
  { value: 'negative', labelNo: 'Darlig', labelEn: 'Negative', symbol: '-' },
];

export default function FeedbackSentimentPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const { submitFeedback } = useFeedback(id);
  const { castVote, loading } = useSentimentVote(id);

  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const verified = useVerificationStore((state) => state.isVerified(id));

  const canSubmit = useMemo(
    () => verified && !!selectedSentiment && !submitting,
    [selectedSentiment, submitting, verified]
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!verified) {
      setError(tx('Du ma fullfore MinID/BankID-verifisering for du sender inn.', 'Complete MinID/BankID verification before submitting.'));
      return;
    }
    if (!selectedSentiment) {
      setError(tx('Velg en stemning for du sender inn.', 'Select a sentiment before submitting.'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await castVote(selectedSentiment);

      const content = text.trim();
      await submitFeedback(content || tx('Ingen fritekst sendt.', 'No free text provided.'), false, selectedSentiment);

      navigate(`/policies/${id}/suksess`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : tx('Kunne ikke sende inn.', 'Could not submit.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <CivicusMobileShell compact backTo={`/policies/${id}/verifisering`}>
      <form onSubmit={onSubmit} className="space-y-4 rounded-[24px] bg-[#dfdfdf] px-4 py-5">
        <BrandMark className="mx-auto h-14 w-14 rounded-xl border-[#b8d7ea]" />

        <h1 className="text-center text-[2rem] font-extrabold leading-tight text-[#0d87c5]">
          {tx('Gi din tilbakemelding', 'Share your feedback')}
        </h1>

        <div className="flex justify-between gap-3">
          {sentimentOptions.map((option) => {
            const selected = selectedSentiment === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedSentiment(option.value)}
                className={`flex-1 rounded-2xl px-2 py-2 text-center ${
                  selected ? 'bg-[#f6de54] ring-2 ring-[#d3b42d]' : 'bg-[#f3e68b]'
                }`}
              >
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#f2d63a] text-xl font-bold text-[#654f00]">
                  {option.symbol}
                </div>
                <p className="mt-1 text-sm font-semibold text-[#2f2f2f]">
                  {language === 'en' ? option.labelEn : option.labelNo}
                </p>
              </button>
            );
          })}
        </div>


        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tx('Ditt bidrag', 'Your feedback')}
          className="min-h-[170px] w-full rounded-2xl border border-[#808080] px-4 py-3 text-base text-[#2a2a2a] outline-none"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-[#168ec2] px-4 py-3 text-2xl font-semibold text-white disabled:opacity-50"
        >
          {submitting ? tx('Sender...', 'Submitting...') : tx('Send', 'Submit')}
        </button>

        {!verified ? <p className="text-sm text-red-600">{tx('Verifisering mangler.', 'Verification missing.')}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </CivicusMobileShell>
  );
}
