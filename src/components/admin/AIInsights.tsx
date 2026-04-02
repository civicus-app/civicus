import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../../services/ai';
import { useLanguageStore } from '../../store/languageStore';

export default function AIInsights() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [points, setPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await aiService.getAdminInsights({ period: '30d' });
        if (!active) return;
        setPoints(result.points);
      } catch (insightError) {
        if (!active) return;
        setError(
          insightError instanceof Error
            ? insightError.message
            : tx('Kunne ikke hente AI-innsikt.', 'Could not fetch AI insights.')
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 rounded-md border border-[#d4dde9] bg-[#eef3f9] px-4 py-4 text-[#1f3d60]">
        {loading ? <p className="text-sm">{tx('Laster AI-innsikt...', 'Loading AI insights...')}</p> : null}

        {!loading && !points.length ? (
          <p className="text-sm">{tx('Ingen innsikt tilgjengelig akkurat na.', 'No insights available right now.')}</p>
        ) : null}

        {points.map((point) => (
          <p key={point} className="text-base leading-relaxed">
            {point}
          </p>
        ))}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="mt-auto flex justify-end pt-4">
        <Link
          to="/admin/analytics"
          className="inline-flex items-center rounded-md bg-[#3279cb] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a68b3]"
        >
          {tx('Vis alle', 'View all')}
        </Link>
      </div>
    </div>
  );
}
