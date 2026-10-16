import * as Location from 'expo-location';

import { CURRENT_LOCATION_ID, normalizeSearchQuery } from '@/src/domain/location/locationDomain';
import type { CitySearchResult, CurrentLocation } from '@/src/types/location';
import type { Coordinates } from '@/src/types/weather';

export const LOCATION_PERMISSION_DENIED_CODE = 'LOCATION_PERMISSION_DENIED';

const GEO_SEARCH_TIMEOUT_MS = 7_000;

interface ResolvedPlacemark {
  cityName: string;
  region?: string;
  country?: string;
}

interface OpenMeteoGeocodingResponse {
  results?: Array<{
    id?: number;
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  }>;
}

function pickCityName(placemark: Location.LocationGeocodedAddress | null): string {
  if (!placemark) {
    return 'Tu zona';
  }

  return placemark.city ?? placemark.district ?? placemark.subregion ?? placemark.region ?? 'Tu zona';
}

function pickPlacemark(placemark: Location.LocationGeocodedAddress | null): ResolvedPlacemark {
  if (!placemark) {
    return { cityName: 'Tu zona' };
  }

  return {
    cityName: pickCityName(placemark),
    region: placemark.region ?? placemark.subregion ?? undefined,
    country: placemark.country ?? undefined,
  };
}

async function reverseGeocode(coordinates: Coordinates): Promise<ResolvedPlacemark> {
  try {
    const [placemark] = await Location.reverseGeocodeAsync(coordinates);
    return pickPlacemark(placemark ?? null);
  } catch {
    return { cityName: 'Tu zona' };
  }
}

function withCurrentLocationIdentity(
  placemark: ResolvedPlacemark,
  coordinates: Coordinates,
  source: CurrentLocation['source'],
): CurrentLocation {
  return {
    id: CURRENT_LOCATION_ID,
    cityName: placemark.cityName,
    region: placemark.region,
    country: placemark.country,
    coordinates,
    source,
  };
}

export async function getCurrentDeviceLocation(): Promise<CurrentLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw createLocationPermissionDeniedError();
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const coordinates: Coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };

  const placemark = await reverseGeocode(coordinates);
  return withCurrentLocationIdentity(placemark, coordinates, 'gps');
}

export function createLocationPermissionDeniedError(): Error {
  const error = new Error('Permiso de ubicación no concedido') as Error & { code?: string };
  error.code = LOCATION_PERMISSION_DENIED_CODE;
  return error;
}

export function isLocationPermissionDeniedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const withCode = error as { code?: string; message?: string };
  if (withCode.code === LOCATION_PERMISSION_DENIED_CODE) {
    return true;
  }

  return typeof withCode.message === 'string' && withCode.message.toLowerCase().includes('permiso de ubicación');
}

function buildGeocodingUrl(query: string): string {
  const params = new URLSearchParams({
    name: query,
    count: '7',
    language: 'es',
    format: 'json',
  });

  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
}

async function fetchGeocodingWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, GEO_SEARCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } catch {
    throw new Error('No pudimos completar la búsqueda ahora.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchCityLocations(rawQuery: string): Promise<CitySearchResult[]> {
  const query = normalizeSearchQuery(rawQuery);
  if (query.length < 2) {
    return [];
  }

  let results: OpenMeteoGeocodingResponse['results'] = [];

  try {
    const response = await fetchGeocodingWithTimeout(buildGeocodingUrl(query));
    if (!response.ok) {
      throw new Error('No pudimos buscar ciudades ahora.');
    }
    const payload = (await response.json()) as OpenMeteoGeocodingResponse;
    results = payload.results ?? [];
  } catch {
    throw new Error('No pudimos completar la búsqueda ahora.');
  }

  return results.map((result, index) => ({
    id: `geo-${result.id ?? `${result.name}-${index}`}`,
    cityName: result.name,
    region: result.admin1,
    country: result.country,
    coordinates: {
      latitude: result.latitude,
      longitude: result.longitude,
    },
    timezone: result.timezone,
  }));
}
