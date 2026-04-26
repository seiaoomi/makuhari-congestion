'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CongestionLevel, WeatherFactor } from '@/types';
import { getWeatherIcon } from '@/lib/weather';

interface DayScore {
  date: Date;
  score: number;
  level: CongestionLevel;
  condition?: WeatherFactor['condition'];
}

const levelBg: Record<CongestionLevel, string> = {
  low: 'bg-green-900/50 border-green-800',
  moderate: 'bg-yellow-900/50 border-yellow-800',
  high: 'bg-orange-900/50 border-orange-800',
  extreme: 'bg-red-900/50 border-red-800',
};

const levelText: Record<CongestionLevel, string> = {
  low: 'text-green-400',
  moderate: 'text-yellow-400',
  high: 'text-orange-400',
  extreme: 'text-red-400',
};

const levelLabel: Record<CongestionLevel, string> = {
  low: '空き',
  moderate: 'やや混',
  high: '混雑',
  extreme: '激混',
};

export default function CongestionCalendar({
  dayScores,
  selectedDate,
  onSelect,
}: {
  dayScores: DayScore[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="font-semibold text-gray-200 mb-3">10日間の混雑予報</h2>
      <div className="grid grid-cols-10 gap-1">
        {dayScores.map(({ date, score, level, condition }) => {
          const isSelected =
            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          return (
            <button
              key={format(date, 'yyyy-MM-dd')}
              onClick={() => onSelect(date)}
              className={`rounded-lg p-2 border text-center transition-all ${
                isSelected
                  ? 'ring-2 ring-orange-400 ' + levelBg[level]
                  : levelBg[level] + ' opacity-80 hover:opacity-100'
              }`}
            >
              <div className="text-xs text-gray-400">
                {format(date, 'E', { locale: ja })}
              </div>
              <div className="text-sm font-semibold text-gray-200">
                {format(date, 'M/d')}
              </div>
              <div className={`text-xs font-bold mt-0.5 ${levelText[level]}`}>
                {levelLabel[level]}
              </div>
              <div className={`text-xs ${levelText[level]}`}>{score}</div>
              {condition && (
                <div className="text-sm mt-0.5">{getWeatherIcon(condition)}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
