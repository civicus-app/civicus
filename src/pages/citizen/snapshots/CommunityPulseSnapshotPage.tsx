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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11 rounded-lg border-[#b8d7ea]" />
            <h1 className="text-[3rem] font-extrabold text-[#1088c3]">CIVICUS</h1>
          </div>

          <h2 className="text-center text-[2.2rem] font-extrabold text-[#1088c3]">
            {tx('Fellescapets Puls', 'Community Pulse')}
          </h2>

          <div className="relative mx-auto h-[230px] w-full">
            {cloudWords.map((word) => (
              <span key={word.text} className={`absolute font-medium ${word.style}`}>
                {word.text}
              </span>
            ))}
          </div>

          <article className="rounded-[24px] bg-[#dfdfdf] px-6 py-5 text-[#252525]">
            <h3 className="text-[2rem] font-bold">{tx('Vedtak fra kommunen:', 'Decision from municipality:')}</h3>
            <p className="mt-2 text-[1.9rem] leading-10">
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
