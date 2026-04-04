import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { usePolicy } from '../../../hooks/usePolicies';
import { aiService } from '../../../services/ai';
import { useLanguageStore } from '../../../store/languageStore';
import { getTopicLabel } from './topics';
import { resolveAttachmentUrl } from '../../../lib/policyAttachments';

export default function ExtractSummaryPage() {
  const { id = '', topic = '' } = useParams();
  const { policy } = usePolicy(id);
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await aiService.extractOriginalText({ policyId: id, topic, language });
        if (!active) return;
        setText(result.text);
        setSummary(result.summary);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, language, topic]);

  if (loading) return <LoadingSpinner fullScreen />;

  const pdfUrl = policy?.attachments?.[0] ? resolveAttachmentUrl(policy.attachments[0].file_path) : null;
  const excerptItems = text ? text.split(/\.\s+/).slice(0, 4) : [];

  return (
    <CivicusMobileShell compact backTo={`/policies/${id}/topic/${topic}`}>
      <article className="space-y-5 rounded-[28px] bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-3 rounded-[28px] bg-sky-800 px-4 py-5 text-white shadow-lg sm:px-5 sm:py-6">
          <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">
            {tx('Original PDF-seksjon', 'Original PDF section')}
          </p>
          <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
            {tx('Tema', 'Topic')}: {getTopicLabel(topic, language, policy?.topics)}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-sky-100">
            {tx(
              'Her er et kort utdrag fra dokumentet som gir deg direkte kontekst for temaet.',
              'Here is a short excerpt from the document that gives direct context for the topic.'
            )}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {tx('Utdrag fra PDF', 'PDF excerpt')}
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
            {excerptItems.length > 0 ? (
              excerptItems.map((sentence) => <p key={sentence}>{sentence.trim()}.</p>)
            ) : (
              <p>{tx('Ingen utdrag tilgjengelig for dette temaet.', 'No excerpt available for this topic.')}</p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`/policies/${id}/topic/${topic}/chat`}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {tx('Faa mer forklaring fra AI', 'Get more explanation from AI')}
          </Link>
          <a
            href={pdfUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            {tx('Aapne PDF-seksjon', 'Open PDF section')}
          </a>
        </div>

        <div className="rounded-[28px] bg-slate-900 p-4 text-sm text-slate-100">
          <p className="font-semibold">{tx('CIVICUS AI - Oppsummering', 'CIVICUS AI - Summary')}</p>
          <p className="mt-2 leading-6">{summary || tx('Ingen oppsummering tilgjengelig.', 'No summary available.')}</p>
        </div>

        <Link
          to={`/policies/${id}/verifisering`}
          className="block rounded-3xl bg-amber-500 px-4 py-4 text-center text-base font-semibold text-slate-950 shadow-md shadow-amber-200/40 transition hover:bg-amber-400"
        >
          {tx('Fortsett til verifisering', 'Continue to verification')}
        </Link>
      </article>
    </CivicusMobileShell>
  );
}
