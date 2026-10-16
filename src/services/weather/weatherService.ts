import {
  getWeatherCacheDebugKey,
  loadWeatherSnapshotCache,
  saveWeatherSnapshotCache,
} from '@/src/services/weather/weatherCache';
import { normalizeWeatherSnapshot } from '@/src/services/weather/weatherIntegrity';
import { resolveWeatherProvider } from '@/src/services/weather/weatherProviderRegistry';
import type { WeatherRequestLocation } from '@/src/types/location';
import type { Coordinates, WeatherFallbackReason, WeatherSnapshot } from '@/src/types/weather';

export const WEATHER_CURRENT_FRESHNESS_MAX_MINUTES = 15;
export const WEATHER_FALLBACK_CACHE_MAX_MINUTES = 60;
const CURRENT_LOCATION_ID = 'current-device';
const LOCATION_GRID_TOLERANCE_KM = 5;
const CURRENT_LOCATION_TOLERANCE_KM = 2;
const ROUTE_SEGMENT_GRID_TOLERANCE_KM = 10;
const configuredProvider = (process.env.EXPO_PUBLIC_WEATHER_PROVIDER ?? 'open-meteo').trim().toLowerCase();
const resolvedWeatherProvider = resolveWeatherProvider(configuredProvider);

export function getWeatherProviderRuntimeInfo() {
  return resolvedWeatherProvider.runtime;
}

interface CacheLocationMatch {
  accepted: boolean;
  distanceKm: number;
  thresholdKm: number;
  reason: 'same_location' | 'current_location_nearby' | 'location_id_mismatch' | 'distance_exceeded';
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKmBetween(left: Coordinates, right: Coordinates): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isRouteSegmentLocation(locationId: string): boolean {
  return locationId.startsWith('trayecto-segmento-');
}

function resolveSameIdThresholdKm(locationId: string): number {
  return isRouteSegmentLocation(locationId) ? ROUTE_SEGMENT_GRID_TOLERANCE_KM : LOCATION_GRID_TOLERANCE_KM;
}

function resolveCacheLocationMatch(params: {
  location: WeatherRequestLocation;
  cacheLocationId: string;
  cacheCoordinates: Coordinates;
}): CacheLocationMatch {
  const { location, cacheLocationId, cacheCoordinates } = params;
  const distanceKm = distanceKmBetween(location.coordinates, cacheCoordinates);
  const sameLocationId = cacheLocationId === location.id;

  if (sameLocationId) {
    const thresholdKm = resolveSameIdThresholdKm(location.id);
    return {
      accepted: distanceKm <= thresholdKm,
      distanceKm,
      thresholdKm,
      reason: distanceKm <= thresholdKm ? 'same_location' : 'distance_exceeded',
    };
  }

  const currentLocationNearby = location.id === CURRENT_LOCATION_ID && distanceKm <= CURRENT_LOCATION_TOLERANCE_KM;
  return {
    accepted: currentLocationNearby,
    distanceKm,
    thresholdKm: CURRENT_LOCATION_TOLERANCE_KM,
    reason: currentLocationNearby ? 'current_location_nearby' : 'location_id_mismatch',
  };
}

function fallbackReasonFromError(error: unknown): WeatherFallbackReason {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timed out') || message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('network') || message.includes('failed to fetch') || message.includes('request failed')) {
      return 'offline';
    }
    if (message.includes('open-meteo')) {
      return 'api';
    }
  }

  return 'unknown';
}

