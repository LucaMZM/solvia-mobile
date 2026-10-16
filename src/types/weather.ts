export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  timeISO: string;
  temperatureC: number;
  apparentTemperatureC: number;
  isDay: boolean;
  weatherCode: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  windGustKmh: number;
  uvIndex: number;
  uvStatus: 'available' | 'unavailable';
  cloudCoverPct: number;
  humidityPct: number;
}

export interface HourlyForecastPoint {
  timeISO: string;
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  isDay: boolean;
  windSpeedKmh: number;
  windGustKmh: number;
  uvIndex: number;
  precipitationProbability: number;
  precipitationMm: number;
  cloudCoverPct: number;
  humidityPct: number;
}

export interface DailyForecast {
  sunriseISO: string;
  sunsetISO: string;
  uvIndexMax: number;
  maxTemperatureC: number;
  minTemperatureC: number;
}

export interface DailyForecastPoint {
  timeISO: string;
  weatherCode: number;
  maxTemperatureC: number;
  minTemperatureC: number;
  precipitationProbabilityMax: number;
}

export type WeatherSnapshotSource = 'live' | 'cache' | 'demo';

export type WeatherFallbackReason = 'offline' | 'api' | 'timeout' | 'unknown';
export type WeatherDataStatus = 'loading' | 'available' | 'partial' | 'unavailable' | 'error' | 'demo';

export interface WeatherSnapshotMeta {
  source: WeatherSnapshotSource;
  cacheAgeMinutes: number;
  isStale: boolean;
  fallbackReason?: WeatherFallbackReason;
  dataStatus?: WeatherDataStatus;
  integrityWarnings?: string[];
}

export interface WeatherSnapshot {
  fetchedAtISO: string;
  cityName: string;
  timezone: string;
  coordinates: Coordinates;
  current: CurrentWeather;
  hourly: HourlyForecastPoint[];
  daily: DailyForecast;
  dailySeries?: DailyForecastPoint[];
  meta?: WeatherSnapshotMeta;
}
