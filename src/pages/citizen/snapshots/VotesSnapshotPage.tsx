import SnapshotBottomNav from '../../../components/citizen/SnapshotBottomNav';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { useLanguageStore } from '../../../store/languageStore';

export default function VotesSnapshotPage() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <div className="pb-28">
      <CivicusMobileShell compact>
        <div className="space-y-8 text-center">
          <h1 className="text-[2.1rem] font-medium text-[#2e2e2e]">
            {tx('Radgivende stemmer', 'Advisory votes')}
          </h1>

          <div className="mx-auto grid w-fit grid-cols-[auto_210px_auto] items-center gap-3">
            <div className="text-left text-[1.1rem] text-[#3d3d3d]">
              <p>{tx('noytral', 'neutral')}</p>
              <p className="font-semibold">31.3%</p>
            </div>

            <div className="relative h-[210px] w-[210px] rounded-full bg-[conic-gradient(#2278a3_0_48.2%,#67d0d6_48.2%_68.7%,#439ec5_68.7%_100%)]">
              <div className="absolute left-1/2 top-1/2 h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#efefef]" />
            </div>

            <div className="space-y-5 text-left text-[1.1rem] text-[#3d3d3d]">
              <div>
                <p>{tx('stotter', 'supports')}</p>
                <p className="font-semibold">48.2%</p>
              </div>
              <div>
                <p>{tx('Bekymret', 'Concerned')}</p>
                <p className="font-semibold">20.5%</p>
              </div>
            </div>
          </div>
        </div>
      </CivicusMobileShell>

      <SnapshotBottomNav />
    </div>
  );
}
