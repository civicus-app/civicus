import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguageStore } from '../../store/languageStore';

type DistrictLevel = 'high' | 'medium' | 'low';

interface DistrictShape {
  id: string;
  name: string;
  points: string;
  label: {
    x: number;
    y: number;
    size: number;
    weight: 500 | 600;
  };
}

interface DistrictMetric {
  id: string;
  name: string;
  points: string;
  participation: number;
  level: DistrictLevel;
  label: DistrictShape['label'];
}

const DISTRICT_SHAPES: DistrictShape[] = [
  {
    id: 'kvaloya',
    name: 'Kvaloya',
    points: '76,172 124,110 198,80 255,106 272,164 240,216 176,246 112,232',
    label: { x: 130, y: 134, size: 20, weight: 500 },
  },
  {
    id: 'fastlandet',
    name: 'Fastlandet',
    points: '330,124 392,102 476,118 532,154 548,216 516,258 438,272 368,230 330,178',
    label: { x: 438, y: 176, size: 26, weight: 600 },
  },
  {
    id: 'tromsoya',
    name: 'Tromsoya',
    points: '270,122 304,108 336,126 338,196 306,222 274,204 260,164',
    label: { x: 285, y: 174, size: 20, weight: 600 },
  },
  {
    id: 'hakoya',
    name: 'Hakoya',
    points: '186,188 208,176 228,188 224,214 198,224 178,208',
    label: { x: 162, y: 238, size: 14, weight: 500 },
  },
];

const LEVEL_COLOR: Record<DistrictLevel, string> = {
  high: '#d94b56',
  medium: '#e8a44b',
  low: '#7fb1dd',
};

const normalizeDistrictName = (name: string) =>
  name
    .replace(/ø/gi, 'o')
    .replace(/å/gi, 'a')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const toParticipationLevel = (value: number, maxValue: number): DistrictLevel => {
  if (maxValue <= 0) return 'low';
  if (value >= maxValue * 0.66) return 'high';
  if (value >= maxValue * 0.33) return 'medium';
  return 'low';
};

export default function DistrictMap() {
  const language = useLanguageStore((state) => state.language);
  const tx = (no: string, en: string) => (language === 'en' ? en : no);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictMetric | null>(null);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchDistrictParticipation = async () => {
      const [{ data: votes }, { data: feedback }, { data: profiles }, { data: districts }] =
        await Promise.all([
          supabase.from('sentiment_votes').select('user_id'),
          supabase.from('feedback').select('user_id'),
          supabase.from('profiles').select('id, district_id'),
          supabase.from('districts').select('id, name'),
        ]);

      if (!isMounted) return;

      const participantIds = new Set<string>();
      (votes || []).forEach((vote: { user_id?: string }) => {
        if (vote.user_id) participantIds.add(vote.user_id);
      });
      (feedback || []).forEach((item: { user_id?: string | null }) => {
        if (item.user_id) participantIds.add(item.user_id);
      });

      const districtIdToName = new Map<string, string>();
      (districts || []).forEach((district: { id: string; name: string }) => {
        districtIdToName.set(district.id, district.name);
      });

      const computedCounts: Record<string, number> = {};
      (profiles || []).forEach((profile: { id: string; district_id?: string | null }) => {
        if (!participantIds.has(profile.id) || !profile.district_id) return;
        const districtName = districtIdToName.get(profile.district_id);
        if (!districtName) return;
        const key = normalizeDistrictName(districtName);
        computedCounts[key] = (computedCounts[key] || 0) + 1;
      });

      setDistrictCounts(computedCounts);
    };

    fetchDistrictParticipation();

    return () => {
      isMounted = false;
    };
  }, []);

  const districtMetrics = useMemo<DistrictMetric[]>(() => {
    const withCounts = DISTRICT_SHAPES.map((shape) => ({
      ...shape,
      participation: districtCounts[normalizeDistrictName(shape.name)] || 0,
    }));
    const maxValue = Math.max(...withCounts.map((item) => item.participation), 0);

    return withCounts.map((item) => ({
      ...item,
      level: toParticipationLevel(item.participation, maxValue),
    }));
  }, [districtCounts]);

  const orderedDistricts = useMemo(
    () => [...districtMetrics].sort((a, b) => b.participation - a.participation),
    [districtMetrics]
  );

  return (
    <div className="relative">
      <div className="relative rounded-lg overflow-hidden border border-[#d4dde9] bg-gradient-to-r from-[#cce4f6] via-[#d9ecf9] to-[#e8f2fb] p-1.5 sm:p-2">
        <svg viewBox="0 0 640 360" className="w-full h-56 sm:h-72">
          <path
            d="M36 76C116 36 242 24 334 46c72 18 124 54 178 50 42-3 72-26 106-18 24 6 32 30 12 48-28 24-70 38-88 64-22 34-10 76-44 98-32 22-78 12-124 8-72-6-156 14-228-14-60-24-114-90-102-148 6-28 28-50 50-62z"
            fill="#ecf3fb"
            opacity="0.9"
          />

          {districtMetrics.map((district) => (
            <polygon
              key={district.id}
              points={district.points}
              fill={LEVEL_COLOR[district.level]}
              stroke="#e6eef6"
              strokeWidth={2}
              className="cursor-pointer transition-opacity hover:opacity-90"
              onMouseEnter={() => setHoveredDistrict(district)}
              onMouseLeave={() => setHoveredDistrict(null)}
            />
          ))}

          {districtMetrics.map((district) => (
            <text
              key={`${district.id}-label`}
              x={district.label.x}
              y={district.label.y}
              fontSize={district.label.size}
              fill="#2a4a70"
              fontWeight={district.label.weight}
            >
              {district.name}
            </text>
          ))}
        </svg>

        <div className="md:absolute md:bottom-4 md:right-4 mt-2 md:mt-0 bg-white/95 border border-[#ccd7e6] rounded-lg shadow-sm px-3 py-2.5 w-full md:w-[220px]">
          <p className="text-sm sm:text-base font-semibold text-[#284867] mb-2">
            {tx('Deltakelsesniva', 'Participation Level')}
          </p>
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-[#2e4d71]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: LEVEL_COLOR.high }}
              />
              {tx('Hoy', 'High')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: LEVEL_COLOR.medium }}
              />
              {tx('Middels', 'Medium')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: LEVEL_COLOR.low }}
              />
              {tx('Lav', 'Low')}
            </span>
          </div>
        </div>

        {hoveredDistrict && (
          <div className="hidden sm:block absolute top-4 left-4 bg-white border border-[#cfd9e8] rounded-lg px-3 py-2 shadow-sm">
            <p className="text-sm font-semibold text-[#29496c]">{hoveredDistrict.name}</p>
            <p className="text-xs text-[#4b6587]">
              {hoveredDistrict.participation.toLocaleString()} {tx('deltakere', 'participants')}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {orderedDistricts.map((district) => (
          <div
            key={district.id}
            className="bg-white border border-[#d4dde9] rounded-md px-3 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LEVEL_COLOR[district.level] }}
              />
              <span className="text-sm text-[#2f4e71]">{district.name}</span>
            </div>
            <span className="text-sm font-semibold text-[#274567]">
              {district.participation.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
