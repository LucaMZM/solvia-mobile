import { buildBestNextWindows } from '@/src/features/planning/bestNextWindowEngine';
import { planStatusLabels, planTypeLabels } from '@/src/features/planning/catalog';
import { evaluateForecastConfidence } from '@/src/features/planning/forecastConfidence';
import {
  getSafeRecommendationLabel,
  safeCopy,
  statusFromPolicyScore,
} from '@/src/features/recommendations/recommendationPolicy';
import { buildWeatherRiskProfile } from '@/src/features/recommendations/weatherRisk';
import type { ThermalProfile, OutfitRecommendation } from '@/src/types/recommendations';
import type { PlanGuidance, PlanType, PlanningBundle } from '@/src/types/planning';
import type { WeatherSnapshot } from '@/src/types/weather';

interface BuildPlanningBundleInput {
  snapshot: WeatherSnapshot;
  thermalProfile: ThermalProfile;
  outfit: OutfitRecommendation;
}

function weatherRiskSummary(planType: PlanType, metrics: PlanGuidance['window']['metrics']): string {
  const rainRisk =
    metrics.rainPeakProbability >= 70 || metrics.rainPeakMm >= 0.8
      ? 'Lluvia alta.'
      : metrics.rainPeakProbability >= 42 || metrics.rainPeakMm >= 0.35
        ? 'Lluvia posible.'
        : 'Lluvia baja.';

  const windRisk =
    metrics.windPeakKmh >= 38
      ? 'Viento fuerte.'
      : metrics.windPeakKmh >= 26
        ? 'Viento moderado.'
        : 'Viento suave.';

  const coolingRisk =
    metrics.apparentDeltaC <= -3
      ? 'Refresca en la franja.'
      : metrics.apparentDeltaC >= 3
        ? 'Sube la sensación térmica.'
        : 'Confort estable.';

  if (planType === 'trayecto') {
    return `${rainRisk} ${windRisk} ${coolingRisk}`;
  }
  if (planType === 'tomar_sol' || planType === 'playa' || planType === 'piscina') {
    return `${rainRisk} ${windRisk} UV ${Math.round(metrics.uvAverage)}.`;
  }
  return `${rainRisk} ${windRisk} ${coolingRisk}`;
}

function outfitGuidance(planType: PlanType, outfit: OutfitRecommendation): string {
  if (planType === 'correr_suave') {
    return `${outfit.superior}. ${outfit.calzado}.`;
  }
  if (planType === 'terraza') {
    return `${outfit.capa}. ${outfit.accesorios}.`;
  }
  if (planType === 'piscina' || planType === 'playa' || planType === 'tomar_sol') {
    return `${outfit.accesorios}. Mantén ${outfit.capa.toLowerCase().includes('no necesaria') ? 'una capa ligera de respaldo' : outfit.capa.toLowerCase()}.`;
  }
  if (planType === 'trayecto') {
    return `${outfit.calzado}. ${outfit.capa}.`;
  }
  return `${outfit.superior}. ${outfit.capa}.`;
}

function isSunExposurePlan(planType: PlanType): boolean {
  return planType === 'tomar_sol' || planType === 'playa' || planType === 'piscina';
}

function hasStrongWeatherReason(planType: PlanType, metrics: PlanGuidance['window']['metrics']): boolean {
  const strongRain = metrics.rainPeakProbability >= 60 || metrics.rainPeakMm >= 0.8;
  const strongWind = metrics.windPeakKmh >= 35;
  const strongUv = isSunExposurePlan(planType) && metrics.uvAverage >= 8;
  return strongRain || strongWind || strongUv;
}

function bestMomentCopy(planType: PlanType, window: PlanGuidance['window']): string {
  if (window.score < 42) {
    return 'Mejor evitar por ahora';
  }
  if (window.shouldDoNow) {
    return window.score >= 62 ? 'Ahora es viable' : 'Ahora con ajustes';
  }
  if (window.metrics.rainPeakProbability >= 60 || window.metrics.rainPeakMm >= 0.8) {
    return 'Espera solo si quieres evitar lluvia';
  }
  if (window.metrics.windPeakKmh >= 35) {
    return 'Más tarde mejora el viento';
  }
  if (isSunExposurePlan(planType) && window.metrics.uvAverage >= 8) {
    return 'Más tarde baja el UV';
  }
  return 'No hace falta cambiar la hora';
}

function nowVsLaterCopy(planType: PlanType, window: PlanGuidance['window']): string {
  if (window.score < 42) {
    return 'Ahora se siente inestable.';
  }
  if (window.shouldDoNow) {
    return hasStrongWeatherReason(planType, window.metrics)
      ? 'Ahora es viable con ajustes.'
      : 'Ahora es viable.';
  }
  if (window.metrics.rainPeakProbability >= 60 || window.metrics.rainPeakMm >= 0.8) {
    return 'Ahora hay lluvia posible; más tarde baja.';
  }
  if (window.metrics.windPeakKmh >= 35) {
    return 'Ahora hay viento marcado; más tarde mejora.';
  }
  if (isSunExposurePlan(planType) && window.metrics.uvAverage >= 8) {
    return 'Ahora el UV aprieta; más tarde afloja.';
  }
  return 'No hace falta cambiar la hora.';
}

function buildPlanGuidance(params: {
  planType: PlanType;
  window: PlanGuidance['window'];
  outfit: OutfitRecommendation;
  snapshot: WeatherSnapshot;
}): PlanGuidance {
  const risk = buildWeatherRiskProfile(params.snapshot);
  const status = statusFromPolicyScore(params.window.score, risk);
  const safeLabel = getSafeRecommendationLabel(params.planType, risk, params.window.score);
  const bestMoment = safeLabel === 'Recomendado' ? bestMomentCopy(params.planType, params.window) : safeLabel;
  const doNowOrLater = safeCopy(nowVsLaterCopy(params.planType, params.window), risk);

  return {
    planType: params.planType,
    status,
    statusLabel: planStatusLabels[status],
    bestMoment,
    doNowOrLater,
    weatherRiskSummary: risk.summary || weatherRiskSummary(params.planType, params.window.metrics),
    outfitGuidance: outfitGuidance(params.planType, params.outfit),
    window: params.window,
  };
}

export function buildPlanningBundle(input: BuildPlanningBundleInput): PlanningBundle {
  const windows = buildBestNextWindows({
    snapshot: input.snapshot,
    thermalProfile: input.thermalProfile,
  });
  const confidence = evaluateForecastConfidence(input.snapshot);

  const plans = Object.fromEntries(
    (Object.keys(windows) as PlanType[]).map((planType) => [
      planType,
      buildPlanGuidance({
        planType,
        window: windows[planType],
        outfit: input.outfit,
        snapshot: input.snapshot,
      }),
    ]),
  ) as Record<PlanType, PlanGuidance>;

  return {
    thermalProfile: input.thermalProfile,
    confidence,
    windows,
    plans,
  };
}

export function planSummaryLine(planType: PlanType, planning: PlanningBundle): string {
  const guidance = planning.plans[planType];
  const label = planTypeLabels[planType];
  return `${label}: ${guidance.bestMoment.toLowerCase()}. ${guidance.weatherRiskSummary}`;
}
