import type { Coordinates } from '@/src/types/weather';

export type TrayectoMode = 'paseo_local' | 'coche_ruta';

export type TrayectoDepartureMode = 'ahora' | 'personalizada';

export type TrayectoActivityType = 'paseo' | 'correr_suave' | 'paseo_perro' | 'terraza';

export type TrayectoRiskTrend = 'sube' | 'estable' | 'baja';

export interface RouteCityPoint {
  id: string;
  cityName: string;
  region?: string;
  country?: string;
  coordinates: Coordinates;
}

export interface LocalTrayectoConfig {
  durationMin: 15 | 30 | 45 | 60 | 90;
  departureMode: TrayectoDepartureMode;
  departureCustomHour: number;
  departureCustomMinute: number;
  activityType: TrayectoActivityType;
}

export interface LocalTrayectoAnalysis {
  departureLabel: string;
  summary: string;
  leaveDecision: string;
  bestDepartureLabel: string;
  latestReturnLabel: string;
  umbrellaRecommended: boolean;
  shorterOutingRecommended: boolean;
  rainTrend: TrayectoRiskTrend;
  windTrend: TrayectoRiskTrend;
  coolingTrend: TrayectoRiskTrend;
  rainSupport: string;
  windSupport: string;
  coolingSupport: string;
}

export interface CarTrayectoConfig {
  departureMode: TrayectoDepartureMode;
  departureCustomHour: number;
  departureCustomMinute: number;
  origin: RouteCityPoint | null;
  destination: RouteCityPoint | null;
  optionalStops: RouteCityPoint[];
}

export interface RouteSegmentPlan {
  id: string;
  label: string;
  startCoordinates: Coordinates;
  endCoordinates: Coordinates;
  distanceKm: number;
  durationMin: number;
  midpointCoordinates: Coordinates;
  cumulativeMinutesAtEnd: number;
}

export interface RoutePlanResult {
  providerId: string;
  confidence: 'fallback' | 'provider';
  totalDistanceKm: number;
  totalDurationMin: number;
  segments: RouteSegmentPlan[];
  notes: string[];
}

export interface CarRouteSegmentAnalysis {
  id: string;
  label: string;
  etaLabel: string;
  rainRiskLabel: string;
  windRiskLabel: string;
  support: string;
}

export interface CarTrayectoAnalysis {
  departureLabel: string;
  summary: string;
  leaveDecision: string;
  routeSummary: string;
  rainRiskLabel: string;
  windRiskLabel: string;
  umbrellaRecommended: boolean;
  shortenSuggestion: string;
  arrivalWeather: string;
  providerLabel: string;
  providerSupport: string;
  segments: CarRouteSegmentAnalysis[];
}
