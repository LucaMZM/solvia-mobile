import type { ThermalProfile } from '@/src/types/recommendations';

export type PlanType =
  | 'caminar'
  | 'correr_suave'
  | 'terraza'
  | 'piscina'
  | 'playa'
  | 'tomar_sol'
  | 'paseo_perro'
  | 'trayecto';

export type PlanStatus = 'recomendado' | 'okay' | 'regular' | 'evitar';

export interface PlanWindowMetrics {
  rainPeakProbability: number;
  rainPeakMm: number;
  windPeakKmh: number;
  uvAverage: number;
  apparentDeltaC: number;
  mostlyDaylight: boolean;
}

export interface PlanWindowResult {
  planType: PlanType;
  startISO: string;
  endISO: string;
  label: string;
  reason: string;
  score: number;
  shouldDoNow: boolean;
  nowOrLaterLabel: string;
  metrics: PlanWindowMetrics;
}

export type ForecastConfidenceTone = 'alta_confianza' | 'confianza_media' | 'puede_cambiar';

export interface ForecastConfidence {
  tone: ForecastConfidenceTone;
  label: string;
  support: string;
  rainStatement: string;
  umbrellaAdvice: string;
}

export interface PlanGuidance {
  planType: PlanType;
  status: PlanStatus;
  statusLabel: string;
  bestMoment: string;
  doNowOrLater: string;
  weatherRiskSummary: string;
  outfitGuidance: string;
  window: PlanWindowResult;
}

export interface PlanningBundle {
  thermalProfile: ThermalProfile;
  confidence: ForecastConfidence;
  windows: Record<PlanType, PlanWindowResult>;
  plans: Record<PlanType, PlanGuidance>;
}
