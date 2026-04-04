import SnapshotBottomNav from '../../../components/citizen/SnapshotBottomNav';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { useLanguageStore } from '../../../store/languageStore';

export default function VotesSnapshotPage() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <div className="pb-28">
      <CivicusMobileShell compact>
        <div className="space-y-6 text-center sm:space-y-8">
          <h1 className="text-[1.8rem] font-medium text-[#2e2e2e] sm:text-[2.1rem]">
            {tx('Radgivende stemmer', 'Advisory votes')}
          </h1>

          <div className="mx-auto grid max-w-[320px] gap-5 text-center sm:max-w-none sm:w-fit sm:grid-cols-[auto_180px_auto] sm:items-center sm:gap-3 lg:grid-cols-[auto_210px_auto]">
            <div className="order-2 text-left text-base text-[#3d3d3d] sm:order-1 sm:text-[1.1rem]">
              <p>{tx('noytral', 'neutral')}</p>
              <p className="font-semibold">31.3%</p>
            </div>

            <div className="order-1 mx-auto relative h-[180px] w-[180px] rounded-full bg-[conic-gradient(#2278a3_0_48.2%,#67d0d6_48.2%_68.7%,#439ec5_68.7%_100%)] sm:order-2 sm:h-[180px] sm:w-[180px] lg:h-[210px] lg:w-[210px]">
              <div className="absolute left-1/2 top-1/2 h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#efefef] sm:h-[78px] sm:w-[78px] lg:h-[92px] lg:w-[92px]" />
            </div>

            <div className="order-3 space-y-4 text-left text-base text-[#3d3d3d] sm:space-y-5 sm:text-[1.1rem]">
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
