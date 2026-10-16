import type { OpenMeteoForecastResponse } from '@/src/services/weather/openMeteoApi';
import { parseOpenMeteoForecast } from '@/src/services/weather/parsers';
import { normalizeWeatherSnapshot } from '@/src/services/weather/weatherIntegrity';
import type { WeatherSnapshot } from '@/src/types/weather';

interface ForecastOverrides
  extends Partial<Omit<OpenMeteoForecastResponse, 'current' | 'hourly' | 'daily'>> {
  current?: Partial<OpenMeteoForecastResponse['current']>;
  hourly?: Partial<OpenMeteoForecastResponse['hourly']>;
  daily?: Partial<OpenMeteoForecastResponse['daily']>;
}

function buildFixture(overrides: ForecastOverrides = {}): OpenMeteoForecastResponse {
  const base: OpenMeteoForecastResponse = {
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: 'Europe/Madrid',
    current: {
      time: '2026-04-27T00:00',
      temperature_2m: 12,
      apparent_temperature: 11,
      relative_humidity_2m: 66,
      is_day: 0,
      precipitation: 0,
      cloud_cover: 5,
      weather_code: 0,
      wind_speed_10m: 8,
      wind_gusts_10m: 12,
    },
    hourly: {
      time: ['2026-04-26T23:00', '2026-04-27T00:00', '2026-04-27T01:00'],
      temperature_2m: [13, 12, 11],
      apparent_temperature: [12, 11, 10],
      relative_humidity_2m: [63, 66, 70],
      weather_code: [1, 0, 61],
      is_day: [0, 0, 0],
      precipitation: [0, 0, 0.4],
      wind_speed_10m: [10, 8, 7],
      wind_gusts_10m: [14, 12, 11],
      cloud_cover: [10, 5, 75],
      uv_index: [0, 0, 0],
      precipitation_probability: [8, 10, 72],
    },
    daily: {
      time: ['2026-04-27'],
      sunrise: ['2026-04-27T07:18'],
      sunset: ['2026-04-27T20:55'],
      uv_index_max: [7],
      temperature_2m_max: [23],
      temperature_2m_min: [11],
      precipitation_probability_max: [72],
      weather_code: [2],
    },
  };

  return {
    ...base,
    ...overrides,
    current: {
      ...base.current,
      ...(overrides.current ?? {}),
    },
    hourly: {
      ...base.hourly,
      ...(overrides.hourly ?? {}),
    },
    daily: {
      ...base.daily,
      ...(overrides.daily ?? {}),
    },
  };
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function demoSnapshotFixture(): WeatherSnapshot {
  const parsed = parseOpenMeteoForecast(buildFixture(), 'Madrid');
  return {
    ...parsed,
    meta: {
      source: 'demo',
      cacheAgeMinutes: 0,
      isStale: false,
    },
  };
}

export function runWeatherRegressionChecks(): void {
  const currentVsMax = parseOpenMeteoForecast(
    buildFixture({
      current: {
        temperature_2m: 12,
      },
      daily: {
        temperature_2m_max: [23],
      },
    }),
    'Madrid',
  );
  assert(currentVsMax.current.temperatureC === 12, 'current_temp debe prevalecer sobre max_temp.');

  const midnightUv = normalizeWeatherSnapshot(
    parseOpenMeteoForecast(
      buildFixture({
        current: {
          time: '2026-04-27T00:00',
          is_day: 0,
        },
        hourly: {
          time: ['2026-04-27T00:00', '2026-04-27T01:00'],
          is_day: [0, 0],
          uv_index: [5, 4],
        },
      }),
      'Madrid',
    ),
  );
  assert(midnightUv.current.uvStatus === 'unavailable', 'UV nocturno incoherente debe invalidarse.');
  assert(midnightUv.current.uvIndex === 0, 'UV nocturno incoherente debe normalizarse a 0.');

  const tempWithNoUv = normalizeWeatherSnapshot(
    parseOpenMeteoForecast(
      buildFixture({
        current: {
          temperature_2m: 14,
        },
        hourly: {
          uv_index: [Number.NaN, Number.NaN, Number.NaN],
        },
      }),
      'Madrid',
    ),
  );
  assert(Number.isFinite(tempWithNoUv.current.temperatureC), 'Debe mantenerse la temperatura aunque falte UV.');
  assert(tempWithNoUv.current.uvStatus === 'unavailable', 'Si falta UV actual, debe marcarse como unavailable.');

  const noCurrentTempButForecast = parseOpenMeteoForecast(
    buildFixture({
      current: {
        temperature_2m: Number.NaN,
      },
      hourly: {
        temperature_2m: [13, 15, 14],
      },
    }),
    'Madrid',
  );
  assert(noCurrentTempButForecast.current.temperatureC === 15, 'Sin current_temp, debe usarse hourly equivalente.');

  const nearestHourlyFallback = parseOpenMeteoForecast(
    buildFixture({
      current: {
        time: '2026-04-27T00:40',
        temperature_2m: Number.NaN,
      },
      hourly: {
        time: ['2026-04-27T00:00', '2026-04-27T01:00'],
        temperature_2m: [12, 17],
        apparent_temperature: [11, 16],
      },
    }),
    'Madrid',
  );
  assert(nearestHourlyFallback.current.temperatureC === 17, 'El fallback debe elegir la hora local más cercana.');

  const futureDayUv = normalizeWeatherSnapshot({
    ...parseOpenMeteoForecast(
      buildFixture({
        timezone: 'zona-no-disponible',
        hourly: {
          time: ['2026-04-27T00:00', '2026-04-28T12:00'],
          is_day: [0, 1],
          uv_index: [0, 6],
        },
      }),
      'Madrid',
    ),
    timezone: 'zona-no-disponible',
  });
  const futureMidday = futureDayUv.hourly.find((point) => point.timeISO === '2026-04-28T12:00');
  assert(futureMidday?.uvIndex === 6, 'El atardecer de hoy no debe borrar el UV diurno de mañana.');

  const demo = normalizeWeatherSnapshot(demoSnapshotFixture());
  assert(demo.meta?.dataStatus === 'demo', 'Datos demo deben marcarse como demo.');
}

export function runWeatherRegressionChecksSafely(): void {
  if (!__DEV__) {
    return;
  }

  try {
    runWeatherRegressionChecks();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[weather] Regresión detectada en checks locales:', error);
  }
}
