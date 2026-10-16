import { useMemo } from 'react';

import { buildDailyBriefBundle } from '@/src/features/briefing/dailyBriefing';
import { buildRecommendations } from '@/src/features/recommendations/engine';
import { useLocationWeather } from '@/src/hooks/useLocationWeather';
import {
  WEATHER_CURRENT_FRESHNESS_MAX_MINUTES,
  WEATHER_FALLBACK_CACHE_MAX_MINUTES,
} from '@/src/services/weather/weatherService';
import { usePreferencesStore } from '@/src/state/preferencesStore';
import { useRoutinesStore } from '@/src/state/routinesStore';
import type { DailyBrief, DailyBriefMoment } from '@/src/types/briefing';
import type { RecommendationBundle } from '@/src/types/recommendations';
import type { PlanType } from '@/src/types/planning';
import type { HourlyForecastPoint, WeatherDataStatus, WeatherSnapshot } from '@/src/types/weather';

type BriefingStatus = 'loading' | 'error' | 'empty' | 'ready';

interface WeatherBriefingResult {
  status: BriefingStatus;
  weatherDataStatus: WeatherDataStatus;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  offlineMessage: string | null;
  snapshot: WeatherSnapshot | null;
  recommendations: RecommendationBundle | null;
  dailyBrief: DailyBrief | null;
  dailyBriefByMoment: Record<DailyBriefMoment, DailyBrief> | null;
  nextHours: HourlyForecastPoint[];
  isUsingCachedWeather: boolean;
  isWeatherStale: boolean;
  locationPermissionDenied: boolean;
  selectedPlanType: PlanType;
  refetch: () => Promise<void>;
}

function toErrorMessage(error: Error | null): string | null {
  if (!error) {
    return null;
  }

  const message = error.message.trim();
  return message.length > 0 ? message : null;
}

function isLocationPermissionError(error: Error | null): boolean {
  if (!error) {
    return false;
  }
  return error.message.toLowerCase().includes('permiso de ubicación');
}

function snapshotAgeMinutes(snapshot: WeatherSnapshot | undefined): number {
  if (!snapshot) {
    return Number.POSITIVE_INFINITY;
  }

  const fetchedAtMs = Date.parse(snapshot.fetchedAtISO);
  const elapsedMinutes = Number.isFinite(fetchedAtMs)
    ? Math.max(0, (Date.now() - fetchedAtMs) / 60_000)
    : Number.POSITIVE_INFINITY;
  return Math.max(elapsedMinutes, snapshot.meta?.cacheAgeMinutes ?? 0);
}

function toFriendlyErrorMessage(params: {
  weatherError: Error | null;
  locationError: Error | null;
  locationPermissionDenied: boolean;
  cacheTooOld: boolean;
}): string {
  if (params.cacheTooOld) {
    return 'No hemos podido actualizar el tiempo. Última lectura demasiado antigua.';
  }

  if (params.locationPermissionDenied || isLocationPermissionError(params.locationError)) {
    return 'Necesitamos permiso de ubicación para afinar tu zona. Puedes seguir con una ubicación guardada.';
  }

  const weatherMessage = toErrorMessage(params.weatherError)?.toLowerCase() ?? '';
  if (weatherMessage.includes('última lectura demasiado antigua')) {
    return 'No hemos podido actualizar el tiempo. Última lectura demasiado antigua.';
  }
  if (
    weatherMessage.includes('network') ||
    weatherMessage.includes('request failed') ||
    weatherMessage.includes('failed to fetch') ||
    weatherMessage.includes('sin conexión')
  ) {
    return 'No hay conexión estable ahora. Reintentamos en segundo plano.';
  }

  return 'No pudimos actualizar el clima ahora mismo. Inténtalo de nuevo en un momento.';
}

function buildOfflineMessage(
  snapshot: WeatherSnapshot | null,
  locationPermissionDenied: boolean,
  cacheTooOld: boolean,
  ageMinutes: number,
): string | null {
  if (locationPermissionDenied) {
    return 'Ubicación limitada por permisos. Puedes continuar con una ciudad guardada.';
  }
  if (cacheTooOld) {
    return null;
  }
  if (!snapshot?.meta) {
    return null;
  }

  if (snapshot.meta.source === 'demo') {
    return 'Mostrando lectura de demostración.';
  }

  if (snapshot.meta.source === 'cache') {
    if (ageMinutes > WEATHER_CURRENT_FRESHNESS_MAX_MINUTES) {
      return `Última actualización hace ${Math.floor(ageMinutes)} min.`;
    }
    return `Actualizado hace ${Math.floor(ageMinutes)} min.`;
  }

  if (ageMinutes > WEATHER_CURRENT_FRESHNESS_MAX_MINUTES) {
    return `Última actualización hace ${Math.floor(ageMinutes)} min.`;
  }

  return null;
}

