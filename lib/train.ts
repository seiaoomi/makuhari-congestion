import { MakuhariEvent, CongestionLevel, TimeRange } from '@/types';
import { isHoliday } from 'japanese-holidays';

// 電車（京葉線・海浜幕張駅）の混雑スコア計算 (0-100)
// 道路と別ロジック: 駅の乗降集中がピークになるため、ピーク時間帯の形が異なる
export function calculateTrainScore(params: {
  date: Date;
  events: MakuhariEvent[];
}): number {
  const { date, events } = params;

  let score = 0;

  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;

  // 電車は平日通勤でも一定の混雑がある
  score += isWeekend ? 25 : isFriday ? 20 : 15;

  if (isHoliday(date)) score += 20;

  score += getSpecialSeasonBonus(date);

  for (const event of events) {
    score += getTrainEventScore(event);
  }

  return Math.min(100, score);
}

function getTrainEventScore(event: MakuhariEvent): number {
  // 電車への影響は幕張メッセ直結の会場が最大
  // コストコ・イオンは車来場が多く電車への影響は小さい
  const attendanceScore: Record<MakuhariEvent['expectedAttendance'], number> = {
    small: 5,
    medium: 15,
    large: 35,
    massive: 55,
  };

  const venueMultiplier: Record<MakuhariEvent['venue'], number> = {
    makuhari_messe: 1.5,  // 海浜幕張駅直結
    zozo_marine: 1.3,     // 徒歩15分・シャトルバスで京葉線利用多い
    mitsui_outlet: 0.7,   // 海浜幕張駅から徒歩圏内
    aeon_mall: 0.4,       // 車来場が主体・幕張豊砂駅利用が多い
    costco: 0.2,          // ほぼ車のみ
    beach_park: 0.3,
    toyosuna_park: 0.3,
    other: 0.3,
  };

  return Math.round(
    attendanceScore[event.expectedAttendance] * venueMultiplier[event.venue]
  );
}

export function scoreToTrainLevel(score: number): CongestionLevel {
  if (score >= 75) return 'extreme';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

// 電車の時間帯別混雑パターン
// 道路と異なり、イベント開始30〜60分前・終了直後に駅が集中混雑する
export function getTrainHourlyPattern(
  score: number,
  events: MakuhariEvent[],
  isWeekend: boolean
): TimeRange[] {
  const hasExhibition = events.some(e => e.type === 'exhibition' && e.venue === 'makuhari_messe');
  const hasConcert = events.some(e => e.type === 'concert' && e.venue === 'makuhari_messe');
  const hasFestival = events.some(e => e.type === 'festival' && e.venue === 'makuhari_messe');
  const hasSports = events.some(e => e.type === 'sports' && e.venue === 'zozo_marine');

  const patterns: TimeRange[] = [];

  if (hasConcert || hasFestival) {
    // コンサート・フェス: 開演1時間前の入場集中と、終演後の帰宅ラッシュが激しい
    patterns.push(
      { start: '16:00', end: '18:00', level: 'high' },
      { start: '21:00', end: '23:00', level: score >= 60 ? 'extreme' : 'high' },
    );
  }

  if (hasExhibition) {
    // 展示会: 朝の開場・夕方の閉場で混雑、コンサートより分散傾向
    patterns.push(
      { start: '09:00', end: '10:30', level: 'high' },
      { start: '17:30', end: '19:30', level: 'high' },
    );
  }

  if (hasSports) {
    // 野球ナイター（18時開始）：終了後に海浜幕張駅へ一斉集中
    patterns.push(
      { start: '16:30', end: '18:00', level: 'moderate' },
      { start: '20:30', end: '22:30', level: score >= 50 ? 'extreme' : 'high' },
    );
  }

  // 週末・祝日: 昼間ベースラインをスコアに応じて追加（イベント有無に関わらず）
  // ※ イベント固有パターンの後に追加するため、重複時はイベント側が優先される
  if (isWeekend) {
    const dayPeak: CongestionLevel = score >= 75 ? 'extreme' : score >= 50 ? 'high' : 'moderate';
    const dayOff: CongestionLevel  = score >= 50 ? 'moderate' : 'low';
    patterns.push(
      { start: '10:00', end: '14:00', level: dayPeak },
      { start: '14:00', end: '18:00', level: dayOff },
    );
  }

  // 平日通勤ラッシュ（イベント有無に関わらず）
  if (!isWeekend) {
    patterns.push(
      { start: '07:30', end: '09:00', level: 'moderate' },
      { start: '18:00', end: '20:00', level: 'moderate' },
    );
  }

  if (patterns.length === 0) {
    patterns.push({ start: '07:30', end: '09:00', level: 'low' });
  }

  return patterns;
}

// ── 幕張豊砂駅（京葉線）──
// イオンモール幕張新都心と直結、コストコ幕張の最寄り駅。買い物客主体で混雑。

export function calculateToyosunaScore(params: {
  date: Date;
  events: MakuhariEvent[];
}): number {
  const { date, events } = params;
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isFriday = dayOfWeek === 5;

  let score = isWeekend ? 20 : isFriday ? 15 : 10;
  if (isHoliday(date)) score += 15;
  score += getSpecialSeasonBonus(date);

  for (const event of events) {
    score += getToyosunaEventScore(event);
  }

  return Math.min(100, score);
}

function getToyosunaEventScore(event: MakuhariEvent): number {
  const attendanceScore: Record<MakuhariEvent['expectedAttendance'], number> = {
    small: 5, medium: 15, large: 35, massive: 55,
  };
  const venueMultiplier: Record<MakuhariEvent['venue'], number> = {
    aeon_mall: 1.2,       // 駅直結
    costco: 0.3,          // 最寄り駅だが車来場が大半
    beach_park: 0.3,
    toyosuna_park: 0.3,
    mitsui_outlet: 0.1,   // 海浜幕張駅の方が近い
    makuhari_messe: 0.1,
    zozo_marine: 0.1,
    other: 0.2,
  };
  return Math.round(attendanceScore[event.expectedAttendance] * venueMultiplier[event.venue]);
}

export function getToyosunaHourlyPattern(
  score: number,
  events: MakuhariEvent[],
  isWeekend: boolean
): TimeRange[] {
  const hasSale = events.some(e =>
    e.type === 'sale' && (e.venue === 'aeon_mall' || e.venue === 'mitsui_outlet')
  );

  const patterns: TimeRange[] = [];

  // 週末・祝日・セール: 買い物客で昼間混雑（スコアに応じてレベル変動）
  if (isWeekend || hasSale) {
    const dayPeak: CongestionLevel = score >= 75 ? 'extreme' : score >= 50 ? 'high' : 'moderate';
    const dayOff: CongestionLevel  = score >= 50 ? 'moderate' : 'low';
    patterns.push(
      { start: '11:00', end: '15:00', level: dayPeak },
      { start: '15:00', end: '18:00', level: dayOff },
    );
  }

  // 平日通勤ラッシュ
  if (!isWeekend) {
    patterns.push(
      { start: '07:30', end: '09:00', level: 'moderate' },
      { start: '18:00', end: '20:00', level: 'moderate' },
    );
  }

  if (patterns.length === 0) {
    patterns.push({ start: '07:30', end: '09:00', level: 'low' });
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
