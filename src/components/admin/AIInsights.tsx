import { Link } from 'react-router-dom';

const SUMMARY_POINTS = [
  {
    bold: '75%',
    text: 'support expanding public transport.',
  },
  {
    bold: 'Concerns about',
    text: 'parking reductions and budget allocation.',
  },
  {
    bold: 'Suggested:',
    text: 'Increase transparency on funding and adjust parking plans.',
  },
];

export default function AIInsights() {
  return (
    <div className="flex flex-col h-full">
      <div className="rounded-md border border-[#d4dde9] bg-[#eef3f9] px-4 sm:px-5 py-4 space-y-3 text-[#1f3d60]">
        {SUMMARY_POINTS.map((point, index) => (
          <p key={index} className="text-base sm:text-lg leading-relaxed">
            <span className="font-semibold">{point.bold}</span>{' '}
            <span className="font-normal">{point.text}</span>
          </p>
        ))}
      </div>

      <div className="mt-auto pt-4 flex justify-end">
        <Link
          to="/admin/analytics"
          className="inline-flex items-center rounded-md bg-[#3279cb] hover:bg-[#2a68b3] text-white text-sm sm:text-base font-medium px-5 py-2 transition-colors"
        >
          View All
        </Link>
      </div>
    </div>
  );
}