function resolveWeatherDataStatus(params: {
  isLoading: boolean;
  isError: boolean;
  snapshot: WeatherSnapshot | null;
  cacheTooOld: boolean;
}): WeatherDataStatus {
  const { isLoading, isError, snapshot, cacheTooOld } = params;
  if (isLoading) {
    return 'loading';
  }
  if (cacheTooOld) {
    return 'unavailable';
  }
  if (isError) {
    return 'error';
  }
  if (!snapshot) {
    return 'unavailable';
  }
  if (snapshot.meta?.source === 'demo') {
    return 'demo';
  }
  if (snapshot.meta?.dataStatus === 'partial') {
    return 'partial';
  }
  if (snapshot.meta?.dataStatus === 'unavailable') {
    return 'unavailable';
  }
  return 'available';
}

export function useWeatherBriefing(): WeatherBriefingResult {
  const { activeLocation, locationPermissionDenied, locationQuery, selectedLocation, weatherQuery } = useLocationWeather();
  const thermalProfile = usePreferencesStore((state) => state.thermalProfile);
  const selectedPlanType = usePreferencesStore((state) => state.planModeType);
  const routines = useRoutinesStore((state) => state.routines);

  const recommendations = useMemo(() => {
    if (!weatherQuery.data) {
      return null;
    }
    return buildRecommendations(weatherQuery.data, { thermalProfile });
  }, [thermalProfile, weatherQuery.data]);

  const nextHours = useMemo(() => weatherQuery.data?.hourly.slice(0, 6) ?? [], [weatherQuery.data]);
  const dailyBriefBundle = useMemo(() => {
    if (!weatherQuery.data || !recommendations) {
      return null;
    }

    return buildDailyBriefBundle({
      snapshot: weatherQuery.data,
      recommendations,
      thermalProfile,
      selectedPlanType,
      selectedLocation,
      routines,
    });
  }, [recommendations, routines, selectedLocation, selectedPlanType, thermalProfile, weatherQuery.data]);
  const ageMinutes = snapshotAgeMinutes(weatherQuery.data);
  const cacheTooOld = Boolean(weatherQuery.data) && ageMinutes > WEATHER_FALLBACK_CACHE_MAX_MINUTES;
  const hasReadyData = Boolean(weatherQuery.data && recommendations && !cacheTooOld);
  const isRetryingAfterError = weatherQuery.isFetching && !weatherQuery.data && weatherQuery.isError;
  const isLoading =
    (weatherQuery.isLoading && !weatherQuery.data) ||
    isRetryingAfterError ||
    (!activeLocation && locationQuery.isLoading);
  const isError = !hasReadyData && (weatherQuery.isError || (!activeLocation && locationQuery.isError));
  const forcedError = cacheTooOld;
  const friendlyErrorMessage = toFriendlyErrorMessage({
    weatherError: weatherQuery.error ?? null,
    locationError: locationQuery.error ?? null,
    locationPermissionDenied,
    cacheTooOld: forcedError,
  });
  const status: BriefingStatus = isLoading
    ? 'loading'
    : forcedError || isError
      ? 'error'
      : hasReadyData
        ? 'ready'
        : 'empty';
  const isUsingCachedWeather = weatherQuery.data?.meta?.source === 'cache' && !cacheTooOld;
  const isWeatherStale = Boolean(weatherQuery.data) && ageMinutes > WEATHER_CURRENT_FRESHNESS_MAX_MINUTES;
  const offlineMessage = buildOfflineMessage(weatherQuery.data ?? null, locationPermissionDenied, forcedError, ageMinutes);
  const weatherDataStatus = resolveWeatherDataStatus({
    isLoading,
    isError: isError || forcedError,
    snapshot: weatherQuery.data ?? null,
    cacheTooOld: forcedError,
  });
  const isUnavailable = weatherDataStatus === 'unavailable';

  return {
    status: status === 'error' ? 'error' : isUnavailable ? 'empty' : status,
    weatherDataStatus,
    isLoading,
    isError: isError || forcedError,
    errorMessage: friendlyErrorMessage,
    offlineMessage,
    snapshot: cacheTooOld ? null : (weatherQuery.data ?? null),
    recommendations: cacheTooOld ? null : recommendations,
    dailyBrief: cacheTooOld ? null : (dailyBriefBundle?.current ?? null),
    dailyBriefByMoment: cacheTooOld ? null : (dailyBriefBundle?.byMoment ?? null),
    nextHours: cacheTooOld ? [] : nextHours,
    isUsingCachedWeather,
    isWeatherStale,
    locationPermissionDenied,
    selectedPlanType,
    refetch: async () => {
      await locationQuery.refetch();
      await weatherQuery.refetch();
    },
  };
}
