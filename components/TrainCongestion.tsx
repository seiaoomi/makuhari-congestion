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

interface StationTheme {
  headerBg: string;
  headerText: string;
  headerSub: string;
  border: string;
  tipBorder: string;
  tipText: string;
  bullet: string;
}

const blueTheme: StationTheme = {
  headerBg: 'bg-blue-950',
  headerText: 'text-blue-400',
  headerSub: 'text-blue-600',
  border: 'border-blue-900',
  tipBorder: 'border-blue-900/50',
  tipText: 'text-blue-400',
  bullet: 'text-blue-400',
};

const tealTheme: StationTheme = {
  headerBg: 'bg-teal-950',
  headerText: 'text-teal-400',
  headerSub: 'text-teal-700',
  border: 'border-teal-900',
  tipBorder: 'border-teal-900/50',
  tipText: 'text-teal-400',
  bullet: 'text-teal-400',
};

function StationSection({
  stationName,
  subtitle,
  info,
  theme,
}: {
  stationName: string;
  subtitle: string;
  info: TrainInfo;
  theme: StationTheme;
}) {
  const config = levelConfig[info.level];

  function getLevelAt(hour: number): CongestionLevel {
    for (const range of info.peakHours) {
      const startH = parseInt(range.start.split(':')[0]);
      const endH = parseInt(range.end.split(':')[0]);
      if (hour >= startH && hour < endH) return range.level;
    }
    return 'low';
  }

  return (
    <div className={`border ${theme.border} rounded-xl overflow-hidden`}>
      <div className={`${theme.headerBg} px-4 py-2 flex items-center gap-2`}>
        <span className={`${theme.headerText} font-bold text-sm`}>{stationName}</span>
        <span className={`${theme.headerSub} text-xs`}>{subtitle}</span>
      </div>

      <div className="bg-gray-900 p-3 md:p-4 space-y-4">
        {/* スコアメーター */}
        <div className={`rounded-xl p-4 ${config.bg} border border-gray-800`}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className={`text-xl md:text-2xl font-bold ${config.color}`}>{config.label}</div>
              <div className="text-sm text-gray-400 mt-1">{info.summary}</div>
            </div>
            <div className={`text-2xl md:text-3xl font-black ${config.color}`}>
              {info.score}
              <span className="text-sm md:text-base text-gray-500">/100</span>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.bar} transition-all duration-700 rounded-full`}
              style={{ width: `${info.score}%` }}
            />
          </div>
        </div>

        {/* 混雑理由 */}
        {info.reasons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-1">混雑の理由</p>
            <ul className="space-y-1">
              {info.reasons.map((r, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className={theme.bullet}>・</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 時間帯別グラフ */}
        <div>
          <p className="text-xs text-gray-500 mb-2">時間帯別混雑</p>
          <div className="flex gap-0.5 items-end h-10 md:h-12">
            {hours.map(hour => {
              const lvl = getLevelAt(hour);
              const heights: Record<CongestionLevel, string> = {
                low: 'h-2', moderate: 'h-4', high: 'h-7', extreme: 'h-10',
              };
              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end">
                  <div className={`w-full rounded-t ${levelColor[lvl]} ${heights[lvl]} transition-all`} />
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
        </div>

        {/* 回避アドバイス */}
        {info.tips.length > 0 && (
          <div className={`border ${theme.tipBorder} rounded-lg p-3`}>
            <p className={`text-xs font-semibold ${theme.tipText} mb-1`}>混雑回避アドバイス</p>
            <ul className="space-y-1">
              {info.tips.map((t, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2">
                  <span className={theme.tipText}>✓</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainCongestion({
  trainInfo,
  toyosunaInfo,
}: {
  trainInfo: TrainInfo;
  toyosunaInfo: TrainInfo;
}) {
  return (
    <div className="space-y-4">
      <StationSection
        stationName="電車混雑予測（海浜幕張駅）"
        subtitle="京葉線"
        info={trainInfo}
        theme={blueTheme}
      />
      <StationSection
        stationName="電車混雑予測（幕張豊砂駅）"
        subtitle="京葉線・イオンモール直結"
        info={toyosunaInfo}
        theme={tealTheme}
      />
    </div>
  );
}
