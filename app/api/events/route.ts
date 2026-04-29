import { NextRequest, NextResponse } from 'next/server';
import { MakuhariEvent } from '@/types';
import Anthropic from '@anthropic-ai/sdk';
import knownEvents from '@/data/known-events.json';

const client = new Anthropic();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || String(new Date().getMonth() + 1);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ events: getFallbackEvents(year, month) });
  }

  const [messeResult, aeonResult, marinesResult] = await Promise.allSettled([
    fetchMakuhariMesseEvents(year, month),
    fetchAeonMallEvents(year, month),
    fetchMarinesEvents(year, month),
  ]);

  const scraped: MakuhariEvent[] = [
    ...(messeResult.status === 'fulfilled' ? messeResult.value : []),
    ...(aeonResult.status === 'fulfilled' ? aeonResult.value : []),
    ...(marinesResult.status === 'fulfilled' ? marinesResult.value : []),
  ];

  const fallback = getFallbackEvents(year, month);
  return NextResponse.json({ events: mergeEvents(scraped, fallback) });
}

async function fetchMakuhariMesseEvents(year: string, month: string): Promise<MakuhariEvent[]> {
  const res = await fetch('https://www.m-messe.co.jp/event/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CongestionApp/1.0)' },
    next: { revalidate: 3600 },
  });
  const html = await res.text();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `以下の幕張メッセ公式サイトのHTMLから、${year}年${month}月のイベント情報を抽出し、JSON配列で返してください。

HTML（最初の5000文字）:
${html.substring(0, 5000)}

以下の形式で返してください（JSONのみ、説明文不要）:
[
  {
    "id": "一意のID",
    "name": "イベント名",
    "venue": "makuhari_messe",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "expectedAttendance": "small|medium|large|massive",
    "type": "concert|exhibition|sports|sale|festival|other",
    "source": "makuhari_messe_official"
  }
]

attendanceの目安:
- massive: 東京オートサロン、ニコニコ超会議、大型コンサート（5万人超）
- large: 中規模展示会・コンサート（1〜5万人）
- medium: 就職セミナー・中小イベント（数千〜1万人）
- small: 小規模イベント（〜数千人）`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function fetchAeonMallEvents(year: string, month: string): Promise<MakuhariEvent[]> {
  const res = await fetch('https://makuhari.aeonmall.com/event/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CongestionApp/1.0)' },
    next: { revalidate: 3600 },
  });
  const html = await res.text();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `以下のイオンモール幕張新都心公式サイトのHTMLから、${year}年${month}月のセール・イベント情報を抽出し、JSON配列で返してください。

HTML（最初の5000文字）:
${html.substring(0, 5000)}

以下の形式で返してください（JSONのみ、説明文不要）:
[
  {
    "id": "aeon-一意のID",
    "name": "イベント名",
    "venue": "aeon_mall",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "expectedAttendance": "small|medium|large|massive",
    "type": "sale|festival|other",
    "source": "aeon_mall_official"
  }
]

attendanceの目安:
- large: 大型セール・人気イベント（数万人規模）
- medium: 通常セール・催事（数千〜1万人）
- small: 小規模イベント（〜数千人）

イベントが見つからない場合は空配列 [] を返してください。`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

async function fetchMarinesEvents(year: string, month: string): Promise<MakuhariEvent[]> {
  const res = await fetch('https://www.marines.co.jp/schedule/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CongestionApp/1.0)' },
    next: { revalidate: 3600 },
  });
  const html = await res.text();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `以下の千葉ロッテマリーンズ公式サイトのHTMLから、${year}年${month}月のZOZOマリンスタジアムでのホームゲーム（試合・コンサート等）を抽出し、JSON配列で返してください。アウェーゲームは除外してください。

HTML（最初の8000文字）:
${html.substring(0, 8000)}

以下の形式で返してください（JSONのみ、説明文不要）:
[
  {
    "id": "marines-YYYYMMDD",
    "name": "対戦相手を含む試合名（例：ロッテ vs 日本ハム）",
    "venue": "zozo_marine",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "expectedAttendance": "medium",
    "type": "sports",
    "source": "marines_official"
  }
]

注意：
- ホームゲームのみ（ZOZOマリンスタジアム開催）
- 連戦（3連戦等）は1試合ずつ別エントリで
- コンサート等の非野球イベントは type を "concert" にし attendance を "large" に
- 該当なしは空配列 [] を返す`,
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
}

function mergeEvents(scraped: MakuhariEvent[], fallback: MakuhariEvent[]): MakuhariEvent[] {
  const ids = new Set(scraped.map(e => e.id));
  return [...scraped, ...fallback.filter(e => !ids.has(e.id))];
}

function getFallbackEvents(year: string, month: string): MakuhariEvent[] {
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);

  const fromJson = (knownEvents as MakuhariEvent[]).filter(e => {
    const start = new Date(e.startDate);
    return start.getFullYear() === yearNum && (start.getMonth() + 1) === monthNum;
  });

  const dynamic: MakuhariEvent[] = [];

  if (monthNum === 1) {
    dynamic.push({
      id: `auto-salon-${year}`,
      name: '東京オートサロン',
      venue: 'makuhari_messe',
      startDate: `${year}-01-09`,
      endDate: `${year}-01-11`,
      expectedAttendance: 'massive',
      type: 'exhibition',
      source: 'known_events',
    });
  }

  if (monthNum === 4) {
    dynamic.push({
      id: `niconico-chokaigi-${year}`,
      name: 'ニコニコ超会議',
      venue: 'makuhari_messe',
      startDate: `${year}-04-25`,
      endDate: `${year}-04-26`,
      expectedAttendance: 'massive',
      type: 'festival',
      source: 'known_events',
    });
  }

  const dynamicIds = new Set(dynamic.map(e => e.id));
  return [...dynamic, ...fromJson.filter(e => !dynamicIds.has(e.id))];
}
