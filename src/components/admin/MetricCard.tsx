import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  label?: string;
  isText?: boolean;
  className?: string;
  icon?: ReactNode;
  tone?: 'default' | 'soft';
}

export default function MetricCard({
  title,
  value,
  change,
  label,
  isText = false,
  className = '',
  icon,
  tone = 'default',
}: MetricCardProps) {
  return (
    <Card
      className={`overflow-hidden rounded-[18px] border border-[#dbe3ec] bg-white shadow-[0_8px_22px_rgba(24,49,81,0.045)] ${className}`}
    >
      <CardContent
        className={`p-2.5 ${tone === 'soft' ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)]' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7388a2]">
            {title}
          </p>
          {icon ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e2e9f1] bg-[#f7fafd] text-[#547292]">
              {icon}
            </div>
          ) : null}
        </div>

        <div className="mt-1.5 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isText ? (
              <p className="text-[13px] leading-tight font-semibold text-[#173151] break-words sm:text-sm">
                {value}
              </p>
            ) : (
              <p className="text-[1.1rem] leading-none font-semibold tracking-[-0.05em] text-[#173151] tabular-nums sm:text-[1.2rem]">
                {value}
              </p>
            )}
          </div>

          {change !== undefined && (
            <div
              className={`pb-0.5 shrink-0 flex items-center font-semibold ${
                change >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'
              }`}
            >
              {change >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              <span className="text-[9px] leading-none whitespace-nowrap">
                {change > 0 ? `+${change}` : change}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <div className="mt-1.5 inline-flex rounded-full border border-[#e1e8f0] bg-[#f5f8fb] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4e6a90]">
            {label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
