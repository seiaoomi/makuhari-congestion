import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { MakuhariEvent, TrainInfo } from '@/types';
import { calculateCongestionScore, scoreToLevel, getHourlyPattern } from '@/lib/congestion';
import { calculateTrainScore, scoreToTrainLevel, getTrainHourlyPattern, calculateToyosunaScore, getToyosunaHourlyPattern } from '@/lib/train';
import { getVenueLabel } from '@/lib/events';
import { isHoliday } from 'japanese-holidays';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const {
    date,
    events,
    weatherMultiplier = 1.0,
  }: { date: string; events: MakuhariEvent[]; weatherMultiplier?: number } = await req.json();

  const targetDate = new Date(date);
  const isWeekend = [0, 6].includes(targetDate.getDay()) || !!isHoliday(targetDate);
  const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][targetDate.getDay()];

  // 道路スコア
  const score = calculateCongestionScore({ date: targetDate, events, weatherMultiplier });
  const level = scoreToLevel(score);
  const hourlyPattern = getHourlyPattern(score, events, isWeekend);

  // 電車スコア（天気の影響なし）
  const trainScore = calculateTrainScore({ date: targetDate, events });
  const trainLevel = scoreToTrainLevel(trainScore);
  const trainHourlyPattern = getTrainHourlyPattern(trainScore, events, isWeekend);

  // 幕張豊砂駅スコア
  const toyosunaScore = calculateToyosunaScore({ date: targetDate, events });
  const toyosunaLevel = scoreToTrainLevel(toyosunaScore);
  const toyosunaHourlyPattern = getToyosunaHourlyPattern(toyosunaScore, events, isWeekend);

  const eventSummary = events.length > 0
    ? events.map(e => `・${e.name}（${getVenueLabel(e.venue)}、${e.expectedAttendance}規模）`).join('\n')
    : '特になし';

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      date, score, level,
      peakHours: hourlyPattern,
      reasons: buildDefaultRoadReasons(score, events, isWeekend),
      tips: buildDefaultRoadTips(score, isWeekend),
      summary: `道路混雑スコア: ${score}/100`,
      events,
      trainInfo: buildDefaultTrainInfo(trainScore, trainLevel, trainHourlyPattern, events, isWeekend),
      toyosunaInfo: buildDefaultToyosunaInfo(toyosunaScore, toyosunaLevel, toyosunaHourlyPattern, events, isWeekend),
    });
  }

  // 道路・電車の理由/アドバイスを1回のAPI呼び出しで生成（トークン節約）
  const prompt = `あなたは幕張エリア（幕張メッセ・ZOZOマリンスタジアム・イオンモール幕張新都心・コストコ幕張）の交通専門家です。

## 予測対象日
${date}（${dayLabel}曜日）

## 開催イベント
${eventSummary}

## 道路混雑スコア: ${score}/100（${level}）
## 電車混雑スコア（京葉線・海浜幕張駅）: ${trainScore}/100（${trainLevel}）

以下のJSON形式で**道路**・**海浜幕張駅**・**幕張豊砂駅**の情報を分けて返してください：
{
  "road": {
    "reasons": ["道路混雑理由1（具体的に）", ...],
    "tips": ["道路回避アドバイス1（時間・ルートを含む）", ...],
    "summary": "道路サマリー（30文字以内）"
  },
  "train": {
    "reasons": ["海浜幕張駅混雑理由1（具体的に）", ...],
    "tips": ["海浜幕張駅回避アドバイス1（時間・乗換を含む）", ...],
    "summary": "海浜幕張駅サマリー（30文字以内）"
  },
  "toyosuna": {
    "reasons": ["幕張豊砂駅混雑理由1（具体的に）", ...],
    "tips": ["幕張豊砂駅回避アドバイス1（時間を含む）", ...],
    "summary": "幕張豊砂駅サマリー（30文字以内）"
  }
}

注意：
- 各reasonsは最大4個、各tipsは最大4個
- 道路は幕張IC・湾岸道路・国道357号、海浜幕張駅は京葉線・幕張メッセ/ZOZOマリン来場者が中心
- 幕張豊砂駅はイオンモール幕張新都心直結・コストコ幕張最寄り駅（週末の買い物客が中心）
- ZOZOマリンスタジアムの野球ナイターは18時開始が多く、試合終了後（21〜22時）に帰宅ラッシュ発生
- JSONのみ返す`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const aiData = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

    return NextResponse.json({
      date, score, level,
      peakHours: hourlyPattern,
      reasons: aiData.road?.reasons || [],
      tips: aiData.road?.tips || [],
      summary: aiData.road?.summary || '',
      events,
      trainInfo: {
        level: trainLevel,
        score: trainScore,
        peakHours: trainHourlyPattern,
        reasons: aiData.train?.reasons || [],
        tips: aiData.train?.tips || [],
        summary: aiData.train?.summary || '',
      },
      toyosunaInfo: {
        level: toyosunaLevel,
        score: toyosunaScore,
        peakHours: toyosunaHourlyPattern,
        reasons: aiData.toyosuna?.reasons || [],
        tips: aiData.toyosuna?.tips || [],
        summary: aiData.toyosuna?.summary || '',
      },
    });
  } catch (error) {
    console.error('Predict API error:', error);
    return NextResponse.json({
      date, score, level,
      peakHours: hourlyPattern,
      reasons: buildDefaultRoadReasons(score, events, isWeekend),
      tips: buildDefaultRoadTips(score, isWeekend),
      summary: `道路混雑スコア: ${score}/100`,
      events,
      trainInfo: buildDefaultTrainInfo(trainScore, trainLevel, trainHourlyPattern, events, isWeekend),
      toyosunaInfo: buildDefaultToyosunaInfo(toyosunaScore, toyosunaLevel, toyosunaHourlyPattern, events, isWeekend),
    });
  }
}

