'use client';

import { WeatherFactor } from '@/types';
import { getWeatherLabel, getWeatherIcon, getWeatherMultiplier } from '@/lib/weather';

const conditions: WeatherFactor['condition'][] = ['sunny', 'cloudy', 'rainy', 'snowy'];

export default function WeatherImpact({
  selected,
  onChange,
  isAutoFetched = false,
}: {
  selected: WeatherFactor['condition'];
  onChange: (condition: WeatherFactor['condition']) => void;
  isAutoFetched?: boolean;
}) {
  const multiplier = getWeatherMultiplier(selected);
  const multiplierText =
    multiplier > 1 ? `+${Math.round((multiplier - 1) * 100)}%` :
    multiplier < 1 ? `-${Math.round((1 - multiplier) * 100)}%` : '±0%';
  const multiplierColor =
    multiplier > 1 ? 'text-orange-400' :
    multiplier < 1 ? 'text-blue-400' : 'text-gray-400';

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-200">天気の影響</h2>
          {isAutoFetched && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-900 text-blue-300">
              自動取得
            </span>
          )}
        </div>
        <span className={`text-sm font-bold ${multiplierColor}`}>
          混雑スコア {multiplierText}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {conditions.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`flex flex-col items-center py-2 rounded-lg border transition-all ${
              selected === c
                ? 'border-orange-500 bg-orange-900/30'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <span className="text-xl">{getWeatherIcon(c)}</span>
            <span className="text-xs text-gray-300 mt-1">{getWeatherLabel(c)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
