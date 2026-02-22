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
  const stages = [
    {
      key: 'viewed',
      label: 'Policies Viewed',
      value: data.viewed,
      color: 'from-[#2f73c3] to-[#3e84d0]',
    },
    {
      key: 'interacted',
      label: 'Interacted With',
      value: data.interacted,
      color: 'from-[#4e8ed1] to-[#5f9ed9]',
    },
    {
      key: 'feedback',
      label: 'Feedback Given',
      value: data.feedback_given,
      color: 'from-[#6aa1d9] to-[#7db0e1]',
    },
    {
      key: 'votes',
      label: 'Votes Cast',
      value: data.votes_cast,
      color: 'from-[#b9c6da] to-[#c8d3e3]',
    },
  ];

  const firstStageValue = stages[0]?.value || 0;
  const lastStageValue = stages[stages.length - 1]?.value || 0;
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);
  const overallConversion = firstStageValue ? (lastStageValue / firstStageValue) * 100 : 0;

  const stageStats = stages.map((stage, index) => {
    const previousValue = index > 0 ? stages[index - 1].value : stage.value;
    const conversionFromPrevious = previousValue ? (stage.value / previousValue) * 100 : 0;
    const dropOff = index > 0 ? Math.max(previousValue - stage.value, 0) : 0;
    const widthPercent = 50 + Math.round((stage.value / maxValue) * 42);

    return {
      ...stage,
      conversionFromPrevious,
      dropOff,
      widthPercent,
    };
  });

  const funnelWidths = stageStats.map((stage) => stage.widthPercent);
  for (let index = 1; index < funnelWidths.length; index += 1) {
    funnelWidths[index] = Math.min(funnelWidths[index], funnelWidths[index - 1] - 7);
  }
  for (let index = 0; index < funnelWidths.length; index += 1) {
    funnelWidths[index] = Math.max(34, funnelWidths[index]);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[#d6e0ed] bg-[#f4f8fd] px-3.5 py-2.5 flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-medium text-[#3b5f87]">
          Overall Conversion
        </p>
        <div className="text-right">
          <p className="text-sm sm:text-base font-semibold text-[#2a4a70] tabular-nums">
            {overallConversion.toFixed(1)}%
          </p>
          <p className="text-[11px] sm:text-xs text-[#5b7495]">
            Viewed to Votes
          </p>
        </div>
      </div>

      {stageStats.map((stage, index) => {
        const isLast = index === stageStats.length - 1;
        const textColor = isLast ? 'text-[#2d4d70]' : 'text-white';

        return (
          <div key={stage.key}>
            {index > 0 && (
              <div className="flex justify-center -mb-0.5 sm:-mb-1">
                <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] sm:border-l-[12px] sm:border-r-[12px] sm:border-t-[12px] border-l-transparent border-r-transparent border-t-[#4f8fd2]" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
              <div className="flex justify-center">
                <div
                  className={`h-12 sm:h-14 bg-gradient-to-r ${stage.color} shadow-sm flex items-center justify-center px-4 sm:px-6`}
                  style={{
                    width: `${funnelWidths[index]}%`,
                    clipPath: 'polygon(4% 0%, 96% 0%, 90% 100%, 10% 100%)',
                  }}
                >
                  <span className={`text-sm sm:text-base font-semibold ${textColor}`}>
                    {stage.label}
                  </span>
                </div>
              </div>

              <div className="sm:w-40 text-center sm:text-right">
                <p className="text-xl sm:text-2xl leading-none font-semibold text-[#29496c] tabular-nums">
                  {stage.value.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-[#5b7495]">
                  {index === 0
                    ? 'Baseline stage'
                    : `${stage.conversionFromPrevious.toFixed(1)}% from previous`}
                </p>
              </div>
            </div>

            {!isLast && (
              <div className="flex justify-center mt-2 mb-1">
                <div className="inline-flex items-center rounded-full border border-[#d4deeb] bg-white px-2.5 py-1 text-[11px] sm:text-xs text-[#48688f]">
                  Drop-off: {stageStats[index + 1].dropOff.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
