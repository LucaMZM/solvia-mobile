import type { PlanType, PlanWindowMetrics, PlanWindowResult } from '@/src/types/planning';
import type { ThermalProfile } from '@/src/types/recommendations';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { isRainWeatherCode, isStormWeatherCode } from '@/src/services/weather/weatherCode';
import {
  average,
  clamp,
  formatWindowLabel,
  isNearSunset,
  nowOrLaterLabel,
  reasonForWindow,
} from '@/src/features/planning/windowShared';

function thermalPenaltyByPlan(apparentTemperature: number, profile: ThermalProfile, planType: PlanType): number {
  const offset = profile === 'friolero' ? -2.5 : profile === 'caluroso' ? 2 : 0;
  const adjusted = apparentTemperature + offset;
  const cold = adjusted < 9 ? (9 - adjusted) * 4.8 : 0;
  const heat = adjusted > 30 ? (adjusted - 30) * 6.1 : 0;
  const base = cold + heat;

  if (planType === 'piscina' || planType === 'playa') {
    const warmBonusPenalty = adjusted < 22 ? (22 - adjusted) * 3.2 : 0;
    return base + warmBonusPenalty;
  }

  if (planType === 'correr_suave') {
    return base * 1.2;
  }
  if (planType === 'paseo_perro') {
    return base * 1.1;
  }

  return base;
}

export function buildMetrics(points: readonly HourlyForecastPoint[]): PlanWindowMetrics {
  if (points.length === 0) {
    return {
      rainPeakProbability: 0,
      rainPeakMm: 0,
      windPeakKmh: 0,
      uvAverage: 0,
      apparentDeltaC: 0,
      mostlyDaylight: false,
    };
  }

  const rainProbabilities = points.map((point) => point.precipitationProbability);
  const rainAmounts = points.map((point) => point.precipitationMm);
  const windValues = points.map((point) => Math.max(point.windSpeedKmh, point.windGustKmh * 0.75));
  const uvValues = points.map((point) => point.uvIndex);
  const dayCount = points.filter((point) => point.isDay).length;
  const first = points[0];
  const last = points[points.length - 1] ?? first;

  return {
    rainPeakProbability: rainProbabilities.length > 0 ? Math.max(...rainProbabilities) : 0,
    rainPeakMm: rainAmounts.length > 0 ? Math.max(...rainAmounts) : 0,
    windPeakKmh: windValues.length > 0 ? Math.max(...windValues) : 0,
    uvAverage: Number(average(uvValues).toFixed(1)),
    apparentDeltaC: Number((last.apparentTemperatureC - first.apparentTemperatureC).toFixed(1)),
    mostlyDaylight: dayCount >= Math.ceil(points.length / 2),
  };
}

