import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { getLocalHour as getWeatherLocalHour } from '@/src/services/weather/localTime';

export type DayTimeframe = 'ahora' | 'manana' | 'tarde' | 'noche';

interface TimeframeConfig {
  rangeStartHour: number;
  rangeEndHour: number;
  requireDay?: boolean;
  requireNight?: boolean;
}

const timeframeConfig: Record<Exclude<DayTimeframe, 'ahora'>, TimeframeConfig> = {
  manana: {
    rangeStartHour: 8,
    rangeEndHour: 11,
    requireDay: true,
  },
  tarde: {
    rangeStartHour: 16,
    rangeEndHour: 19,
    requireDay: true,
  },
  noche: {
    rangeStartHour: 20,
    rangeEndHour: 23,
    requireNight: true,
  },
};

function isPointInWindow(point: HourlyForecastPoint, config: TimeframeConfig): boolean {
  const localHour = getWeatherLocalHour(point.timeISO);
  const isInHourRange = localHour >= config.rangeStartHour && localHour <= config.rangeEndHour;
  if (!isInHourRange) {
    return false;
  }
  if (config.requireDay && !point.isDay) {
    return false;
  }
  if (config.requireNight && point.isDay) {
    return false;
  }
  return true;
}

function findFirstIndex(points: readonly HourlyForecastPoint[], predicate: (point: HourlyForecastPoint) => boolean): number {
  const index = points.findIndex(predicate);
  return index >= 0 ? index : 0;
}

export function resolveTimeframeHourlyIndex(
  points: readonly HourlyForecastPoint[],
  timeframe: DayTimeframe,
): number {
  if (points.length === 0 || timeframe === 'ahora') {
    return 0;
  }

  const config = timeframeConfig[timeframe];
  const inWindowIndex = findFirstIndex(points, (point) => isPointInWindow(point, config));
  if (inWindowIndex > 0 || isPointInWindow(points[inWindowIndex], config)) {
    return inWindowIndex;
  }

  if (config.requireNight) {
    return findFirstIndex(points, (point) => !point.isDay);
  }

  if (config.requireDay) {
    return findFirstIndex(points, (point) => point.isDay);
  }

  return 0;
}

export function snapshotFromHourlyPoint(snapshot: WeatherSnapshot, hourlyIndex: number): WeatherSnapshot {
  if (snapshot.hourly.length === 0) {
    return snapshot;
  }

  const boundedIndex = Math.max(0, Math.min(hourlyIndex, snapshot.hourly.length - 1));
  const point = snapshot.hourly[boundedIndex];
  const shiftedHourly = snapshot.hourly.slice(boundedIndex);

  return {
    ...snapshot,
    fetchedAtISO: point.timeISO,
    current: {
      timeISO: point.timeISO,
      temperatureC: point.temperatureC,
      apparentTemperatureC: point.apparentTemperatureC,
      isDay: point.isDay,
      weatherCode: point.weatherCode,
      precipitationMm: point.precipitationMm,
      precipitationProbability: point.precipitationProbability,
      windSpeedKmh: point.windSpeedKmh,
      windGustKmh: point.windGustKmh,
      uvIndex: point.uvIndex,
      uvStatus: point.isDay || point.uvIndex <= 1 ? 'available' : 'unavailable',
      cloudCoverPct: point.cloudCoverPct,
      humidityPct: point.humidityPct,
    },
    hourly: shiftedHourly.length > 0 ? shiftedHourly : snapshot.hourly,
  };
}
