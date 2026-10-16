import type {
  CitySearchResult,
  FavoriteLocationTag,
  SavedLocation,
  SelectedLocationRef,
  WeatherRequestLocation,
  CurrentLocation,
} from '@/src/types/location';

export const CURRENT_LOCATION_ID = 'current-device';

export const favoriteLocationTags: readonly FavoriteLocationTag[] = [
  'casa',
  'trabajo',
  'playa',
  'piscina',
  'viaje',
];

export const favoriteLocationTagLabels: Record<FavoriteLocationTag, string> = {
  casa: 'Casa',
  trabajo: 'Trabajo',
  playa: 'Playa',
  piscina: 'Piscina',
  viaje: 'Viaje',
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export function buildLocationSubtitle(location: Pick<WeatherRequestLocation, 'region' | 'country'>): string {
  const parts = [location.region, location.country].filter((value): value is string => Boolean(value && value.trim()));
  return parts.join(', ');
}

function slugFromResult(result: CitySearchResult): string {
  const base = [result.cityName, result.region ?? '', result.country ?? '']
    .map((part) => normalizeText(part).replace(/[^a-z0-9]+/g, '-'))
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.length > 0 ? base : 'ubicacion';
}

export function createSavedLocation(result: CitySearchResult): SavedLocation {
  const latitude = result.coordinates.latitude.toFixed(3).replace('.', '_');
  const longitude = result.coordinates.longitude.toFixed(3).replace('.', '_');

  return {
    id: `saved-${slugFromResult(result)}-${latitude}-${longitude}`,
    cityName: result.cityName,
    region: result.region,
    country: result.country,
    coordinates: result.coordinates,
    source: 'search',
    createdAtISO: new Date().toISOString(),
  };
}

export function areLocationsEquivalent(
  left: Pick<WeatherRequestLocation, 'cityName' | 'coordinates'>,
  right: Pick<WeatherRequestLocation, 'cityName' | 'coordinates'>,
): boolean {
  const cityMatch = normalizeText(left.cityName) === normalizeText(right.cityName);
  const latitudeDiff = Math.abs(left.coordinates.latitude - right.coordinates.latitude);
  const longitudeDiff = Math.abs(left.coordinates.longitude - right.coordinates.longitude);

  return cityMatch && latitudeDiff < 0.01 && longitudeDiff < 0.01;
}

export function resolveSelectedLocation(params: {
  currentLocation: CurrentLocation | null;
  savedLocations: SavedLocation[];
  selectedLocation: SelectedLocationRef;
}): WeatherRequestLocation | null {
  const { currentLocation, savedLocations, selectedLocation } = params;

  if (selectedLocation.kind === 'saved') {
    const saved = savedLocations.find((location) => location.id === selectedLocation.id);
    if (saved) {
      return saved;
    }
  }

  return currentLocation;
}
