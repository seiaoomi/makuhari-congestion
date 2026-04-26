import { TimeRange, CongestionLevel } from '@/types';

const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6〜23時

const levelColor: Record<CongestionLevel, string> = {
  low: 'bg-green-600',
  moderate: 'bg-yellow-500',
  high: 'bg-orange-500',
  extreme: 'bg-red-500',
};

const levelLabel: Record<CongestionLevel, string> = {
  low: '空き',
  moderate: 'やや混',
  high: '混雑',
  extreme: '激混み',
};

export default function CongestionTimeline({ peakHours }: { peakHours: TimeRange[] }) {
  function getLevelAt(hour: number): CongestionLevel {
    for (const range of peakHours) {
      const startH = parseInt(range.start.split(':')[0]);
      const endH = parseInt(range.end.split(':')[0]);
      if (hour >= startH && hour < endH) return range.level;
    }
    return 'low';
  }

  return (
    <div className="bg-gray-900 rounded-xl p-3 md:p-4">
      <h2 className="font-semibold text-gray-200 mb-3">時間帯別混雑予測</h2>
      <div className="flex gap-0.5 items-end h-12 md:h-16">
        {hours.map(hour => {
          const level = getLevelAt(hour);
          const heights: Record<CongestionLevel, string> = {
            low: 'h-3',
            moderate: 'h-6',
            high: 'h-9',
            extreme: 'h-12',
          };
          return (
            <div key={hour} className="flex-1 flex flex-col items-center justify-end">
              <div className={`w-full rounded-t ${levelColor[level]} ${heights[level]} transition-all`} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5 mt-1">
        {hours.map(hour => (
          <div key={hour} className="flex-1 text-center text-[10px] text-gray-600">
            {hour % 6 === 0 ? `${hour}` : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-2 md:gap-3 mt-3 text-xs flex-wrap">
        {(Object.keys(levelColor) as CongestionLevel[]).map(l => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${levelColor[l]}`} />
            <span className="text-gray-400">{levelLabel[l]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
