import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../../lib/constants';
import { useLanguageStore } from '../../store/languageStore';

interface CivicusMobileShellProps {
  children: ReactNode;
  compact?: boolean;
  backTo?: string;
  backLabel?: string;
  desktopTitle?: string;
  desktopSubtitle?: string;
}

export default function CivicusMobileShell({
  children,
  compact = false,
  backTo,
  backLabel,
  desktopTitle,
  desktopSubtitle,
}: CivicusMobileShellProps) {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const resolvedBackLabel = backLabel || tx('Tilbake', 'Back');
  const resolvedDesktopTitle = desktopTitle || tx('Innbyggerportal', 'Citizen Portal');
  const resolvedDesktopSubtitle =
    desktopSubtitle ||
    tx(
      'Utforsk saker, les AI-oppsummeringer og gi tilbakemelding i en moderne flyt.',
      'Explore policies, read AI summaries, and share feedback in a modern flow.'
    );

  return (
    <section className="min-h-screen bg-[#e9eef6]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1380px] gap-4 px-2 py-2 sm:gap-6 sm:px-3 sm:py-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden rounded-[30px] border border-[#97bed0]/35 bg-[radial-gradient(circle_at_25%_20%,rgba(113,199,220,0.5),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(32,122,164,0.45),transparent_50%),linear-gradient(145deg,#0f7fae,#12648b)] p-10 text-white shadow-xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-1 text-sm font-semibold tracking-wide">
              {APP_NAME}
            </p>
            <h2 className="mt-6 text-5xl font-extrabold leading-tight font-display">{resolvedDesktopTitle}</h2>
            <p className="mt-4 max-w-[520px] text-lg leading-relaxed text-white/90">{resolvedDesktopSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-white/90">
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">{tx('Steg', 'Steps')}</p>
              <p className="mt-2 text-2xl font-bold">2 - 10</p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">{tx('Visninger', 'Snapshots')}</p>
              <p className="mt-2 text-2xl font-bold">11 - 13</p>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[430px] rounded-[24px] border border-[#d4dde4] bg-[#efefef] px-4 py-5 shadow-sm sm:px-5 sm:py-6 lg:max-w-[700px] lg:min-h-[760px] lg:rounded-[34px] lg:border-[#c8d6e2] lg:bg-[#f6f8fb] lg:px-10 lg:py-8 lg:shadow-[0_22px_60px_rgba(16,81,120,0.18)]">
            <header className="text-center">
              <p className="text-[1.7rem] font-extrabold tracking-tight text-[#0a8ccf] drop-shadow-[0_2px_3px_rgba(8,41,65,0.25)] sm:text-[2rem] lg:text-[2.4rem]">
                {APP_NAME}
              </p>
            </header>

            {backTo ? (
              <div className="mt-4">
                <Link to={backTo} className="text-sm text-[#1f72a1] hover:underline">
                  {resolvedBackLabel}
                </Link>
              </div>
            ) : null}

            <div className={compact ? 'mt-5 sm:mt-6' : 'mt-6 sm:mt-8'}>{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
