'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CongestionPrediction, WeatherFactor, MakuhariEvent, FacilityInfo } from '@/types';
import { getWeatherMultiplier } from '@/lib/weather';
import { calculateCongestionScore, scoreToLevel } from '@/lib/congestion';
import { calculateFacilityScores } from '@/lib/facility';
import { getEventsForDate } from '@/lib/events';
import CongestionMeter from '@/components/CongestionMeter';
import CongestionTimeline from '@/components/CongestionTimeline';
import EventList from '@/components/EventList';
import CongestionCalendar from '@/components/CongestionCalendar';
import TrainCongestion from '@/components/TrainCongestion';
import FacilityCongestionPanel from '@/components/FacilityCongestionPanel';
import TabNav from '@/components/TabNav';
import MapView from '@/components/MapView';

type Tab = 'facility' | 'road' | 'station';

interface DayScore {
  date: Date;
  score: number;
  level: ReturnType<typeof scoreToLevel>;
  condition?: WeatherFactor['condition'];
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [prediction, setPrediction] = useState<CongestionPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherFactor['condition']>('sunny');
  const [dayScores, setDayScores] = useState<DayScore[]>([]);
  const [allEvents, setAllEvents] = useState<MakuhariEvent[]>([]);
  const [weatherForecasts, setWeatherForecasts] = useState<Map<string, WeatherFactor['condition']>>(new Map());
  const [facilityScores, setFacilityScores] = useState<FacilityInfo[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('facility');

  // Open-Meteo から10日間の天気予報を取得（初回のみ）
  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(({ forecasts }) => {
        const map = new Map<string, WeatherFactor['condition']>();
        (forecasts as { date: string; condition: WeatherFactor['condition'] }[])
          .forEach(({ date, condition }) => map.set(date, condition));
        setWeatherForecasts(map);
      })
      .catch(() => {});
  }, []);

  // 日付が変わったら予報から天気を自動セット
  useEffect(() => {
    const forecastCondition = weatherForecasts.get(format(selectedDate, 'yyyy-MM-dd'));
    if (forecastCondition) setWeather(forecastCondition);
  }, [selectedDate, weatherForecasts]);

  // 10日間のウィンドウに含まれる月のイベントを一括取得（初回のみ）
  useEffect(() => {
    const months = new Set(
      Array.from({ length: 10 }, (_, i) => addDays(new Date(), i)).map(
        d => `${d.getFullYear()}-${d.getMonth() + 1}`
      )
    );
    Promise.all(
      Array.from(months).map(async ym => {
        const [year, month] = ym.split('-');
        const res = await fetch(`/api/events?year=${year}&month=${month}`);
        const { events } = await res.json();
        return events as MakuhariEvent[];
      })
    ).then(results => setAllEvents(results.flat()));
  }, []);

  // カレンダーの10日間スコアを再計算
  useEffect(() => {
    const scores: DayScore[] = Array.from({ length: 10 }, (_, i) => i).map(offset => {
      const d = addDays(new Date(), offset);
      const dayEvents = getEventsForDate(allEvents, d);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayWeather = weatherForecasts.get(dateStr) ?? weather;
      const multiplier = getWeatherMultiplier(dayWeather);
      const score = calculateCongestionScore({ date: d, events: dayEvents, weatherMultiplier: multiplier });
      return { date: d, score, level: scoreToLevel(score), condition: weatherForecasts.get(dateStr) };
    });
    setDayScores(scores);
  }, [allEvents, weather, weatherForecasts]);

  // 施設混雑スコアを再計算（日付・イベント・天気が変わったとき）
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayWeather = weatherForecasts.get(dateStr) ?? weather;
    setFacilityScores(calculateFacilityScores(selectedDate, allEvents, dayWeather));
  }, [selectedDate, allEvents, weather, weatherForecasts]);

  const fetchPrediction = useCallback(async (
    date: Date,
    weatherCondition: WeatherFactor['condition'],
    events: MakuhariEvent[]
  ) => {
    setLoading(true);
    try {
      const weatherMultiplier = getWeatherMultiplier(weatherCondition);
      const dayEvents = getEventsForDate(events, date);
      const predictRes = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: format(date, 'yyyy-MM-dd'), events: dayEvents, weatherMultiplier }),
      });
      const data = await predictRes.json();
      setPrediction(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrediction(selectedDate, weather, allEvents);
  }, [selectedDate, weather, allEvents, fetchPrediction]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-orange-400">幕張エリア 混雑予報</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-900/60 text-orange-300 border border-orange-700">
            Alpha
          </span>
        </div>
        <p className="text-sm text-gray-400">幕張メッセ・イオンモール・コストコ周辺の道路混雑予測</p>
        <p className="text-xs text-gray-500 mt-1">
          本サービスはアルファ版につき、予測精度・機能に制限があります。現在は無償で公開しています。
        </p>
      </header>

      <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {dayScores.length > 0 && (
          <CongestionCalendar
            dayScores={dayScores}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        )}

        <MapView />

        <div className="text-base md:text-lg font-semibold text-gray-200">
          {format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
        </div>

        {/* タブナビ */}
        <TabNav active={activeTab} onChange={setActiveTab} />

        {/* タブコンテンツ */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin text-3xl mb-3">⏳</div>
            <p>混雑予測を計算中...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── 施設混雑タブ ── */}
            {activeTab === 'facility' && (
              <>
                {facilityScores.length > 0 && (
                  <FacilityCongestionPanel facilities={facilityScores} />
                )}
                {prediction && <EventList events={prediction.events} />}
              </>
            )}

            {/* ── 道路混雑タブ ── */}
            {activeTab === 'road' && prediction && (
              <div className="border border-orange-900 rounded-xl overflow-hidden">
                <div className="bg-orange-950 px-4 py-2 flex items-center gap-2">
                  <span className="text-orange-400 font-bold text-sm">道路混雑予測</span>
                  <span className="text-orange-700 text-xs">幕張IC・湾岸道路・国道357号</span>
                </div>
                <div className="bg-gray-900 p-4 space-y-4">
                  <CongestionMeter
                    score={prediction.score}
                    level={prediction.level}
                    summary={prediction.summary}
                  />
                  {prediction.reasons.length > 0 && (
                    <div>
                      <h2 className="font-semibold text-gray-200 mb-2 text-sm">混雑の理由</h2>
                      <ul className="space-y-1">
                        {prediction.reasons.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-300 flex gap-2">
                            <span className="text-orange-400">・</span>{reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <CongestionTimeline peakHours={prediction.peakHours} />
                  {prediction.tips.length > 0 && (
                    <div className="border border-green-900 rounded-lg p-3">
                      <h2 className="font-semibold text-green-400 mb-2 text-sm">混雑回避アドバイス</h2>
                      <ul className="space-y-1">
                        {prediction.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-gray-300 flex gap-2">
                            <span className="text-green-400">✓</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 駅・人流タブ ── */}
            {activeTab === 'station' && prediction && (
              <TrainCongestion trainInfo={prediction.trainInfo} toyosunaInfo={prediction.toyosunaInfo} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
