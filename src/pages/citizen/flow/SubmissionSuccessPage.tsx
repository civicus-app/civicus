import { Check } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import CivicusMobileShell from '../../../components/citizen/CivicusMobileShell';
import { useLanguageStore } from '../../../store/languageStore';

export default function SubmissionSuccessPage() {
  const { id = '' } = useParams();
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/');
    }, 2000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <CivicusMobileShell compact>
      <div className="space-y-8 pt-6 text-center sm:space-y-10 sm:pt-10">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[#66d96f] shadow-[0_8px_0_#38b14d] sm:h-40 sm:w-40">
          <Check className="h-14 w-14 text-white sm:h-20 sm:w-20" strokeWidth={3.5} />
        </div>

        <div>
          <h1 className="text-[1.7rem] font-extrabold leading-tight text-[#0d87c5] sm:text-[2.2rem]">
            {tx('Takk for din stemme og', 'Thanks for your vote and')}
            <br />
            {tx('tilbakemelding!', 'feedback!')}
          </h1>
          <p className="mt-2 text-[1.15rem] text-[#1f84ba] sm:text-[1.8rem]">
            {tx('Ditt bidrag er', 'Your submission is')} <span className="font-bold">{tx('mottatt.', 'received.')}</span>
          </p>
        </div>

        <Link
          to="/innsikt/stemmer"
          className="inline-block text-[1.2rem] font-medium text-[#1b78aa] underline underline-offset-4 sm:text-[2rem]"
        >
          {tx('Se ditt dashboard for status', 'View your dashboard status')}
        </Link>

        <div className="flex flex-col items-stretch justify-center gap-3 pt-3 sm:flex-row sm:items-center">
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
