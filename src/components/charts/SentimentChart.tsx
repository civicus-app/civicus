import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentChartProps {
  data: SentimentData;
}

const COLORS = { positive: '#10B981', neutral: '#F59E0B', negative: '#EF4444' };

export default function SentimentChart({ data }: SentimentChartProps) {
  const total = data.positive + data.neutral + data.negative;
  const chartData = [
    { name: 'Positive', value: data.positive, color: COLORS.positive },
    { name: 'Neutral', value: data.neutral, color: COLORS.neutral },
    { name: 'Negative', value: data.negative, color: COLORS.negative },
  ].filter(d => d.value > 0);

  const renderCustomLabel = ({ cx, cy }: { cx: number; cy: number }) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-2xl font-bold">
      <tspan x={cx} dy="-0.5em" fontSize="20" fontWeight="bold" fill="#111">{total}</tspan>
      <tspan x={cx} dy="1.4em" fontSize="12" fill="#6B7280">total votes</tspan>
    </text>
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-around mt-2">
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="text-center">
            <div className="text-2xl font-bold" style={{ color }}>{data[key as keyof SentimentData]}</div>
            <div className="text-xs text-gray-500 capitalize">{key}</div>
            <div className="text-xs text-gray-400">
              {total ? Math.round(data[key as keyof SentimentData] / total * 100) : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
