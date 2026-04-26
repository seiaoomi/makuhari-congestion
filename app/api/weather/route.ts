import { NextResponse } from 'next/server';
import { WeatherFactor } from '@/types';

const MAKUHARI_LAT = 35.649;
const MAKUHARI_LON = 140.045;

// WMO weather code → アプリの天気区分
// https://open-meteo.com/en/docs#weathervariables
function wmoToCondition(code: number): WeatherFactor['condition'] {
  if (code === 0 || code === 1) return 'sunny';          // 快晴・ほぼ晴れ
  if (code === 2) return 'partly_cloudy';                // 晴れ時々曇り
  if (code === 3) return 'cloudy';                       // 曇り（全天）
  if (code === 45 || code === 48) return 'foggy';        // 霧
  if (code >= 51 && code <= 57) return 'drizzle';        // 霧雨系
  if (code === 80 || code === 81) return 'drizzle';      // 弱〜中程度のにわか雨
  if (code === 82) return 'rainy';                       // 激しいにわか雨
  if (code >= 61 && code <= 67) return 'rainy';          // 雨（弱〜強・着氷）
  if (code === 75 || code === 86) return 'heavy_snow';   // 大雪
  if ((code >= 71 && code <= 77) || code === 85) return 'snowy'; // 雪
  if (code >= 95) return 'thunderstorm';                 // 雷雨
  return 'rainy';
}

export async function GET() {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(MAKUHARI_LAT));
    url.searchParams.set('longitude', String(MAKUHARI_LON));
    url.searchParams.set('daily', 'weather_code');
    url.searchParams.set('timezone', 'Asia/Tokyo');
    url.searchParams.set('forecast_days', '10');

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const data = await res.json();

    const forecasts: { date: string; condition: WeatherFactor['condition'] }[] =
      (data.daily.time as string[]).map((date, i) => ({
        date,
        condition: wmoToCondition(data.daily.weather_code[i] as number),
      }));

    return NextResponse.json({ forecasts });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ forecasts: [] }, { status: 200 });
  }
}
