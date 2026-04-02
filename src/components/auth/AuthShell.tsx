import type { ReactNode } from 'react';
import { APP_NAME, MUNICIPALITY_NAME } from '../../lib/constants';
import BrandMark from '../common/BrandMark';

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f3f6fb] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-[28px] border border-[#d8e0ee] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(36,67,112,0.08)] sm:px-8">
          <div className="text-center">
            <BrandMark
              className="mx-auto h-24 w-24 border-0 bg-transparent p-0 shadow-none"
              imageClassName="drop-shadow-[0_14px_28px_rgba(22,34,54,0.18)]"
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#6a7a92]">
              {APP_NAME}
            </p>
            <p className="mt-1 text-sm text-[#8b97ab]">{MUNICIPALITY_NAME}</p>
            <h1 className="mt-6 text-[2rem] font-bold tracking-tight text-[#162236]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#718096]">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-6 text-center text-sm text-[#5b6880]">{footer}</div> : null}
        </section>
      </div>
    </main>
  );
}
