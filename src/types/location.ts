import type { Coordinates } from '@/src/types/weather';

export type CurrentLocationSource = 'gps' | 'cached' | 'fallback' | 'permission_fallback';

export type FavoriteLocationTag = 'casa' | 'trabajo' | 'playa' | 'piscina' | 'viaje';

export interface LocationIdentity {
  id: string;
  cityName: string;
  region?: string;
  country?: string;
  coordinates: Coordinates;
}

export interface CurrentLocation extends LocationIdentity {
  source: CurrentLocationSource;
}

export interface SavedLocation extends LocationIdentity {
  source: 'search';
  favoriteTag?: FavoriteLocationTag;
  createdAtISO: string;
}

export interface CitySearchResult extends LocationIdentity {
  timezone?: string;
}

export interface WeatherRequestLocation extends LocationIdentity {}

export type SelectedLocationRef =
  | { kind: 'current' }
  | { kind: 'saved'; id: string };
