import { CongestionLevel } from '@/types';

const levelConfig = {
  low:      { label: '空いている',  color: 'text-green-400',  bg: 'bg-green-900/30',  bar: 'bg-green-500' },
  moderate: { label: 'やや混雑',   color: 'text-yellow-400', bg: 'bg-yellow-900/30', bar: 'bg-yellow-500' },
  high:     { label: '混雑',       color: 'text-orange-400', bg: 'bg-orange-900/30', bar: 'bg-orange-500' },
  extreme:  { label: 'かなり混雑', color: 'text-red-400',    bg: 'bg-red-900/30',    bar: 'bg-red-500' },
};

export default function CongestionMeter({ score, level, summary }: {
  score: number;
  level: CongestionLevel;
  summary: string;
}) {
  const config = levelConfig[level];

  return (
    <div className={`rounded-xl p-5 ${config.bg} border border-gray-800`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className={`text-3xl font-bold ${config.color}`}>
            {config.label}
          </div>
          <div className="text-sm text-gray-400 mt-1">{summary}</div>
        </div>
        <div className={`text-4xl font-black ${config.color}`}>
          {score}
          <span className="text-lg text-gray-500">/100</span>
        </div>
      </div>

      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all duration-700 rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>0</span>
        <span className="text-green-600">25</span>
        <span className="text-yellow-600">50</span>
        <span className="text-orange-600">75</span>
        <span className="text-red-600">100</span>
      </div>
    </div>
  );
}
