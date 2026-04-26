import { WeatherFactor } from '@/types';

export function getWeatherMultiplier(condition: WeatherFactor['condition']): number {
  const multipliers: Record<WeatherFactor['condition'], number> = {
    sunny: 1.1,
    partly_cloudy: 1.05,
    cloudy: 1.0,
    foggy: 1.0,
    drizzle: 0.9,
    rainy: 0.8,
    thunderstorm: 0.7,
    snowy: 0.6,
    heavy_snow: 0.5,
  };
  return multipliers[condition];
}

export function getWeatherLabel(condition: WeatherFactor['condition']): string {
  const labels: Record<WeatherFactor['condition'], string> = {
    sunny: '晴れ',
    partly_cloudy: '晴れ時々曇り',
    cloudy: '曇り',
    foggy: '霧',
    drizzle: '晴れ時々雨',
    rainy: '雨',
    thunderstorm: '雷雨',
    snowy: '雪',
    heavy_snow: '大雪',
  };
  return labels[condition];
}

export function getWeatherIcon(condition: WeatherFactor['condition']): string {
  const icons: Record<WeatherFactor['condition'], string> = {
    sunny: '☀️',
    partly_cloudy: '🌤️',
    cloudy: '☁️',
    foggy: '🌫️',
    drizzle: '🌦️',
    rainy: '☂️',
    thunderstorm: '⛈️',
    snowy: '❄️',
    heavy_snow: '🌨️',
  };
  return icons[condition];
}
