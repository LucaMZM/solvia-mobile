import type { OpenMeteoForecastResponse } from '@/src/services/weather/openMeteoApi';
import { parseOpenMeteoForecast } from '@/src/services/weather/parsers';

interface ForecastOverrides
  extends Partial<Omit<OpenMeteoForecastResponse, 'current' | 'hourly' | 'daily'>> {
  current?: Partial<OpenMeteoForecastResponse['current']>;
  hourly?: Partial<OpenMeteoForecastResponse['hourly']>;
  daily?: Partial<OpenMeteoForecastResponse['daily']>;
}

function buildFixture(overrides: ForecastOverrides): OpenMeteoForecastResponse {
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
      temperature_2m_max: [27],
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

export function runWeatherCurrentSelectionDebugChecks(): void {
  const midnight = parseOpenMeteoForecast(buildFixture({}), 'Madrid');
  if (midnight.current.timeISO !== '2026-04-27T00:00' || midnight.current.isDay) {
    throw new Error('Escenario 00:00 local: selección actual incorrecta.');
  }
  if (midnight.current.temperatureC === midnight.daily.maxTemperatureC) {
    throw new Error('Escenario 00:00 local: se usó la máxima diaria como temperatura actual.');
  }

  const sunnyDay = parseOpenMeteoForecast(
    buildFixture({
      current: {
        time: '2026-04-27T13:00',
        temperature_2m: 24,
        apparent_temperature: 25,
        is_day: 1,
        weather_code: 0,
      },
      hourly: {
        time: ['2026-04-27T12:00', '2026-04-27T13:00', '2026-04-27T14:00'],
        weather_code: [1, 0, 0],
        is_day: [1, 1, 1],
        temperature_2m: [23, 24, 25],
        apparent_temperature: [24, 25, 26],
        precipitation_probability: [5, 4, 4],
        precipitation: [0, 0, 0],
        relative_humidity_2m: [42, 40, 38],
        wind_speed_10m: [8, 9, 10],
        wind_gusts_10m: [12, 14, 15],
        cloud_cover: [10, 5, 6],
        uv_index: [7, 8, 8],
      },
    }),
    'Madrid',
  );
  if (!sunnyDay.current.isDay || sunnyDay.current.weatherCode !== 0) {
    throw new Error('Escenario día soleado: condición actual incorrecta.');
  }

  const rainyNight = parseOpenMeteoForecast(
    buildFixture({
      current: {
        time: '2026-04-27T22:00',
        is_day: 0,
        weather_code: 61,
        precipitation: 0.8,
      },
      hourly: {
        time: ['2026-04-27T21:00', '2026-04-27T22:00', '2026-04-27T23:00'],
        weather_code: [61, 61, 63],
        is_day: [0, 0, 0],
        precipitation: [0.6, 0.8, 1.2],
        precipitation_probability: [70, 80, 90],
      },
    }),
    'Madrid',
  );
  if (rainyNight.current.isDay || rainyNight.current.weatherCode === 0) {
    throw new Error('Escenario noche lluviosa: no debe verse como día soleado.');
  }
}
