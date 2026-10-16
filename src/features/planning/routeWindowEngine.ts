import type { PlanWindowMetrics, PlanWindowResult } from '@/src/types/planning';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { buildMetrics } from '@/src/features/planning/hourlyWindowEngine';
import { capScoreForRisk } from '@/src/features/recommendations/recommendationPolicy';
import { buildWeatherRiskProfile } from '@/src/features/recommendations/weatherRisk';
import type { RouteWindowContext } from '@/src/features/planning/windowTypes';
import {
  average,
  clamp,
  formatWindowLabel,
  nowOrLaterLabel,
  reasonForWindow,
} from '@/src/features/planning/windowShared';

function findClosestPoint(points: readonly HourlyForecastPoint[], targetMs: number): HourlyForecastPoint | null {
  if (points.length === 0) {
    return null;
  }

  let best = points[0];
  let bestDiff = Math.abs(new Date(best.timeISO).getTime() - targetMs);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const diff = Math.abs(new Date(point.timeISO).getTime() - targetMs);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }

  return best;
}

function scoreRouteDeparture(params: {
  routeContext: RouteWindowContext;
  departureTimeMs: number;
}): { score: number; metrics: PlanWindowMetrics } {
  const rainRisks: number[] = [];
  const windRisks: number[] = [];
  const uvValues: number[] = [];
  const tempSamples: number[] = [];

  params.routeContext.routePlan.segments.forEach((segment) => {
    const snapshot = params.routeContext.segmentSnapshots[segment.id];
    if (!snapshot) {
      return;
    }

    const segmentTimeMs = params.departureTimeMs + segment.cumulativeMinutesAtEnd * 60_000;
    const point = findClosestPoint(snapshot.hourly, segmentTimeMs) ?? snapshot.hourly[0];
    if (!point) {
      return;
    }

    rainRisks.push(point.precipitationProbability * 0.72 + point.precipitationMm * 35);
    windRisks.push(Math.max(point.windSpeedKmh, point.windGustKmh * 0.72));
    uvValues.push(point.uvIndex);
    tempSamples.push(point.apparentTemperatureC);
  });

  const rainPeak = rainRisks.length > 0 ? Math.max(...rainRisks) : 0;
  const windPeak = windRisks.length > 0 ? Math.max(...windRisks) : 0;
  const rainAverage = average(rainRisks);
  const windAverage = average(windRisks);
  const score = clamp(
    100 - rainAverage * 0.8 - windAverage * 1.05 - rainPeak * 0.22 - Math.max(0, windPeak - 30) * 1.4,
    0,
    100,
  );
  const firstTemp = tempSamples[0] ?? 0;
  const lastTemp = tempSamples[tempSamples.length - 1] ?? firstTemp;

  return {
    score: Number(score.toFixed(1)),
    metrics: {
      rainPeakProbability: clamp(rainPeak, 0, 100),
      rainPeakMm: Number((rainPeak / 100).toFixed(2)),
      windPeakKmh: Number(windPeak.toFixed(1)),
      uvAverage: Number(average(uvValues).toFixed(1)),
      apparentDeltaC: Number((lastTemp - firstTemp).toFixed(1)),
      mostlyDaylight: true,
    },
  };
}

function emptyRouteMetrics(): PlanWindowMetrics {
  return {
    rainPeakProbability: 0,
    rainPeakMm: 0,
    windPeakKmh: 0,
    uvAverage: 0,
    apparentDeltaC: 0,
    mostlyDaylight: true,
  };
}

export function bestRouteWindow(params: {
  snapshot: WeatherSnapshot;
  routeContext: RouteWindowContext;
}): PlanWindowResult {
  const horizon = params.snapshot.hourly.slice(0, 6);
  const fallbackStart = horizon[0]?.timeISO ?? params.snapshot.current.timeISO;
  const fallbackEnd = new Date(
    new Date(fallbackStart).getTime() + params.routeContext.routePlan.totalDurationMin * 60_000,
  ).toISOString();

  if (horizon.length === 0) {
    return {
      planType: 'trayecto',
      startISO: fallbackStart,
      endISO: fallbackEnd,
      label: formatWindowLabel(fallbackStart, fallbackEnd),
      reason: 'Sin horizonte horario suficiente para calcular la salida óptima.',
      score: 40,
      shouldDoNow: true,
      nowOrLaterLabel: 'Con ajustes',
      metrics: emptyRouteMetrics(),
    };
  }

  let bestStart = horizon[0].timeISO;
  let bestScore = -1;
  let bestMetrics: PlanWindowMetrics = emptyRouteMetrics();

  horizon.forEach((point) => {
    const startMs = new Date(point.timeISO).getTime();
    const scored = scoreRouteDeparture({
      routeContext: params.routeContext,
      departureTimeMs: startMs,
    });
    if (scored.score > bestScore) {
      bestScore = scored.score;
      bestStart = point.timeISO;
      bestMetrics = scored.metrics;
    }
  });

  const endISO = new Date(
    new Date(bestStart).getTime() + params.routeContext.routePlan.totalDurationMin * 60_000,
  ).toISOString();
  const bestMoment = nowOrLaterLabel({
    score: capScoreForRisk('trayecto', bestScore, buildWeatherRiskProfile(params.snapshot)),
    startISO: bestStart,
    endISO,
    snapshot: params.snapshot,
    planType: 'trayecto',
  });

  return {
    planType: 'trayecto',
    startISO: bestStart,
    endISO,
    label: formatWindowLabel(bestStart, endISO),
    reason: reasonForWindow({
      planType: 'trayecto',
      metrics: bestMetrics,
      nearSunset: false,
    }),
    score: capScoreForRisk('trayecto', bestScore, buildWeatherRiskProfile(params.snapshot)),
    shouldDoNow: bestMoment.shouldDoNow,
    nowOrLaterLabel: bestMoment.label,
    metrics: bestMetrics,
  };
}
