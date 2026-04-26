export type CongestionLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface CongestionPrediction {
  date: string;
  level: CongestionLevel;
  score: number;
  peakHours: TimeRange[];
  reasons: string[];
  tips: string[];
  summary: string;
  events: MakuhariEvent[];
  trainInfo: TrainInfo;
}

export interface TrainInfo {
  level: CongestionLevel;
  score: number;
  peakHours: TimeRange[];
  reasons: string[];
  tips: string[];
  summary: string;
}

export interface TimeRange {
  start: string;
  end: string;
  level: CongestionLevel;
}

export interface MakuhariEvent {
  id: string;
  name: string;
  venue: 'makuhari_messe' | 'aeon_mall' | 'costco' | 'other';
  startDate: string;
  endDate: string;
  expectedAttendance: 'small' | 'medium' | 'large' | 'massive';
  type: 'concert' | 'exhibition' | 'sports' | 'sale' | 'festival' | 'other';
  source: string;
}

export interface WeatherFactor {
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'thunderstorm' | 'snowy' | 'heavy_snow';
  multiplier: number;
}