function buildDefaultTrainInfo(
  trainScore: number,
  trainLevel: ReturnType<typeof scoreToTrainLevel>,
  peakHours: ReturnType<typeof getTrainHourlyPattern>,
  events: MakuhariEvent[],
  isWeekend: boolean
): TrainInfo {
  const reasons: string[] = [];
  if (events.some(e => e.venue === 'makuhari_messe')) {
    reasons.push(`幕張メッセのイベントで海浜幕張駅の乗降客が増加します`);
  }
  if (isWeekend) reasons.push('週末のレジャー・買い物客で京葉線が混雑します');
  if (trainScore >= 75) reasons.push('複数の要因が重なり、電車が大幅に混雑する見込みです');
  if (reasons.length === 0) reasons.push('平常の混雑レベルです');

  const tips: string[] = [];
  if (trainScore >= 50) {
    tips.push('イベント終了後30分以上待ってから乗車するとスムーズです');
    tips.push('武蔵野線・総武線経由への乗り換えも検討してください');
  } else {
    tips.push('通勤ラッシュ（7:30〜9:00）を避けると快適です');
  }

  return { level: trainLevel, score: trainScore, peakHours, reasons, tips, summary: `電車混雑スコア: ${trainScore}/100` };
}

function buildDefaultRoadReasons(score: number, events: MakuhariEvent[], isWeekend: boolean): string[] {
  const reasons: string[] = [];
  if (isWeekend) reasons.push('週末のため買い物・レジャー客が集中します');
  if (events.length > 0) reasons.push(`幕張メッセで「${events[0].name}」が開催されます`);
  if (score >= 75) reasons.push('複数の混雑要因が重なり、道路渋滞が激しくなる見込みです');
  if (reasons.length === 0) reasons.push('通常の平日レベルの交通量が見込まれます');
  return reasons;
}

function buildDefaultToyosunaInfo(
  toyosunaScore: number,
  toyosunaLevel: ReturnType<typeof scoreToTrainLevel>,
  peakHours: ReturnType<typeof getToyosunaHourlyPattern>,
  events: MakuhariEvent[],
  isWeekend: boolean
): TrainInfo {
  const reasons: string[] = [];
  if (events.some(e => e.venue === 'aeon_mall')) {
    reasons.push('イオンモール幕張新都心のイベントで幕張豊砂駅の利用者が増加します');
  }
  if (isWeekend) reasons.push('週末の買い物客でイオンモール・コストコへのアクセスが集中します');
  if (toyosunaScore >= 75) reasons.push('複数の要因が重なり、幕張豊砂駅が大幅に混雑する見込みです');
  if (reasons.length === 0) reasons.push('平常の混雑レベルです');

  const tips: string[] = [];
  if (toyosunaScore >= 50) {
    tips.push('閉店・閉場時間（20〜21時）の30分以上前または後の乗車をお勧めします');
    tips.push('海浜幕張駅経由や車での来場も選択肢に入れてください');
  } else {
    tips.push('通勤ラッシュ（7:30〜9:00）を避けると快適です');
  }

  return { level: toyosunaLevel, score: toyosunaScore, peakHours, reasons, tips, summary: `幕張豊砂駅混雑スコア: ${toyosunaScore}/100` };
}

function buildDefaultRoadTips(score: number, isWeekend: boolean): string[] {
  const tips: string[] = [];
  if (score >= 50) {
    tips.push('10時以前または20時以降の利用をお勧めします');
    tips.push('幕張ICの渋滞回避には花見川区経由の一般道もご検討ください');
  } else if (isWeekend) {
    tips.push('昼12〜15時の時間帯は混雑するため、時間をずらすと快適です');
  } else {
    tips.push('通勤時間帯（7〜9時）を避けると比較的スムーズです');
  }
  return tips;
}
