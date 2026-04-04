import SnapshotBottomNav from '../../../components/citizen/SnapshotBottomNav';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import BrandMark from '../../../components/common/BrandMark';
import { useLanguageStore } from '../../../store/languageStore';

const cloudWords = [
  { text: 'Tromso', style: 'left-[42%] top-[34%] text-[3.8rem] text-[#f05a25]' },
  { text: 'Sykkelvei', style: 'left-[36%] top-[28%] text-[2.3rem] text-[#f16f39] rotate-90' },
  { text: 'Byutvikling', style: 'left-[12%] top-[36%] text-[2.9rem] text-[#285bdf] -rotate-90' },
  { text: 'Parkering', style: 'left-[24%] top-[44%] text-[2rem] text-[#3c49cb]' },
  { text: 'Snorydding', style: 'left-[57%] top-[43%] text-[1.6rem] text-[#6fbb8f] -rotate-90' },
  { text: 'Trygg', style: 'left-[36%] top-[48%] text-[1.6rem] text-[#4d66b8]' },
  { text: 'Kollektiv', style: 'left-[29%] top-[33%] text-[1.5rem] text-[#8fc8d2] -rotate-90' },
  { text: 'Offentlig Rom', style: 'left-[30%] top-[26%] text-[1.2rem] text-[#3f62e5] -rotate-90' },
  { text: 'Sikkerhet', style: 'left-[54%] top-[38%] text-[1.4rem] text-[#2b6bc7]' },
];

export default function CommunityPulseSnapshotPage() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <div className="pb-28">
      <CivicusMobileShell compact>
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-lg border-[#b8d7ea] sm:h-11 sm:w-11" />
            <h1 className="text-[2rem] font-extrabold text-[#1088c3] sm:text-[3rem]">CIVICUS</h1>
          </div>

          <h2 className="text-center text-[1.8rem] font-extrabold text-[#1088c3] sm:text-[2.2rem]">
            {tx('Fellescapets Puls', 'Community Pulse')}
          </h2>

          <div className="relative mx-auto h-[200px] w-full overflow-hidden rounded-[20px] bg-[#f6f8fb] sm:h-[230px] sm:bg-transparent">
            {cloudWords.map((word) => (
              <span key={word.text} className={`absolute max-w-[45%] text-center font-medium leading-none ${word.style}`}>
                {word.text}
              </span>
            ))}
          </div>

          <article className="rounded-[24px] bg-[#dfdfdf] px-4 py-4 text-[#252525] sm:px-6 sm:py-5">
            <h3 className="text-[1.4rem] font-bold sm:text-[2rem]">{tx('Vedtak fra kommunen:', 'Decision from municipality:')}</h3>
            <p className="mt-2 text-[1.1rem] leading-7 sm:text-[1.9rem] sm:leading-10">
              {tx('Basert pa 400 tilbakemeldinger', 'Based on 400 responses')}
              <br />
              {tx('om oss, er anleggsperiode', 'from residents, construction period')}
              <br />
              {tx('endret. Kl. 18:00.', 'was changed. 18:00.')}
            </p>
          </article>
        </div>
      </CivicusMobileShell>

      <SnapshotBottomNav />
    </div>
  );
}
