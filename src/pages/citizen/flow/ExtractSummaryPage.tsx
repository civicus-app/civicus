import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { usePolicy } from '../../../hooks/usePolicies';
import { aiService } from '../../../services/ai';
import { useLanguageStore } from '../../../store/languageStore';
import { getTopicLabel } from './topics';

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

  return (
    <CivicusMobileShell compact backTo={`/policies/${id}/topic/${topic}`}>
      <article className="rounded-[20px] bg-[#1489bf] px-4 py-5 text-white">
        <h2 className="text-center text-2xl font-bold">
          {tx('Les Original PDF-Tekst (Seks 1.3)', 'Read original PDF text (Sec 1.3)')}
        </h2>
        <p className="mt-2 text-center text-sm text-white/90">
          {tx('Tema', 'Topic')}: {getTopicLabel(topic, language, policy?.topics)}
        </p>

        <p className="mt-4 text-sm leading-6 text-white/90">{text}</p>

        <div className="mt-5 rounded-xl bg-[#0d6f9b] px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-white/70">
            {tx('CIVICUS AI - Oppsummering', 'CIVICUS AI - Summary')}
          </p>
          <p className="mt-2 text-sm leading-6">{summary}</p>
        </div>

        <Link
          to={`/policies/${id}/verifisering`}
          className="mt-5 block rounded-2xl bg-[#f4991d] px-4 py-3 text-center text-[1.1rem] font-bold text-white"
        >
          {tx('DETTE HAR VI FUNNET UT', 'CONTINUE TO VERIFICATION')}
        </Link>
      </article>
    </CivicusMobileShell>
  );
}
