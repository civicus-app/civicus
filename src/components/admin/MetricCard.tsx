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
}

export default function MetricCard({ title, value, change, label, isText = false, className = '', icon }: MetricCardProps) {
  return (
    <Card className={`border border-[#d4dde9] shadow-sm bg-white ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm sm:text-base leading-tight font-semibold text-[#355a87]">
            {title}
          </p>
          {icon ? <div className="text-[#5b7aa0]">{icon}</div> : null}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {isText ? (
              <p className="text-lg sm:text-xl lg:text-2xl leading-tight font-semibold text-[#1e3b60] break-words">
                {value}
              </p>
            ) : (
              <p className="text-3xl sm:text-4xl leading-none font-semibold text-[#1e3b60] tabular-nums">
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
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
              )}
              <span className="text-sm sm:text-base leading-none whitespace-nowrap">
                {change > 0 ? `+${change}` : change}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <div className="mt-2 inline-flex px-2.5 py-0.5 rounded-full bg-[#e8eef7] text-[#496d95] text-xs sm:text-sm font-semibold">
            {label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
