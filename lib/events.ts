import { MakuhariEvent } from '@/types';

export function getEventsForDate(events: MakuhariEvent[], date: Date): MakuhariEvent[] {
  const dateStr = formatDate(date);
  return events.filter(e => e.startDate <= dateStr && dateStr <= e.endDate);
}

export function getAttendanceLabel(attendance: MakuhariEvent['expectedAttendance']): string {
  const labels: Record<MakuhariEvent['expectedAttendance'], string> = {
    small: '小規模（〜5,000人）',
    medium: '中規模（5,000〜3万人）',
    large: '大規模（3〜10万人）',
    massive: '超大規模（10万人超）',
  };
  return labels[attendance];
}

export function getVenueLabel(venue: MakuhariEvent['venue']): string {
  const labels: Record<MakuhariEvent['venue'], string> = {
    makuhari_messe: '幕張メッセ',
    aeon_mall: 'イオンモール幕張新都心',
    costco: 'コストコ幕張',
    other: 'その他',
  };
  return labels[venue];
}

export function getTypeLabel(type: MakuhariEvent['type']): string {
  const labels: Record<MakuhariEvent['type'], string> = {
    concert: 'コンサート',
    exhibition: '展示会',
    sports: 'スポーツ',
    sale: 'セール',
    festival: 'フェス・イベント',
    other: 'その他',
  };
  return labels[type];
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
