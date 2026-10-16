import type { CitySearchResult, WeatherRequestLocation } from '@/src/types/location';
import type {
  CarTrayectoConfig,
  LocalTrayectoConfig,
  RouteCityPoint,
  TrayectoActivityType,
  TrayectoDepartureMode,
  TrayectoMode,
} from '@/src/types/trayecto';

export const trayectoModes: readonly TrayectoMode[] = ['paseo_local', 'coche_ruta'];

export const trayectoModeLabels: Record<TrayectoMode, string> = {
  paseo_local: 'Paseo local',
  coche_ruta: 'Ruta en coche',
};

export const trayectoDepartureModes: readonly TrayectoDepartureMode[] = ['ahora', 'personalizada'];

export const trayectoDepartureModeLabels: Record<TrayectoDepartureMode, string> = {
  ahora: 'Ahora',
  personalizada: 'Hora personalizada',
};

export const localTrayectoDurationOptions: readonly LocalTrayectoConfig['durationMin'][] = [
  15,
  30,
  45,
  60,
  90,
];

export const localTrayectoActivityOptions: readonly TrayectoActivityType[] = [
  'paseo',
  'correr_suave',
  'paseo_perro',
  'terraza',
];

export const localTrayectoActivityLabels: Record<TrayectoActivityType, string> = {
  paseo: 'Paseo',
  correr_suave: 'Correr suave',
  paseo_perro: 'Paseo del perro',
  terraza: 'Terraza',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function floorToQuarter(minute: number): number {
  return Math.floor(clamp(minute, 0, 59) / 15) * 15;
}

function safeNumber(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeDepartureTime(hour: number, minute: number): { hour: number; minute: number } {
  const safeHour = safeNumber(hour, 12);
  const safeMinute = safeNumber(minute, 0);
  return {
    hour: clamp(Math.round(safeHour), 0, 23),
    minute: floorToQuarter(Math.round(safeMinute)),
  };
}

export function createDefaultLocalTrayectoConfig(referenceDate: Date = new Date()): LocalTrayectoConfig {
  const normalized = normalizeDepartureTime(referenceDate.getHours(), referenceDate.getMinutes());

  return {
    durationMin: 45,
    departureMode: 'ahora',
    departureCustomHour: normalized.hour,
    departureCustomMinute: normalized.minute,
    activityType: 'paseo',
  };
}

export function createDefaultCarTrayectoConfig(referenceDate: Date = new Date()): CarTrayectoConfig {
  const normalized = normalizeDepartureTime(referenceDate.getHours(), referenceDate.getMinutes());
  return {
    departureMode: 'ahora',
    departureCustomHour: normalized.hour,
    departureCustomMinute: normalized.minute,
    origin: null,
    destination: null,
    optionalStops: [],
  };
}

export function resolveDepartureDate(params: {
  departureMode: TrayectoDepartureMode;
  customHour: number;
  customMinute: number;
  referenceISO: string;
}): Date {
  const reference = new Date(params.referenceISO);
  if (params.departureMode === 'ahora') {
    return reference;
  }

  const normalized = normalizeDepartureTime(params.customHour, params.customMinute);
  const planned = new Date(reference);
  planned.setHours(normalized.hour, normalized.minute, 0, 0);

  // If the selected time is already behind the current moment, move to next day.
  if (planned.getTime() < reference.getTime() - 5 * 60_000) {
    planned.setDate(planned.getDate() + 1);
  }

  return planned;
}

export function formatDurationLabel(minutes: number): string {
  return `${minutes} min`;
}

function toRouteCityPointBase(params: {
  id: string;
  cityName: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}): RouteCityPoint {
  return {
    id: params.id,
    cityName: params.cityName,
    region: params.region,
    country: params.country,
    coordinates: {
      latitude: params.latitude,
      longitude: params.longitude,
    },
  };
}

export function toRoutePointFromSearchResult(result: CitySearchResult): RouteCityPoint {
  return toRouteCityPointBase({
    id: result.id,
    cityName: result.cityName,
    region: result.region,
    country: result.country,
    latitude: result.coordinates.latitude,
    longitude: result.coordinates.longitude,
  });
}

export function toRoutePointFromLocation(location: WeatherRequestLocation): RouteCityPoint {
  return toRouteCityPointBase({
    id: location.id,
    cityName: location.cityName,
    region: location.region,
    country: location.country,
    latitude: location.coordinates.latitude,
    longitude: location.coordinates.longitude,
  });
}

export function buildRoutePointSubtitle(point: Pick<RouteCityPoint, 'region' | 'country'>): string {
  const parts = [point.region, point.country].filter((item): item is string => Boolean(item?.trim()));
  return parts.join(', ');
}

export function compareRoutePoints(left: RouteCityPoint, right: RouteCityPoint): boolean {
  const cityMatch = left.cityName.trim().toLowerCase() === right.cityName.trim().toLowerCase();
  const latDiff = Math.abs(left.coordinates.latitude - right.coordinates.latitude);
  const lonDiff = Math.abs(left.coordinates.longitude - right.coordinates.longitude);
  return cityMatch && latDiff < 0.01 && lonDiff < 0.01;
}

export function createRouteStopId(point: RouteCityPoint): string {
  return `stop-${point.cityName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
}

export function formatTrendLabel(trend: 'sube' | 'estable' | 'baja'): string {
  if (trend === 'sube') {
    return 'Sube';
  }
  if (trend === 'baja') {
    return 'Baja';
  }
  return 'Estable';
}
