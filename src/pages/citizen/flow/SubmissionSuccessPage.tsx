import { Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { useLanguageStore } from '../../../store/languageStore';

export default function SubmissionSuccessPage() {
  const { id = '' } = useParams();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  return (
    <CivicusMobileShell compact>
      <div className="space-y-10 pt-10 text-center">
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-[#66d96f] shadow-[0_8px_0_#38b14d]">
          <Check className="h-20 w-20 text-white" strokeWidth={3.5} />
        </div>

        <div>
          <h1 className="text-[2.2rem] font-extrabold leading-tight text-[#0d87c5]">
            {tx('Takk for din stemme og', 'Thanks for your vote and')}
            <br />
            {tx('tilbakemelding!', 'feedback!')}
          </h1>
          <p className="mt-2 text-[1.8rem] text-[#1f84ba]">
            {tx('Ditt bidrag er', 'Your submission is')} <span className="font-bold">{tx('mottatt.', 'received.')}</span>
          </p>
        </div>

        <Link
          to="/innsikt/stemmer"
          className="inline-block text-[2rem] font-medium text-[#1b78aa] underline underline-offset-4"
        >
          {tx('Se ditt dashboard for status', 'View your dashboard status')}
        </Link>

        <div className="flex items-center justify-center gap-3 pt-3">
          <Link
            to={`/policies/${id}`}
            className="rounded-lg border border-[#2a86b9] px-4 py-2 text-[#2a86b9]"
          >
            {tx('Nytt tema', 'New topic')}
          </Link>
          <Link to="/home" className="rounded-lg bg-[#198ec4] px-4 py-2 text-white">
            {tx('Hjem', 'Home')}
          </Link>
        </div>
      </div>
    </CivicusMobileShell>
  );
}
