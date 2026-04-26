import { MakuhariEvent, CongestionLevel, TimeRange } from '@/types';
import { isHoliday } from 'japanese-holidays';

export function calculateCongestionScore(params: {
  date: Date;
  events: MakuhariEvent[];
  weatherMultiplier?: number;
}): number {
  const { date, events, weatherMultiplier = 1.0 } = params;

  let score = 0;

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;

  score += isWeekend ? 35 : isFriday ? 20 : 10;

  if (isHoliday(date)) score += 20;

  score += getSpecialSeasonBonus(date);

  for (const event of events) {
    score += getEventScore(event);
  }

  score = Math.round(score * weatherMultiplier);

  return Math.min(100, score);
}

function getEventScore(event: MakuhariEvent): number {
  const attendanceScore: Record<MakuhariEvent['expectedAttendance'], number> = {
    small: 5,
    medium: 15,
    large: 30,
    massive: 50,
  };

  const venueMultiplier: Record<MakuhariEvent['venue'], number> = {
    makuhari_messe: 1.5,
    aeon_mall: 0.8,
    costco: 0.6,
    other: 0.4,
  };

  return Math.round(
    attendanceScore[event.expectedAttendance] * venueMultiplier[event.venue]
  );
}

export function scoreToLevel(score: number): CongestionLevel {
  if (score >= 75) return 'extreme';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

export function getHourlyPattern(
  score: number,
  events: MakuhariEvent[],
  isWeekend: boolean
): TimeRange[] {
  const hasMorningEvent = events.some(e => e.type === 'exhibition');
  const hasNightEvent = events.some(e => e.type === 'concert');
  const hasMallSale = events.some(e => e.type === 'sale');

  const patterns: TimeRange[] = [];

  if (isWeekend || hasMallSale) {
    patterns.push(
      { start: '10:00', end: '12:00', level: 'moderate' },
      { start: '12:00', end: '15:00', level: score >= 50 ? 'extreme' : 'high' },
      { start: '15:00', end: '18:00', level: score >= 50 ? 'high' : 'moderate' },
      { start: '18:00', end: '20:00', level: 'moderate' },
    );
  }

  if (hasMorningEvent) {
    patterns.push(
      { start: '08:30', end: '10:30', level: 'high' },
      { start: '17:00', end: '19:30', level: 'high' },
    );
  }

  if (hasNightEvent) {
    patterns.push(
      { start: '16:00', end: '18:30', level: 'extreme' },
      { start: '21:00', end: '23:00', level: 'extreme' },
    );
  }

  // 平日でイベントもセールもない場合のデフォルトパターン
  if (patterns.length === 0) {
    patterns.push(
      { start: '07:00', end: '09:00', level: 'moderate' },
      { start: '17:00', end: '19:00', level: 'moderate' },
    );
  }

  return patterns;
}

function getSpecialSeasonBonus(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 4 && day >= 29) || (month === 5 && day <= 5)) return 25;
  if (month === 8 && day >= 13 && day <= 16) return 20;
  if (month === 12 && day >= 27) return 20;
  if (month === 1 && day <= 3) return 15;
  return 0;
}
