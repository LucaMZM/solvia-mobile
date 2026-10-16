import type { OpenMeteoForecastResponse } from '@/src/services/weather/openMeteoApi';
import { compareLocalIso } from '@/src/services/weather/localTime';
import type { DailyForecast, DailyForecastPoint, HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';

function numberOrZero(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function numberOrNaN(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : Number.NaN;
}

function clampHourlySize(hourlyPoints: HourlyForecastPoint[], currentTimeISO: string): HourlyForecastPoint[] {
  if (hourlyPoints.length === 0) {
    return [];
  }

  const currentIndex = hourlyPoints.findIndex((point) => point.timeISO === currentTimeISO);
  if (currentIndex >= 0) {
    return hourlyPoints.slice(currentIndex, currentIndex + 24);
  }

  let nearestFutureIndex = hourlyPoints.findIndex((point) => compareLocalIso(point.timeISO, currentTimeISO) >= 0);
  if (nearestFutureIndex < 0) {
    nearestFutureIndex = hourlyPoints.length - 1;
  }

  const startIndex = Math.max(0, nearestFutureIndex - 1);
  return hourlyPoints.slice(startIndex, startIndex + 24);
}

function stringOrFallback(value: string | undefined, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return fallback;
}

function toHourlyPoints(data: OpenMeteoForecastResponse['hourly']): HourlyForecastPoint[] {
  return data.time.map((timeISO, index) => ({
    timeISO,
    temperatureC: numberOrNaN(data.temperature_2m[index]),
    apparentTemperatureC: numberOrNaN(data.apparent_temperature[index]),
    humidityPct: numberOrZero(data.relative_humidity_2m?.[index]),
    weatherCode: numberOrZero(data.weather_code[index]),
    isDay: numberOrZero(data.is_day[index]) === 1,
    precipitationMm: numberOrZero(data.precipitation[index]),
    windSpeedKmh: numberOrZero(data.wind_speed_10m[index]),
    windGustKmh: numberOrZero(data.wind_gusts_10m[index]),
    cloudCoverPct: numberOrZero(data.cloud_cover[index]),
    uvIndex: numberOrNaN(data.uv_index[index]),
    precipitationProbability: numberOrZero(data.precipitation_probability?.[index]),
  }));
}

function findNearestHourlyPoint(
  hourlyPoints: readonly HourlyForecastPoint[],
  targetTimeISO: string,
): HourlyForecastPoint | undefined {
  const usablePoints = hourlyPoints.filter((point) => Number.isFinite(point.temperatureC));
  if (usablePoints.length === 0) {
    return undefined;
  }

  return usablePoints.reduce((nearest, point) =>
    Math.abs(compareLocalIso(point.timeISO, targetTimeISO)) <
    Math.abs(compareLocalIso(nearest.timeISO, targetTimeISO))
      ? point
      : nearest,
  );
}

function resolveCurrentUv(params: {
  currentHourlyPoint: HourlyForecastPoint | undefined;
  isDay: boolean;
}): { uvIndex: number; uvStatus: 'available' | 'unavailable' } {
  if (!params.isDay) {
    return {
      uvIndex: 0,
      uvStatus: 'unavailable',
    };
  }

  if (params.currentHourlyPoint && Number.isFinite(params.currentHourlyPoint.uvIndex)) {
    return {
      uvIndex: params.currentHourlyPoint.uvIndex,
      uvStatus: 'available',
    };
  }

  return {
    uvIndex: 0,
    uvStatus: 'unavailable',
  };
}

function toDailyForecast(data: OpenMeteoForecastResponse['daily'], fallbackTimeISO: string): DailyForecast {
  return {
    sunriseISO: stringOrFallback(data.sunrise[0], fallbackTimeISO),
    sunsetISO: stringOrFallback(data.sunset[0], fallbackTimeISO),
    uvIndexMax: numberOrZero(data.uv_index_max[0]),
    maxTemperatureC: numberOrZero(data.temperature_2m_max[0]),
    minTemperatureC: numberOrZero(data.temperature_2m_min[0]),
  };
}

function toDailySeries(data: OpenMeteoForecastResponse['daily']): DailyForecastPoint[] {
  return data.time.map((timeISO, index) => ({
    timeISO,
    weatherCode: numberOrZero(data.weather_code[index]),
    maxTemperatureC: numberOrZero(data.temperature_2m_max[index]),
    minTemperatureC: numberOrZero(data.temperature_2m_min[index]),
    precipitationProbabilityMax: numberOrZero(data.precipitation_probability_max?.[index]),
  }));
}

export function parseOpenMeteoForecast(
  payload: OpenMeteoForecastResponse,
  cityName: string,
): WeatherSnapshot {
  const rawHourly = toHourlyPoints(payload.hourly);
  const hourly = clampHourlySize(rawHourly, payload.current.time);
  const currentHourlyPoint = findNearestHourlyPoint(rawHourly, payload.current.time);
  const currentPrecipitationProbability = currentHourlyPoint?.precipitationProbability ?? 0;
  const currentTemperature = payload.current.temperature_2m;
  const currentApparentTemperature = payload.current.apparent_temperature;
  const currentWeatherCode = payload.current.weather_code;
  const currentIsDay = payload.current.is_day;
  const resolvedIsDay = Number.isFinite(currentIsDay)
    ? numberOrZero(currentIsDay) === 1
    : (currentHourlyPoint?.isDay ?? true);
  const resolvedTemperature = Number.isFinite(currentTemperature)
    ? Number(currentTemperature)
    : (currentHourlyPoint?.temperatureC ?? Number.NaN);
  const resolvedApparentTemperature = Number.isFinite(currentApparentTemperature)
    ? Number(currentApparentTemperature)
    : Number.isFinite(currentHourlyPoint?.apparentTemperatureC)
      ? Number(currentHourlyPoint?.apparentTemperatureC)
      : resolvedTemperature;
  const currentUv = resolveCurrentUv({
    currentHourlyPoint,
    isDay: resolvedIsDay,
  });

  return {
    fetchedAtISO: new Date().toISOString(),
    cityName,
    timezone: payload.timezone,
    coordinates: {
      latitude: payload.latitude,
      longitude: payload.longitude,
    },
    current: {
      timeISO: payload.current.time,
      temperatureC: resolvedTemperature,
      apparentTemperatureC: resolvedApparentTemperature,
      isDay: resolvedIsDay,
      weatherCode: Number.isFinite(currentWeatherCode)
        ? numberOrZero(currentWeatherCode)
        : (currentHourlyPoint?.weatherCode ?? 0),
      precipitationMm: numberOrZero(payload.current.precipitation),
      precipitationProbability: currentPrecipitationProbability,
      windSpeedKmh: numberOrZero(payload.current.wind_speed_10m),
      windGustKmh: numberOrZero(payload.current.wind_gusts_10m),
      uvIndex: currentUv.uvIndex,
      uvStatus: currentUv.uvStatus,
      cloudCoverPct: numberOrZero(payload.current.cloud_cover),
      humidityPct: numberOrZero(payload.current.relative_humidity_2m),
    },
    hourly,
    daily: toDailyForecast(payload.daily, payload.current.time),
    dailySeries: toDailySeries(payload.daily),
  };
}
