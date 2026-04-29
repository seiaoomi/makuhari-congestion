import { MakuhariEvent, FacilityInfo, CongestionLevel, WeatherFactor } from '@/types';
import { isHoliday } from 'japanese-holidays';
import { getEventsForDate } from './events';

interface FacilityConfig {
  venue: MakuhariEvent['venue'];
  name: string;
  weekdayBase: number;
  weekendBase: number;
  weatherSensitive: boolean;
}

const FACILITY_CONFIGS: FacilityConfig[] = [
  { venue: 'makuhari_messe',  name: '幕張メッセ',              weekdayBase: 5,  weekendBase: 15, weatherSensitive: false },
  { venue: 'zozo_marine',     name: 'ZOZOマリンスタジアム',     weekdayBase: 5,  weekendBase: 15, weatherSensitive: false },
  { venue: 'aeon_mall',       name: 'イオンモール幕張新都心',    weekdayBase: 30, weekendBase: 55, weatherSensitive: false },
  { venue: 'mitsui_outlet',   name: '三井アウトレットパーク幕張',weekdayBase: 25, weekendBase: 50, weatherSensitive: false },
  { venue: 'costco',          name: 'コストコ幕張',             weekdayBase: 25, weekendBase: 50, weatherSensitive: false },
  { venue: 'beach_park',      name: '幕張海浜公園',             weekdayBase: 10, weekendBase: 40, weatherSensitive: true  },
  { venue: 'toyosuna_park',   name: '豊砂公園',                weekdayBase: 8,  weekendBase: 30, weatherSensitive: true  },
];

const EVENT_BONUS: Record<MakuhariEvent['expectedAttendance'], number> = {
  small: 8, medium: 20, large: 35, massive: 55,
};

function scoreToLevel(score: number): CongestionLevel {
  if (score >= 75) return 'extreme';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

function getSeasonBonus(date: Date): number {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 4 && d >= 29) || (m === 5 && d <= 5)) return 20;
  if (m === 8 && d >= 13 && d <= 16) return 15;
  if (m === 12 && d >= 27) return 15;
  if (m === 1 && d <= 3) return 10;
  // 春・夏シーズンは公園系の賑わいが増す
  if (m >= 3 && m <= 5) return 5;
  if (m >= 7 && m <= 8) return 8;
  return 0;
}

function getWeatherFactor(condition: WeatherFactor['condition']): number {
  switch (condition) {
    case 'sunny':        return 1.3;
    case 'partly_cloudy':return 1.1;
    case 'cloudy':       return 1.0;
    case 'foggy':        return 0.8;
    case 'drizzle':      return 0.5;
    case 'rainy':        return 0.3;
    case 'thunderstorm': return 0.2;
    case 'snowy':        return 0.4;
    case 'heavy_snow':   return 0.2;
  }
}

export function calculateFacilityScores(
  date: Date,
  allEvents: MakuhariEvent[],
  weatherCondition: WeatherFactor['condition']
): FacilityInfo[] {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || !!isHoliday(date);
  const seasonBonus = getSeasonBonus(date);
  const dayEvents = getEventsForDate(allEvents, date);

  return FACILITY_CONFIGS.map(config => {
    let score = isWeekend ? config.weekendBase : config.weekdayBase;

    // 祝日ボーナス
    if (!isWeekend && isHoliday(date)) score += 10;

    // 季節ボーナス
    score += seasonBonus;

    // 当施設のイベントボーナス
    const venueEvents = dayEvents.filter(e => e.venue === config.venue);
    for (const e of venueEvents) {
      score += EVENT_BONUS[e.expectedAttendance];
    }

    // 天気による補正（屋外施設のみ）
    if (config.weatherSensitive) {
      score = Math.round(score * getWeatherFactor(weatherCondition));
    }

    score = Math.min(100, score);

    return {
      venue: config.venue,
      name: config.name,
      score,
      level: scoreToLevel(score),
      activeEvents: venueEvents,
    };
  });
}
