import { compareRoutePoints } from '@/src/domain/trayecto/trayectoDomain';
import type { Coordinates } from '@/src/types/weather';
import type { RouteCityPoint, RoutePlanResult, RouteSegmentPlan } from '@/src/types/trayecto';
import type { RoutePlanningInput, RoutingProvider } from '@/src/services/routing/routingProvider';

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(start: Coordinates, end: Coordinates): number {
  const latDelta = toRadians(end.latitude - start.latitude);
  const lonDelta = toRadians(end.longitude - start.longitude);
  const startLat = toRadians(start.latitude);
  const endLat = toRadians(end.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function estimateSegmentSpeed(distanceKm: number): number {
  if (distanceKm <= 10) {
    return 34;
  }
  if (distanceKm <= 45) {
    return 52;
  }
  if (distanceKm <= 130) {
    return 78;
  }
  return 94;
}

function midpoint(start: Coordinates, end: Coordinates): Coordinates {
  return {
    latitude: (start.latitude + end.latitude) / 2,
    longitude: (start.longitude + end.longitude) / 2,
  };
}

function sanitizeStops(origin: RouteCityPoint, destination: RouteCityPoint, stops: RouteCityPoint[]): RouteCityPoint[] {
  const unique: RouteCityPoint[] = [];

  stops.forEach((stop) => {
    if (compareRoutePoints(stop, origin) || compareRoutePoints(stop, destination)) {
      return;
    }
    const exists = unique.some((item) => compareRoutePoints(item, stop));
    if (!exists) {
      unique.push(stop);
    }
  });

  return unique;
}

function toSegmentLabel(start: RouteCityPoint, end: RouteCityPoint): string {
  return `${start.cityName} → ${end.cityName}`;
}

function buildSegmentPlan(params: {
  start: RouteCityPoint;
  end: RouteCityPoint;
  index: number;
  cumulativeBeforeMin: number;
}): RouteSegmentPlan {
  const baselineDistanceKm = haversineDistanceKm(params.start.coordinates, params.end.coordinates);
  const adjustedDistanceKm = baselineDistanceKm * 1.28;
  const speedKmh = estimateSegmentSpeed(adjustedDistanceKm);
  const travelMinutes = Math.max(10, Math.round((adjustedDistanceKm / speedKmh) * 60));
  const stopBuffer = params.index > 0 ? 4 : 0;
  const durationMin = travelMinutes + stopBuffer;

  return {
    id: `seg-${params.index + 1}-${params.start.id}-${params.end.id}`,
    label: toSegmentLabel(params.start, params.end),
    startCoordinates: params.start.coordinates,
    endCoordinates: params.end.coordinates,
    distanceKm: Number(adjustedDistanceKm.toFixed(1)),
    durationMin,
    midpointCoordinates: midpoint(params.start.coordinates, params.end.coordinates),
    cumulativeMinutesAtEnd: params.cumulativeBeforeMin + durationMin,
  };
}

function buildNotes(totalDistanceKm: number, segmentsCount: number): string[] {
  const notes = [
    'Ruta estimada con aproximación por distancia para mantener el servicio disponible.',
    'No incluye tráfico en tiempo real ni incidencias de carretera.',
  ];

  if (segmentsCount > 2) {
    notes.push('Las paradas intermedias añaden margen de tiempo para una lectura más realista.');
  }

  if (totalDistanceKm > 220) {
    notes.push('En trayectos largos conviene revisar de nuevo antes de salir.');
  }

  return notes;
}

export const fallbackRoutingProvider: RoutingProvider = {
  id: 'fallback-distance-v1',
  planRoute: async (input: RoutePlanningInput): Promise<RoutePlanResult> => {
    const stops = sanitizeStops(input.origin, input.destination, input.stops ?? []);
    const points = [input.origin, ...stops, input.destination];
    const segments: RouteSegmentPlan[] = [];
    let cumulativeMinutes = 0;

    for (let index = 0; index < points.length - 1; index += 1) {
      const segment = buildSegmentPlan({
        start: points[index],
        end: points[index + 1],
        index,
        cumulativeBeforeMin: cumulativeMinutes,
      });
      cumulativeMinutes = segment.cumulativeMinutesAtEnd;
      segments.push(segment);
    }

    const totalDistanceKm = Number(segments.reduce((acc, segment) => acc + segment.distanceKm, 0).toFixed(1));
    const totalDurationMin = segments.reduce((acc, segment) => acc + segment.durationMin, 0);

    return {
      providerId: 'fallback-distance-v1',
      confidence: 'fallback',
      totalDistanceKm,
      totalDurationMin,
      segments,
      notes: buildNotes(totalDistanceKm, segments.length),
    };
  },
};
