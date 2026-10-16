import type { Coordinates } from '@/src/types/weather';

const OPEN_METEO_TIMEOUT_MS = 10_000;

type ForecastRequestProfile = 'primary' | 'minimal';

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    is_day: number;
    precipitation: number;
    cloud_cover: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m?: number[];
    weather_code: number[];
    is_day: number[];
    precipitation: number[];
    rain?: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    cloud_cover: number[];
    uv_index: number[];
    precipitation_probability?: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
    weather_code: number[];
  };
}

class OpenMeteoHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    readonly url: string,
    readonly profile: ForecastRequestProfile,
  ) {
    super(`Open-Meteo respondió ${status}`);
  }
}

const forecastVariables: Record<ForecastRequestProfile, { current: string; hourly: string; daily: string }> = {
  primary: {
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,cloud_cover,weather_code,wind_speed_10m,wind_gusts_10m',
    hourly:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,precipitation,rain,wind_speed_10m,wind_gusts_10m,cloud_cover,uv_index,precipitation_probability',
    daily:
      'weather_code,sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  },
  minimal: {
    current:
      'temperature_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,precipitation',
    hourly:
      'temperature_2m,apparent_temperature,weather_code,is_day,cloud_cover,precipitation,wind_speed_10m,wind_gusts_10m,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset',
  },
};

export function buildForecastUrl(
  { latitude, longitude }: Coordinates,
  profile: ForecastRequestProfile = 'primary',
): string {
  const variables = forecastVariables[profile];
  const query = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    timezone: 'auto',
    current: variables.current,
    hourly: variables.hourly,
    daily: variables.daily,
    forecast_days: '7',
  });

  return `https://api.open-meteo.com/v1/forecast?${query.toString()}`;
}

async function fetchOpenMeteoForecastWithProfile(
  coordinates: Coordinates,
  profile: ForecastRequestProfile,
): Promise<OpenMeteoForecastResponse> {
  const fetchUrl = buildForecastUrl(coordinates, profile);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, OPEN_METEO_TIMEOUT_MS);
  let response: Response;

  try {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info('[weather-debug] fetch-start', {
        fetchUrl,
        requestProfile: profile,
        requestedCoordinates: coordinates,
      });
    }

    response = await fetch(fetchUrl, {
      signal: controller.signal,
    });

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info('[weather-debug] fetch-response', {
        fetchUrl,
        requestProfile: profile,
        fetchStatus: response.status,
        ok: response.ok,
      });
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[weather-debug] fetch-error', {
        fetchUrl,
        requestProfile: profile,
        requestedCoordinates: coordinates,
        errorMessage: error instanceof Error ? error.message : 'unknown',
      });
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Open-Meteo timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[weather-debug] fetch-error-body', {
        status: response.status,
        body,
        url: fetchUrl,
        requestProfile: profile,
      });
    }
    throw new OpenMeteoHttpError(response.status, body, fetchUrl, profile);
  }

  return (await response.json()) as OpenMeteoForecastResponse;
}

export async function fetchOpenMeteoForecast(
  coordinates: Coordinates,
): Promise<OpenMeteoForecastResponse> {
  try {
    return await fetchOpenMeteoForecastWithProfile(coordinates, 'primary');
  } catch (error) {
    if (error instanceof OpenMeteoHttpError && error.status === 400) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[weather-debug] fetch-retry-minimal', {
          failedUrl: error.url,
          failedBody: error.body,
          requestedCoordinates: coordinates,
        });
      }
      return fetchOpenMeteoForecastWithProfile(coordinates, 'minimal');
    }

    throw error;
  }
}
