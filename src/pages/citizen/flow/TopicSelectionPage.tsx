import {
  Bike,
  Coins,
  HardHat,
  Trees,
  Bus,
  Home,
  Wallet,
  MapPin,
  Clock,
  Shield,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import BrandMark from '../../../components/common/BrandMark';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { usePolicy } from '../../../hooks/usePolicies';
import { supabase } from '../../../lib/supabase';
import { getFlowTopics } from './topics';
import { useLanguageStore } from '../../../store/languageStore';
import { getPolicyTitle } from '../../../lib/policyContent';

const TOPIC_ICONS: Record<string, LucideIcon> = {
  // icon_key values from DB
  bus: Bus,
  wallet: Wallet,
  home: Home,
  'map-pin': MapPin,
  clock: Clock,
  shield: Shield,
  coins: Coins,
  leaf: Leaf,
  // legacy slug-based keys
  'bedre-sykkelveier': Bike,
  'flere-gronne-soner': Trees,
  'budsjett-kostnad': Coins,
  anleggsperioder: HardHat,
};

export default function TopicSelectionPage() {
  const { id = '' } = useParams();
  const { policy, loading } = usePolicy(id);
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const topics = getFlowTopics(policy?.topics);

  useEffect(() => {
    if (!id) return;
    supabase.rpc('track_policy_view', { policy_uuid: id }).then(() => {});
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <CivicusMobileShell backTo={`/policies/${id}`}>
      <div className="space-y-5 text-center sm:space-y-6">
        <BrandMark className="mx-auto h-14 w-14 rounded-xl border-[#b8d7ea] sm:h-16 sm:w-16" />

        <div>
          <h1 className="text-[1.7rem] font-extrabold leading-tight text-[#0d87c5] drop-shadow-[0_2px_2px_rgba(8,41,65,0.18)] sm:text-[2.1rem]">
            {policy ? getPolicyTitle(policy, language) : tx('Aktiv kommunal sak', 'Active municipal policy')}
          </h1>
          <p className="mt-2 text-sm text-[#4d6f8a]">
            {tx(
              'Velg hvilket tema du vil utforske for detaljer, originaltekst og AI-hjelp.',
              'Choose the topic you want to explore for details, source text, and AI help.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 min-[420px]:grid-cols-2 sm:gap-4">
          {topics.map((topic) => {
            const Icon = TOPIC_ICONS[topic.icon_key ?? ''] ?? TOPIC_ICONS[topic.slug] ?? Bike;
            return (
              <Link
                key={topic.slug}
                to={`/policies/${id}/topic/${topic.slug}`}
                className="rounded-[22px] bg-[#1b87bb] px-3 py-5 text-white shadow hover:brightness-95 sm:py-6"
              >
                <Icon className="mx-auto h-8 w-8 sm:h-9 sm:w-9" />
                <p className="mt-3 text-base font-semibold leading-tight sm:text-lg">
                  {language === 'en' ? topic.label_en : topic.label_no}
                </p>
              </Link>
            );
          })}
        </div>

        <p className="pt-2 text-base font-semibold text-[#2b7cad] sm:text-lg">
          {tx('Trykk pa et kort for detaljer', 'Tap a card for details')}
        </p>
      </div>
    </CivicusMobileShell>
  );
}
