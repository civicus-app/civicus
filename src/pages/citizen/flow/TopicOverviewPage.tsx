import { Bike, BookOpen, MessageSquare, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { usePolicy } from '../../../hooks/usePolicies';
import { aiService } from '../../../services/ai';
import { getTopicLabel } from './topics';
import { useLanguageStore } from '../../../store/languageStore';

export default function TopicOverviewPage() {
  const { id = '', topic = '' } = useParams();
  const navigate = useNavigate();
  const { policy } = usePolicy(id);
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [loading, setLoading] = useState(true);
  const [bullets, setBullets] = useState<string[]>([]);
  const [citation, setCitation] = useState('');
  const [showCitation, setShowCitation] = useState(false);

  const topicLabel = useMemo(
    () => getTopicLabel(topic, language, policy?.topics),
    [topic, language, policy?.topics]
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await aiService.getTopicOverview({ policyId: id, topic, language });
        if (!active) return;
        setBullets(result.bullets);
        setCitation(result.citation || (language === 'en' ? 'Page 1.2, Paragraph 4' : 'Side 1.2, Avsnitt 4'));
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

  return (
    <CivicusMobileShell compact>
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            aria-label={tx('Lukk', 'Close')}
          >
            <X className="h-5 w-5 mr-2" />
            {tx('Tilbake', 'Back')}
          </button>
          <span className="self-start rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 sm:self-auto">
            {tx('Temaoversikt', 'Topic overview')}
          </span>
        </div>

        <article className="overflow-hidden rounded-[28px] bg-gradient-to-br from-sky-600 via-cyan-500 to-slate-900 p-4 text-white shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-200/80">
                {tx('Oppsummering', 'Summary')}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{topicLabel}</h2>
            </div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/15 text-white shadow-lg">
              <Bike className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-100">
            {bullets.map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-sm">
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
            <p>
              {tx(
                'Velg enten PDF-seksjon for dokumentinnhold eller AI-hjelp for kjappe svar.',
                'Choose either the PDF section for source content or AI help for quick answers.'
              )}
            </p>
            {showCitation ? (
              <span className="rounded-full bg-white/10 px-3 py-2 font-semibold text-white shadow-sm">
                {citation}
              </span>
            ) : null}
          </div>
        </article>

        <button
          onClick={() => setShowCitation((value) => !value)}
          className="w-full rounded-3xl bg-amber-400 px-4 py-4 text-base font-semibold text-slate-900 shadow-md shadow-amber-200/40 transition hover:bg-amber-300"
        >
          {tx('Se PDF-utdrag for dette temaet', 'View PDF excerpt for this topic')}
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`/policies/${id}/topic/${topic}/utdrag`}
            className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300"
          >
            <BookOpen className="h-4 w-4 text-slate-900" />
            {tx('Gaa til PDF-seksjonen', 'Go to PDF section')}
          </Link>
          <Link
            to={`/policies/${id}/topic/${topic}/chat`}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-sky-700 px-4 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
          >
            <MessageSquare className="h-4 w-4" />
            {tx('Sporr AI-agenten', 'Ask the AI agent')}
          </Link>
        </div>
      </div>
    </CivicusMobileShell>
  );
}
