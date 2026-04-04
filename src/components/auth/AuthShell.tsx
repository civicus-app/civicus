import type { ReactNode } from 'react';
import { APP_NAME } from '../../lib/constants';
import BrandMark from '../common/BrandMark';
import LanguageToggle from '../common/LanguageToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(182,214,243,0.55),transparent_38%),linear-gradient(180deg,#f4f7fb_0%,#eaf0f7_100%)] px-3 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1100px] items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="grid w-full overflow-hidden rounded-[30px] border border-[#d8e0ee] bg-white shadow-[0_24px_80px_rgba(36,67,112,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="hidden border-r border-[#dbe4ef] bg-[linear-gradient(160deg,#0f4f8c_0%,#1d6fb0_42%,#8fd8ec_125%)] p-8 text-white lg:flex lg:flex-col lg:justify-between xl:p-10">
            <div>
              <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                {APP_NAME}
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-tight text-white xl:text-5xl">
                {title}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/80 xl:text-base">
                {subtitle}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">CIVICUS</p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Modern citizen participation with guided flows, accessible feedback, and secure verification.
                </p>
              </div>
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                Municipality-ready access
              </div>
            </div>
          </aside>

          <div className="w-full px-5 py-6 sm:px-6 sm:py-7 lg:px-8 xl:px-10 xl:py-9">
            <div className="flex justify-end">
              <LanguageToggle className="shadow-none" />
            </div>
            <div className="mt-2 text-center lg:mt-0">
            <BrandMark
              className="mx-auto h-20 w-20 border-0 bg-transparent p-0 shadow-none sm:h-24 sm:w-24"
              imageClassName="drop-shadow-[0_14px_28px_rgba(22,34,54,0.18)]"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#6a7a92]">
              {APP_NAME}
            </p>
            <h1 className="mt-5 text-[1.75rem] font-bold tracking-tight text-[#162236] sm:text-[2rem] lg:hidden">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#718096] lg:hidden">{subtitle}</p>
            </div>

            <div className="mt-6 rounded-[26px] border border-[#e3e9f2] bg-[linear-gradient(180deg,#ffffff_0%,#f9fbfe_100%)] p-4 sm:mt-8 sm:p-5">
              {children}
            </div>

            {footer ? <div className="mt-6 text-center text-sm text-[#5b6880]">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
