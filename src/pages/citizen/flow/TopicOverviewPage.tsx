import { Bike, MessageSquare, X } from 'lucide-react';
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
      <div className="space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-[#1f83b7]"
          aria-label={tx('Lukk', 'Close')}
        >
          <X className="h-6 w-6" />
        </button>

        <article className="rounded-[20px] bg-[#1489bf] px-6 py-6 text-white relative">
          <Bike className="mx-auto h-9 w-9" />
          <h2 className="mt-3 text-center text-[2rem] font-semibold leading-tight">
            {tx('Temaoversikt', 'Topic overview')}
          </h2>
          <p className="mt-2 text-center text-base font-semibold text-white/90">{topicLabel}</p>

          <ul className="mt-4 space-y-3 text-[1.05rem] leading-relaxed">
            {bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span>-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {showCitation ? (
            <div className="absolute right-4 top-4 rounded-full bg-[#32c2d0] px-4 py-3 text-xs font-semibold text-white shadow">
              {citation}
            </div>
          ) : null}
        </article>

        <button
          onClick={() => setShowCitation((value) => !value)}
          className="w-full rounded-2xl bg-[#f4991d] px-4 py-3 text-base font-bold text-[#2a2a2a]"
        >
          {tx('Les Original PDF-Tekst (Seks 1.3)', 'Read original PDF text (Sec 1.3)')}
        </button>

        <div className="flex gap-3">
          <Link
            to={`/policies/${id}/topic/${topic}/utdrag`}
            className="flex-1 rounded-2xl bg-[#f3f3f3] border border-[#d6d6d6] px-4 py-3 text-center font-semibold text-[#1c759f]"
          >
            {tx('Originaltekst', 'Original text')}
          </Link>
          <Link
            to={`/policies/${id}/topic/${topic}/chat`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1aa9c9] px-4 py-3 text-center font-semibold text-white"
          >
            <MessageSquare className="h-4 w-4" />
            CIVICUS AI
          </Link>
        </div>
      </div>
    </CivicusMobileShell>
  );
}
