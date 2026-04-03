import { useLanguageStore } from '../../store/languageStore';

interface FunnelData {
  viewed: number;
  interacted: number;
  feedback_given: number;
  votes_cast: number;
}

interface FunnelChartProps {
  data: FunnelData;
}

export default function FunnelChart({ data }: FunnelChartProps) {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);

  const stages = [
    {
      key: 'viewed',
      label: tx('1. Har sett saken', '1. Viewed the policy'),
      helper: tx('Unike brukere som har apnet saken', 'Unique users who opened the policy'),
      value: data.viewed,
    },
    {
      key: 'interacted',
      label: tx('2. Har deltatt', '2. Participated'),
      helper: tx(
        'Brukere som stemte eller sendte inn tilbakemelding',
        'Users who voted or submitted feedback'
      ),
      value: data.interacted,
    },
    {
      key: 'feedback',
      label: tx('3. Har sendt tilbakemelding', '3. Submitted feedback'),
      helper: tx('Skriftlige innspill fra brukere', 'Written responses from users'),
      value: data.feedback_given,
    },
    {
      key: 'votes',
      label: tx('4. Har avgitt stemme', '4. Cast a vote'),
      helper: tx('Registrerte stemninger for saken', 'Recorded sentiment votes for the policy'),
      value: data.votes_cast,
    },
  ];

  const baseline = Math.max(stages[0]?.value || 0, 1);

  const stageStats = stages.map((stage, index) => {
    const previousValue = index === 0 ? stage.value : stages[index - 1].value;
    const fromPreviousPercent = previousValue > 0 ? (stage.value / previousValue) * 100 : 0;
    const fromViewedPercent = baseline > 0 ? (stage.value / baseline) * 100 : 0;
    const dropFromPrevious = index === 0 ? 0 : Math.max(previousValue - stage.value, 0);

    return {
      ...stage,
      fromPreviousPercent,
      fromViewedPercent,
      dropFromPrevious,
    };
  });

  const largestDropStage = stageStats
    .slice(1)
    .sort((left, right) => right.dropFromPrevious - left.dropFromPrevious)[0];

  const overallConversion = baseline > 0 ? (data.votes_cast / baseline) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7086a1]">
            {tx('Total konvertering', 'Overall conversion')}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tracking-[-0.04em] text-[#173151]">
              {overallConversion.toFixed(1)}%
            </p>
            <p className="max-w-[180px] text-right text-xs leading-5 text-[#617792]">
              {tx('Fra visning til avlagt stemme', 'From policy view to recorded vote')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7086a1]">
            {tx('Storste frafall', 'Largest drop-off')}
          </p>
          <div className="mt-2">
            <p className="text-sm font-semibold text-[#173151]">
              {largestDropStage
                ? largestDropStage.label
                : tx('Ikke nok data ennå', 'Not enough data yet')}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#617792]">
              {largestDropStage
                ? tx(
                    `${largestDropStage.dropFromPrevious.toLocaleString()} brukere falt fra i dette steget`,
                    `${largestDropStage.dropFromPrevious.toLocaleString()} users dropped off at this step`
                  )
                : tx('Det finnes ikke nok aktivitet til å beregne frafall.', 'There is not enough activity yet to calculate drop-off.')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {stageStats.map((stage, index) => (
          <div key={stage.key} className="rounded-[22px] border border-[#d7e0ea] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(24,49,81,0.04)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#173151]">{stage.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#617792]">{stage.helper}</p>
              </div>

              <div className="flex items-end gap-4 lg:min-w-[220px] lg:justify-end">
                <div className="text-left lg:text-right">
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-[#173151]">
                    {stage.value.toLocaleString()}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#7086a1]">
                    {tx('Brukere', 'Users')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ecf1f6]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2d70be_0%,#7ba7dd_100%)]"
                style={{ width: `${Math.max(4, Math.min(100, stage.fromViewedPercent))}%` }}
              />
            </div>

            <div className="mt-3 grid gap-2 text-xs text-[#5e7591] md:grid-cols-3">
              <div className="rounded-xl bg-[#f7fafc] px-3 py-2">
                <span className="font-semibold text-[#173151]">{stage.fromViewedPercent.toFixed(1)}%</span>{' '}
                {tx('av alle som sa saken', 'of all viewers')}
              </div>
              <div className="rounded-xl bg-[#f7fafc] px-3 py-2">
                <span className="font-semibold text-[#173151]">
                  {index === 0 ? '100.0%' : stage.fromPreviousPercent.toFixed(1) + '%'}
                </span>{' '}
                {tx('gikk videre fra forrige steg', 'continued from the previous step')}
              </div>
              <div className="rounded-xl bg-[#f7fafc] px-3 py-2">
                <span className="font-semibold text-[#173151]">
                  {index === 0 ? '0' : stage.dropFromPrevious.toLocaleString()}
                </span>{' '}
                {tx('falt fra i dette steget', 'dropped off at this step')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
