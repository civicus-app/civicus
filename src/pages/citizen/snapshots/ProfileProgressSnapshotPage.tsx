import SnapshotBottomNav from '../../../components/citizen/SnapshotBottomNav';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import BrandMark from '../../../components/common/BrandMark';
import { useLanguageStore } from '../../../store/languageStore';

const completedSteps = [
  { no: 'Gronn By 2030 - Vedtatt', en: 'Green City 2030 - Adopted' },
  { no: 'Medvirkning', en: 'Participation' },
  { no: 'Analyse', en: 'Analysis' },
];

const upcomingSteps = [
  { no: 'Dialog', en: 'Dialogue' },
  { no: 'Vedtak', en: 'Decision' },
  { no: 'Byggestart', en: 'Construction start' },
];

export default function ProfileProgressSnapshotPage() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <div className="pb-28">
      <CivicusMobileShell compact>
        <div className="space-y-5 sm:space-y-6">
          <BrandMark className="mx-auto h-14 w-14 rounded-xl border-[#b8d7ea] sm:h-16 sm:w-16" />

          <h1 className="text-center text-[1.8rem] font-extrabold text-[#1088c3] sm:text-[2.2rem]">
            {tx('Min Borgerprofil', 'My Citizen Profile')}
          </h1>

          <div className="relative pl-6 sm:pl-10">
            <div className="absolute bottom-4 left-[15px] top-3 w-[3px] bg-[#597bb8] sm:left-[23px]" />

            <div className="space-y-6">
              {completedSteps.map((step) => (
                <div key={step.no} className="flex items-center gap-4">
                  <div className="z-10 grid h-9 w-9 place-items-center rounded-full bg-[#66d96f] text-sm font-extrabold text-white shadow sm:h-11 sm:w-11 sm:text-xl">
                    OK
                  </div>
                  <p className="text-[1.15rem] font-semibold leading-tight text-[#3583b0] sm:text-[1.8rem]">
                    {language === 'en' ? step.en : step.no}
                  </p>
                </div>
              ))}

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="z-10 grid h-9 w-9 place-items-center rounded-full bg-[#87d789] text-sm font-bold text-[#8f7f16] shadow sm:h-11 sm:w-11 sm:text-lg">
                    *
                  </div>
                  <p className="text-[1.05rem] font-semibold leading-tight text-[#3583b0] sm:text-[1.5rem]">
                    {tx('"Nye Storgata" prosjektet', '"Nye Storgata" project')}
                  </p>
                </div>
                <div className="ml-13 sm:ml-14">
                  <div className="h-3 w-[120px] rounded-full border border-[#7f7f7f] bg-white">
                    <div className="h-full w-[72%] rounded-full bg-[#1788ba]" />
                  </div>
                  <p className="mt-2 text-[0.95rem] leading-6 text-[#4d7ea1] sm:text-[1.3rem] sm:leading-8">
                    {tx('Under Behandling (Granv', 'Under review (Granv')}
                    <br />
                    {tx('Vurdering) - Sand II venter en', 'Assessment) - Sand II is waiting for')}
                    <br />
                    {tx('behandling', 'processing')}
                  </p>
                </div>
              </div>

              {upcomingSteps.map((step) => (
                <div key={step.no} className="flex items-center gap-4">
                  <div className="z-10 h-9 w-9 rounded-full bg-[#a6a6a6] shadow sm:h-11 sm:w-11" />
                  <p className="text-[1.15rem] font-semibold leading-tight text-[#8a8a8a] sm:text-[1.8rem]">
                    {language === 'en' ? step.en : step.no}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CivicusMobileShell>

      <SnapshotBottomNav />
    </div>
  );
}
