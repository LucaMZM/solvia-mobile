import { appStorage } from '@/src/services/storage/appStorage';
import type { WeatherRequestLocation } from '@/src/types/location';
import type { Coordinates, WeatherSnapshot } from '@/src/types/weather';

const WEATHER_CACHE_PREFIX = 'solvia-weather-cache-v1';

interface StoredWeatherSnapshot {
  savedAtISO: string;
  locationId?: string;
  cityName?: string;
  requestedCoordinates?: Coordinates;
  responseCoordinates?: Coordinates;
  snapshot: WeatherSnapshot;
}

function buildLocationCacheKey(location: WeatherRequestLocation): string {
  const latitude = location.coordinates.latitude.toFixed(3);
  const longitude = location.coordinates.longitude.toFixed(3);
  return `${WEATHER_CACHE_PREFIX}:${location.id}:${latitude}:${longitude}`;
}

export function getWeatherCacheDebugKey(location: WeatherRequestLocation): string {
  return buildLocationCacheKey(location);
}

function toCacheAgeMinutes(savedAtISO: string): number {
  const savedAtMs = new Date(savedAtISO).getTime();
  if (!Number.isFinite(savedAtMs)) {
    return Number.POSITIVE_INFINITY;
  }
  const deltaMs = Math.max(0, Date.now() - savedAtMs);
  return Math.round(deltaMs / 60_000);
}

function isValidSnapshot(value: unknown): value is WeatherSnapshot {
  if (typeof value !== 'object' || value == null) {
    return false;
  }

  const candidate = value as WeatherSnapshot;
  return (
    typeof candidate.cityName === 'string' &&
    typeof candidate.timezone === 'string' &&
    typeof candidate.fetchedAtISO === 'string' &&
    Array.isArray(candidate.hourly) &&
    typeof candidate.current === 'object' &&
    candidate.current != null &&
    typeof candidate.daily === 'object' &&
    candidate.daily != null
  );
}

export async function saveWeatherSnapshotCache(
  location: WeatherRequestLocation,
  snapshot: WeatherSnapshot,
): Promise<void> {
  const key = buildLocationCacheKey(location);
  const payload: StoredWeatherSnapshot = {
    savedAtISO: new Date().toISOString(),
    locationId: location.id,
    cityName: location.cityName,
    requestedCoordinates: location.coordinates,
    responseCoordinates: snapshot.coordinates,
    snapshot,
  };

  try {
    await appStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore cache persistence failures to avoid impacting weather availability.
  }
}

export async function loadWeatherSnapshotCache(location: WeatherRequestLocation): Promise<{
  snapshot: WeatherSnapshot;
  cacheAgeMinutes: number;
  savedAtISO: string;
  locationId: string;
  cityName: string;
  requestedCoordinates: Coordinates;
  responseCoordinates: Coordinates;
} | null> {
  const key = buildLocationCacheKey(location);

  try {
    const raw = await appStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredWeatherSnapshot;
    if (!parsed || !isValidSnapshot(parsed.snapshot)) {
      return null;
    }

    return {
      snapshot: parsed.snapshot,
      cacheAgeMinutes: toCacheAgeMinutes(parsed.savedAtISO),
      savedAtISO: parsed.savedAtISO,
      locationId: parsed.locationId ?? location.id,
      cityName: parsed.cityName ?? parsed.snapshot.cityName,
      requestedCoordinates: parsed.requestedCoordinates ?? location.coordinates,
      responseCoordinates: parsed.responseCoordinates ?? parsed.snapshot.coordinates,
    };
  } catch {
    return null;
  }
}