function scorePlanWindow(params: {
  planType: PlanType;
  points: readonly HourlyForecastPoint[];
  thermalProfile: ThermalProfile;
}): number {
  const metrics = buildMetrics(params.points);
  const hasStorm = params.points.some((point) => isStormWeatherCode(point.weatherCode));
  const hasCurrentRain = params.points.some((point) => isRainWeatherCode(point.weatherCode) || point.precipitationMm > 0);
  const averageRainProbability = average(params.points.map((point) => point.precipitationProbability));
  const averageWind = average(params.points.map((point) => Math.max(point.windSpeedKmh, point.windGustKmh * 0.72)));
  const averageApparent = average(params.points.map((point) => point.apparentTemperatureC));
  const rainPenalty = averageRainProbability * 0.65 + metrics.rainPeakMm * 34;
  const windPenalty = Math.max(0, averageWind - 16) * 2.1 + Math.max(0, metrics.windPeakKmh - 28) * 1.45;
  const thermalPenalty = thermalPenaltyByPlan(averageApparent, params.thermalProfile, params.planType);
  const uv = metrics.uvAverage;
  let score = 100 - rainPenalty - windPenalty - thermalPenalty;

  if (hasStorm) {
    score = Math.min(score, 18);
  } else if (hasCurrentRain) {
    score = Math.min(score, params.planType === 'caminar' || params.planType === 'paseo_perro' ? 48 : 36);
  } else if (metrics.rainPeakProbability >= 60 || metrics.rainPeakMm >= 0.8) {
    score = Math.min(score, params.planType === 'trayecto' ? 56 : 48);
  }

  if (params.planType === 'caminar') {
    score -= Math.max(0, uv - 8) * 2.2;
  } else if (params.planType === 'correr_suave') {
    score -= Math.max(0, uv - 6.5) * 3.1;
  } else if (params.planType === 'terraza') {
    score -= Math.max(0, uv - 7.2) * 3;
    if (metrics.windPeakKmh >= 32) {
      score = Math.min(score, 48);
    }
  } else if (params.planType === 'tomar_sol') {
    if (!metrics.mostlyDaylight) {
      score -= 70;
    }
    score -= Math.abs(uv - 5.8) * 7.5;
    score -= Math.max(0, uv - 8.5) * 4.2;
  } else if (params.planType === 'piscina' || params.planType === 'playa') {
    if (!metrics.mostlyDaylight) {
      score -= 72;
    }
    score -= Math.max(0, 2.8 - uv) * 7.5;
    score -= Math.max(0, uv - 9.5) * 3.6;
    score -= Math.max(0, 24 - averageApparent) * 3.1;
  } else if (params.planType === 'paseo_perro') {
    score -= Math.max(0, uv - 7.5) * 2.8;
  } else if (params.planType === 'trayecto') {
    score -= rainPenalty * 0.28 + windPenalty * 0.35;
  }

  return clamp(Number(score.toFixed(1)), 0, 100);
}

function fallbackMetricsFromSnapshot(snapshot: WeatherSnapshot): PlanWindowMetrics {
  if (snapshot.hourly.length > 0) {
    return buildMetrics([snapshot.hourly[0]]);
  }
  return buildMetrics([]);
}

export function bestWindowFromHourly(params: {
  snapshot: WeatherSnapshot;
  thermalProfile: ThermalProfile;
  planType: PlanType;
}): PlanWindowResult {
  const horizon = params.snapshot.hourly.slice(0, 10);
  const fallbackStart = horizon[0]?.timeISO ?? params.snapshot.current.timeISO;
  const fallbackEnd = horizon[1]?.timeISO ?? fallbackStart;

  if (horizon.length < 2) {
    const fallbackMetrics = fallbackMetricsFromSnapshot(params.snapshot);
    const bestMoment = nowOrLaterLabel({
      score: 20,
      startISO: fallbackStart,
      endISO: fallbackEnd,
      snapshot: params.snapshot,
      planType: params.planType,
    });
    return {
      planType: params.planType,
      startISO: fallbackStart,
      endISO: fallbackEnd,
      label: formatWindowLabel(fallbackStart, fallbackEnd),
      reason: 'No hay suficiente detalle horario para una recomendación más fina.',
      score: 20,
      shouldDoNow: bestMoment.shouldDoNow,
      nowOrLaterLabel: bestMoment.label,
      metrics: fallbackMetrics,
    };
  }

  let bestIndex = 0;
  let bestScore = -1;
  let bestMetrics = buildMetrics([horizon[0], horizon[1]]);

  for (let index = 0; index < horizon.length - 1; index += 1) {
    const points = [horizon[index], horizon[index + 1]];
    const score = scorePlanWindow({
      planType: params.planType,
      points,
      thermalProfile: params.thermalProfile,
    });

    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
      bestMetrics = buildMetrics(points);
    }
  }

  const startISO = horizon[bestIndex].timeISO;
  const endISO = horizon[bestIndex + 1].timeISO;
  const bestMoment = nowOrLaterLabel({
    score: bestScore,
    startISO,
    endISO,
    snapshot: params.snapshot,
    planType: params.planType,
  });

  return {
    planType: params.planType,
    startISO,
    endISO,
    label: formatWindowLabel(startISO, endISO),
    reason: reasonForWindow({
      planType: params.planType,
      metrics: bestMetrics,
      nearSunset: isNearSunset(params.snapshot, startISO),
    }),
    score: bestScore,
    shouldDoNow: bestMoment.shouldDoNow,
    nowOrLaterLabel: bestMoment.label,
    metrics: bestMetrics,
  };
}
