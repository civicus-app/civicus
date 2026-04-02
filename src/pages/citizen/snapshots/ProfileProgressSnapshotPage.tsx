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
        <div className="space-y-6">
          <BrandMark className="mx-auto h-16 w-16 rounded-xl border-[#b8d7ea]" />

          <h1 className="text-center text-[2.2rem] font-extrabold text-[#1088c3]">
            {tx('Min Borgerprofil', 'My Citizen Profile')}
          </h1>

          <div className="relative pl-10">
            <div className="absolute bottom-4 left-[23px] top-3 w-[3px] bg-[#597bb8]" />

            <div className="space-y-6">
              {completedSteps.map((step) => (
                <div key={step.no} className="flex items-center gap-4">
                  <div className="z-10 grid h-11 w-11 place-items-center rounded-full bg-[#66d96f] text-xl font-extrabold text-white shadow">
                    OK
                  </div>
                  <p className="text-[1.8rem] font-semibold text-[#3583b0]">
                    {language === 'en' ? step.en : step.no}
                  </p>
                </div>
              ))}

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="z-10 grid h-11 w-11 place-items-center rounded-full bg-[#87d789] text-lg font-bold text-[#8f7f16] shadow">
                    *
                  </div>
                  <p className="text-[1.5rem] font-semibold text-[#3583b0]">
                    {tx('"Nye Storgata" prosjektet', '"Nye Storgata" project')}
                  </p>
                </div>
                <div className="ml-14">
                  <div className="h-3 w-[120px] rounded-full border border-[#7f7f7f] bg-white">
                    <div className="h-full w-[72%] rounded-full bg-[#1788ba]" />
                  </div>
                  <p className="mt-2 text-[1.3rem] leading-8 text-[#4d7ea1]">
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
                  <div className="z-10 h-11 w-11 rounded-full bg-[#a6a6a6] shadow" />
                  <p className="text-[1.8rem] font-semibold text-[#8a8a8a]">
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
