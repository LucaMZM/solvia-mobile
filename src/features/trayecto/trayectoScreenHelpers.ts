import {
  compareRoutePoints,
  toRoutePointFromLocation,
  toRoutePointFromSearchResult,
} from '@/src/domain/trayecto/trayectoDomain';
import type { CitySearchResult, SavedLocation, WeatherRequestLocation } from '@/src/types/location';
import type { CarTrayectoAnalysis, RouteCityPoint } from '@/src/types/trayecto';

export function normalizeRouteSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function mapSearchResultsToRoutePoints(results: CitySearchResult[]): RouteCityPoint[] {
  return results.map((result) => toRoutePointFromSearchResult(result));
}

export function toFriendlyRouteError(error: Error | null): string | null {
  if (!error) {
    return null;
  }

  const message = error.message.toLowerCase();
  if (
    message.includes('network') ||
    message.includes('request failed') ||
    message.includes('failed to fetch') ||
    message.includes('sin conexión')
  ) {
    return 'Sin conexión estable para analizar la ruta.';
  }

  if (message.includes('open-meteo')) {
    return 'No pudimos actualizar el clima de la ruta.';
  }

  return 'No pudimos completar el análisis de ruta en este momento.';
}

export function buildQuickRoutePoints(params: {
  activeLocation: WeatherRequestLocation | null;
  savedLocations: SavedLocation[];
}): RouteCityPoint[] {
  const points: RouteCityPoint[] = [];
  const active = params.activeLocation ? toRoutePointFromLocation(params.activeLocation) : null;

  if (active) {
    points.push(active);
  }

  params.savedLocations.forEach((location) => {
    const point = toRoutePointFromLocation(location);
    if (!points.some((item) => compareRoutePoints(item, point))) {
      points.push(point);
    }
  });

  return points;
}

export function buildRouteNotificationSyncKey(params: {
  originId: string;
  destinationId: string;
  departureISO: string;
  analysis: CarTrayectoAnalysis;
}): string {
  return [
    params.originId,
    params.destinationId,
    params.departureISO.slice(0, 16),
    params.analysis.rainRiskLabel,
    params.analysis.windRiskLabel,
    params.analysis.leaveDecision,
  ].join('|');
}
