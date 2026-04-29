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
  toyosunaInfo: TrainInfo;
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
  venue: 'makuhari_messe' | 'zozo_marine' | 'aeon_mall' | 'mitsui_outlet' | 'costco' | 'beach_park' | 'toyosuna_park' | 'other';
  startDate: string;
  endDate: string;
  expectedAttendance: 'small' | 'medium' | 'large' | 'massive';
  type: 'concert' | 'exhibition' | 'sports' | 'sale' | 'festival' | 'other';
  source: string;
}

export interface FacilityInfo {
  venue: MakuhariEvent['venue'];
  name: string;
  score: number;
  level: CongestionLevel;
  activeEvents: MakuhariEvent[];
}

export interface WeatherFactor {
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'thunderstorm' | 'snowy' | 'heavy_snow';
  multiplier: number;
}
