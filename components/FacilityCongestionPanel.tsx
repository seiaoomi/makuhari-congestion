'use client';

import { FacilityInfo, CongestionLevel } from '@/types';

const levelConfig: Record<CongestionLevel, { label: string; color: string; bg: string; bar: string }> = {
  low:      { label: '空いている',  color: 'text-green-400',  bg: 'bg-green-900/30',  bar: 'bg-green-500' },
  moderate: { label: 'やや混雑',   color: 'text-yellow-400', bg: 'bg-yellow-900/30', bar: 'bg-yellow-500' },
  high:     { label: '混雑',       color: 'text-orange-400', bg: 'bg-orange-900/30', bar: 'bg-orange-500' },
  extreme:  { label: 'かなり混雑', color: 'text-red-400',    bg: 'bg-red-900/30',    bar: 'bg-red-500' },
};

function FacilityCard({ facility }: { facility: FacilityInfo }) {
  const cfg = levelConfig[facility.level];
  return (
    <div className={`rounded-xl p-3 border border-gray-800 ${cfg.bg}`}>
      <div className="text-xs text-gray-400 mb-1 truncate">{facility.name}</div>
      <div className="flex items-end justify-between mb-2">
        <span className={`text-base font-bold ${cfg.color}`}>{cfg.label}</span>
        <span className={`text-xl font-black ${cfg.color}`}>
          {facility.score}
          <span className="text-xs text-gray-500">/100</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${cfg.bar} rounded-full transition-all duration-500`}
          style={{ width: `${facility.score}%` }}
        />
      </div>
      {facility.activeEvents.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {facility.activeEvents.slice(0, 2).map(e => (
            <div key={e.id} className="text-[10px] text-gray-400 truncate">
              ● {e.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FacilityCongestionPanel({
  facilities,
}: {
  facilities: FacilityInfo[];
}) {
  return (
    <div>
      <h2 className="font-semibold text-gray-200 text-sm mb-3">施設別混雑予測</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {facilities.map(f => (
          <FacilityCard key={f.venue} facility={f} />
        ))}
      </div>
    </div>
  );
}
