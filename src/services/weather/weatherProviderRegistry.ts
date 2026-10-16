import { openMeteoWeatherProvider } from '@/src/services/weather/openMeteoWeatherProvider';
import type { WeatherProvider } from '@/src/services/weather/weatherProvider';

export type WeatherProviderSelection = 'open-meteo' | 'meteomatics' | 'tomorrow-io';

export interface WeatherProviderRuntimeInfo {
  requested: string;
  active: WeatherProviderSelection;
  usingFallback: boolean;
  note?: string;
}

interface RegisteredWeatherProvider {
  provider: WeatherProvider;
  available: boolean;
  fallbackNote?: string;
}

const weatherRegistry: Record<WeatherProviderSelection, RegisteredWeatherProvider> = {
  'open-meteo': {
    provider: openMeteoWeatherProvider,
    available: true,
  },
  meteomatics: {
    provider: openMeteoWeatherProvider,
    available: false,
    fallbackNote: 'Meteomatics listo para fase premium (build de desarrollo y credenciales).',
  },
  'tomorrow-io': {
    provider: openMeteoWeatherProvider,
    available: false,
    fallbackNote: 'Tomorrow.io listo para fase premium (build de desarrollo y credenciales).',
  },
};

function isWeatherProviderSelection(value: string): value is WeatherProviderSelection {
  return value in weatherRegistry;
}

export function resolveWeatherProvider(requestedRaw: string): {
  provider: WeatherProvider;
  runtime: WeatherProviderRuntimeInfo;
} {
  const requested = requestedRaw.trim().toLowerCase();
  const selection: WeatherProviderSelection = isWeatherProviderSelection(requested) ? requested : 'open-meteo';
  const resolved = weatherRegistry[selection];

  if (resolved.available) {
    return {
      provider: resolved.provider,
      runtime: {
        requested: requestedRaw,
        active: selection,
        usingFallback: selection === 'open-meteo',
      },
    };
  }

  return {
    provider: openMeteoWeatherProvider,
    runtime: {
      requested: requestedRaw,
      active: 'open-meteo',
      usingFallback: true,
      note: resolved.fallbackNote,
    },
  };
}