export async function getWeatherSnapshot(location: WeatherRequestLocation): Promise<WeatherSnapshot> {
  const cacheKey = getWeatherCacheDebugKey(location);

  try {
    const parsed = await resolvedWeatherProvider.provider.getSnapshot(location);
    const normalized = normalizeWeatherSnapshot(parsed);
    const hasUsableCurrentTemperature = Number.isFinite(normalized.current.temperatureC);
    if (!hasUsableCurrentTemperature || normalized.meta?.dataStatus === 'unavailable') {
      throw new Error('Open-Meteo no devolvió una temperatura actual utilizable.');
    }

    const liveStatus = normalized.meta?.dataStatus ?? 'available';
    const snapshot: WeatherSnapshot = {
      ...parsed,
      ...normalized,
      meta: {
        source: 'live',
        cacheAgeMinutes: 0,
        isStale: false,
        dataStatus: liveStatus,
        integrityWarnings: normalized.meta?.integrityWarnings,
      },
    };

    if (__DEV__) {
      const selectedHourlyIndex = snapshot.hourly.findIndex((point) => point.timeISO === snapshot.current.timeISO);
      // eslint-disable-next-line no-console
      console.info('[weather-debug] live', {
        locationId: location.id,
        requestedCoordinates: location.coordinates,
        responseCoordinates: snapshot.coordinates,
        city: location.cityName,
        cacheKey,
        cacheAgeMinutes: 0,
        cacheAccepted: false,
        provider: resolvedWeatherProvider.runtime.active,
        currentTemp: snapshot.current.temperatureC,
        currentTempSource: 'current_or_hourly_nearest',
        dailyMin: snapshot.daily.minTemperatureC,
        dailyMax: snapshot.daily.maxTemperatureC,
        uvNow: snapshot.current.uvIndex,
        uvSource: 'hourly_nearest',
        uvStatus: snapshot.current.uvStatus,
        isDay: snapshot.current.isDay,
        nowSystemISO: new Date().toISOString(),
        timezone: snapshot.timezone,
        localTime: snapshot.current.timeISO,
        selectedHourlyIndex,
        hourlyPoints: snapshot.hourly.length,
        finalStatus: snapshot.meta?.dataStatus,
        warnings: snapshot.meta?.integrityWarnings ?? [],
      });
    }

    await saveWeatherSnapshotCache(location, snapshot);
    return snapshot;
  } catch (error) {
    const cached = await loadWeatherSnapshotCache(location);
    if (cached) {
      const cacheLocationMatch = resolveCacheLocationMatch({
        location,
        cacheLocationId: cached.locationId,
        cacheCoordinates: cached.responseCoordinates,
      });

      if (!cacheLocationMatch.accepted) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[weather-debug] cache-ignored-location-mismatch', {
            locationId: location.id,
            cacheLocationId: cached.locationId,
            city: location.cityName,
            cacheCity: cached.cityName,
            cacheKey,
            requestedCoordinates: location.coordinates,
            cacheRequestedCoordinates: cached.requestedCoordinates,
            cacheCoordinates: cached.responseCoordinates,
            distanceKm: Number(cacheLocationMatch.distanceKm.toFixed(2)),
            cacheAccepted: false,
            cacheRejectReason: cacheLocationMatch.reason,
            finalStatus: 'error',
          });
        }
        throw new Error('No hemos podido actualizar el tiempo. Vuelve a intentarlo.');
      }

      const normalizedCache = normalizeWeatherSnapshot(cached.snapshot);
      const fallbackReason = fallbackReasonFromError(error);
      const isTooOld = cached.cacheAgeMinutes > WEATHER_FALLBACK_CACHE_MAX_MINUTES;
      const isStale = cached.cacheAgeMinutes > WEATHER_CURRENT_FRESHNESS_MAX_MINUTES;
      const hasCriticalGap = normalizedCache.meta?.dataStatus === 'unavailable';
      const cacheStatus = hasCriticalGap ? 'unavailable' : isStale ? 'partial' : 'available';

      if (isTooOld) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[weather-debug] cache-rejected-too-old', {
            locationId: location.id,
            cacheLocationId: cached.locationId,
            city: location.cityName,
            cacheCity: cached.cityName,
            cacheKey,
            cacheAgeMinutes: cached.cacheAgeMinutes,
            cacheSavedAtISO: cached.savedAtISO,
            requestedCoordinates: location.coordinates,
            cacheRequestedCoordinates: cached.requestedCoordinates,
            cacheCoordinates: cached.responseCoordinates,
            distanceKm: Number(cacheLocationMatch.distanceKm.toFixed(2)),
            cacheAccepted: false,
            cacheRejectReason: 'too_old',
            fallbackReason,
            nowSystemISO: new Date().toISOString(),
            timezone: normalizedCache.timezone,
            cacheCurrentTime: normalizedCache.current.timeISO,
            finalStatus: 'error',
            warnings: normalizedCache.meta?.integrityWarnings ?? [],
          });
        }

        throw new Error('No hemos podido actualizar el tiempo. Última lectura demasiado antigua.');
      }

      if (__DEV__) {
        const selectedHourlyIndex = normalizedCache.hourly.findIndex(
          (point) => point.timeISO === normalizedCache.current.timeISO,
        );
        // eslint-disable-next-line no-console
        console.warn('[weather-debug] cache-fallback', {
          locationId: location.id,
          cacheLocationId: cached.locationId,
          requestedCoordinates: location.coordinates,
          cacheRequestedCoordinates: cached.requestedCoordinates,
          cacheCoordinates: cached.responseCoordinates,
          distanceKm: Number(cacheLocationMatch.distanceKm.toFixed(2)),
          cacheAccepted: true,
          city: location.cityName,
          cacheCity: cached.cityName,
          cacheKey,
          cacheAgeMinutes: cached.cacheAgeMinutes,
          cacheSavedAtISO: cached.savedAtISO,
          reason: fallbackReason,
          currentTemp: normalizedCache.current.temperatureC,
          currentTempSource: 'cache_hourly_or_current',
          dailyMin: normalizedCache.daily.minTemperatureC,
          dailyMax: normalizedCache.daily.maxTemperatureC,
          uvNow: normalizedCache.current.uvIndex,
          uvSource: 'cache_hourly_nearest',
          uvStatus: normalizedCache.current.uvStatus,
          isDay: normalizedCache.current.isDay,
          nowSystemISO: new Date().toISOString(),
          timezone: normalizedCache.timezone,
          localTime: normalizedCache.current.timeISO,
          selectedHourlyIndex,
          hourlyPoints: normalizedCache.hourly.length,
          finalStatus: cacheStatus,
          warnings: normalizedCache.meta?.integrityWarnings ?? [],
        });
      }

      return {
        ...normalizedCache,
        cityName: location.cityName,
        meta: {
          source: 'cache',
          cacheAgeMinutes: cached.cacheAgeMinutes,
          isStale,
          fallbackReason,
          dataStatus: cacheStatus,
          integrityWarnings: normalizedCache.meta?.integrityWarnings,
        },
      };
    }

    throw new Error('No pudimos actualizar el clima ahora mismo.');
  }
}
