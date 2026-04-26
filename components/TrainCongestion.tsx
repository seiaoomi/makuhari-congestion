import { TrainInfo, CongestionLevel } from '@/types';

const levelConfig = {
  low:      { label: '空いている',  color: 'text-green-400',  bg: 'bg-green-900/30',  bar: 'bg-green-500' },
  moderate: { label: 'やや混雑',   color: 'text-yellow-400', bg: 'bg-yellow-900/30', bar: 'bg-yellow-500' },
  high:     { label: '混雑',       color: 'text-orange-400', bg: 'bg-orange-900/30', bar: 'bg-orange-500' },
  extreme:  { label: 'かなり混雑', color: 'text-red-400',    bg: 'bg-red-900/30',    bar: 'bg-red-500' },
};

const hours = Array.from({ length: 18 }, (_, i) => i + 6);

const levelColor: Record<CongestionLevel, string> = {
  low: 'bg-green-600',
  moderate: 'bg-yellow-500',
  high: 'bg-orange-500',
  extreme: 'bg-red-500',
};

export default function TrainCongestion({ trainInfo }: { trainInfo: TrainInfo }) {
  const config = levelConfig[trainInfo.level];

  function getLevelAt(hour: number): CongestionLevel {
    for (const range of trainInfo.peakHours) {
      const startH = parseInt(range.start.split(':')[0]);
      const endH = parseInt(range.end.split(':')[0]);
      if (hour >= startH && hour < endH) return range.level;
    }
    return 'low';
  }

  return (
    <div className="border border-blue-900 rounded-xl overflow-hidden">
      {/* ヘッダー：電車セクションであることを明示 */}
      <div className="bg-blue-950 px-4 py-2 flex items-center gap-2">
        <span className="text-blue-400 font-bold text-sm">電車混雑予測</span>
        <span className="text-blue-600 text-xs">京葉線・海浜幕張駅</span>
      </div>

      <div className="bg-gray-900 p-4 space-y-4">
        {/* スコアメーター */}
        <div className={`rounded-xl p-4 ${config.bg} border border-gray-800`}>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className={`text-2xl font-bold ${config.color}`}>{config.label}</div>
              <div className="text-sm text-gray-400 mt-1">{trainInfo.summary}</div>
            </div>
            <div className={`text-3xl font-black ${config.color}`}>
              {trainInfo.score}
              <span className="text-base text-gray-500">/100</span>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.bar} transition-all duration-700 rounded-full`}
              style={{ width: `${trainInfo.score}%` }}
            />
          </div>
        </div>

        {/* 時間帯別グラフ */}
        <div>
          <p className="text-xs text-gray-500 mb-2">時間帯別混雑</p>
          <div className="flex gap-1 items-end h-12">
            {hours.map(hour => {
              const lvl = getLevelAt(hour);
              const heights: Record<CongestionLevel, string> = {
                low: 'h-3', moderate: 'h-6', high: 'h-9', extreme: 'h-12',
              };
              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end">
                  <div className={`w-full rounded-t ${levelColor[lvl]} ${heights[lvl]} transition-all`} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1">
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-center text-xs text-gray-600">
                {hour % 3 === 0 ? `${hour}` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* 混雑理由 */}
        {trainInfo.reasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-1">混雑の理由</p>
            <ul className="space-y-1">
              {trainInfo.reasons.map((r, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-blue-400">・</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 回避アドバイス */}
        {trainInfo.tips.length > 0 && (
          <div className="border border-blue-900/50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-400 mb-1">混雑回避アドバイス</p>
            <ul className="space-y-1">
              {trainInfo.tips.map((t, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className="text-blue-400">✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
