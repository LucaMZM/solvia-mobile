import { findClosestHourlyPoint } from '@/src/features/trayecto/analysis/weatherTimeline';
import { buildRecommendations } from '@/src/features/recommendations/engine';
import {
  getSafeRecommendationLabel,
  safeCopy,
  type SafeRecommendationLabel,
} from '@/src/features/recommendations/recommendationPolicy';
import { getWeatherStateLabel } from '@/src/features/recommendations/recommendationCatalog';
import {
  buildWeatherRiskProfileFromPoint,
  mergeWeatherRiskProfiles,
  type WeatherRiskProfile,
} from '@/src/features/recommendations/weatherRisk';
import type { ThermalProfile, WeatherState } from '@/src/types/recommendations';
import type {
  CarTrayectoAnalysis,
  CarRouteSegmentAnalysis,
  RoutePlanResult,
  TrayectoDepartureMode,
} from '@/src/types/trayecto';
import type { WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

interface AnalyzeCarRouteInput {
  routePlan: RoutePlanResult;
  segmentSnapshots: Record<string, WeatherSnapshot>;
  departureDate: Date;
  departureMode: TrayectoDepartureMode;
  thermalProfile: ThermalProfile;
}

interface SegmentRiskReading {
  segment: CarRouteSegmentAnalysis;
  rainScore: number;
  windScore: number;
  compositeScore: number;
  riskProfile: WeatherRiskProfile | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rainRiskScore(probability: number, amountMm: number): number {
  return clamp(probability * 0.78 + amountMm * 42, 0, 100);
}

function windRiskScore(speedKmh: number, gustKmh: number): number {
  return clamp(speedKmh * 1.34 + gustKmh * 0.72, 0, 100);
}

function riskLabel(score: number): string {
  if (score >= 70) {
    return 'Alto';
  }
  if (score >= 45) {
    return 'Moderado';
  }
  return 'Bajo';
}

function segmentSupportFromRisk(rainScore: number, windScore: number): string {
  if (rainScore >= 70 && windScore >= 65) {
    return 'Tramo sensible por lluvia y rachas.';
  }
  if (rainScore >= 70) {
    return 'Lluvia alta en este tramo.';
  }
  if (windScore >= 70) {
    return 'Rachas marcadas en este tramo.';
  }
  if (rainScore >= 45 || windScore >= 45) {
    return 'Condiciones variables: deja margen.';
  }
  return 'Tramo estable.';
}

function evaluateOffsetScore(
  input: AnalyzeCarRouteInput,
  departureOffsetMin: number,
): number {
  const offsetDepartureMs = input.departureDate.getTime() + departureOffsetMin * 60_000;
  const segmentScores = input.routePlan.segments.map((segment) => {
    const snapshot = input.segmentSnapshots[segment.id];
    if (!snapshot) {
      return 45;
    }
    const segmentTime = offsetDepartureMs + segment.cumulativeMinutesAtEnd * 60_000;
    const point = findClosestHourlyPoint(snapshot.hourly, segmentTime) ?? snapshot.hourly[0];
    if (!point) {
      return 45;
    }

    const rain = rainRiskScore(point.precipitationProbability, point.precipitationMm);
    const wind = windRiskScore(point.windSpeedKmh, point.windGustKmh);
    return rain * 0.55 + wind * 0.45;
  });

  if (segmentScores.length === 0) {
    return 100;
  }
  return segmentScores.reduce((acc, value) => acc + value, 0) / segmentScores.length;
}

function recommendationFromOffset(params: {
  input: AnalyzeCarRouteInput;
  baselineScore: number;
}): string {
  const offsets = [-60, -30, 0, 30, 60];
  const scored = offsets.map((offset) => ({
    offset,
    score: evaluateOffsetScore(params.input, offset),
  }));

  const best = scored.reduce((currentBest, candidate) =>
    candidate.score < currentBest.score ? candidate : currentBest,
  );
  const gain = params.baselineScore - best.score;
  const alternativeDate = new Date(
    params.input.departureDate.getTime() + best.offset * 60_000,
  );
  const alternativeHour = alternativeDate.getHours();

  if (best.offset === 0 || gain < 10 || alternativeHour < 6 || alternativeHour >= 23) {
    return 'No hace falta cambiar la salida.';
  }

  if (best.offset < 0) {
    return gain >= 16
      ? 'Si puedes elegir, algo antes reduce el riesgo.'
      : 'Si vas ahora, sal con ajustes.';
  }

  return gain >= 16
    ? 'Si puedes elegir, algo más tarde reduce el riesgo.'
    : 'Si vas ahora, no cambia mucho.';
}

function summaryByRisk(rainPeak: number, windPeak: number): string {
  if (rainPeak >= 70 && windPeak >= 70) {
    return 'Ruta delicada por lluvia y viento.';
  }
  if (rainPeak >= 70) {
    return 'La lluvia domina la ruta.';
  }
  if (windPeak >= 70) {
    return 'El viento condiciona la ruta.';
  }
  if (rainPeak >= 45 || windPeak >= 45) {
    return 'Ruta viable con variaciones.';
  }
  return 'Ruta estable para salir.';
}

function summaryFromPolicy(
  label: SafeRecommendationLabel,
  risk: WeatherRiskProfile,
  rainPeak: number,
  windPeak: number,
): string {
  if (risk.flags.stormNow || risk.severity === 'severe') {
    return 'Ruta delicada: hay tormenta o lluvia intensa.';
  }
  if (risk.flags.stormSoon) {
    return 'La tormenta puede afectar algún tramo.';
  }
  if (risk.flags.rainNow || risk.flags.rainSoon) {
    return label === 'No recomendado'
      ? 'La lluvia desaconseja esta ruta ahora.'
      : 'Ruta viable con lluvia: deja margen.';
  }
  if (risk.flags.strongWind || risk.flags.strongGusts) {
    return 'El viento condiciona algunos tramos.';
  }
  if (risk.flags.dataUncertain) {
    return 'Ruta estimada: conviene revisar antes de salir.';
  }
  return summaryByRisk(rainPeak, windPeak);
}

function leaveDecisionFromPolicy(
  label: SafeRecommendationLabel,
  risk: WeatherRiskProfile,
  offsetSuggestion: string,
): string {
  if (label === 'No recomendado') {
    return 'Si puedes, aplaza la salida; si no, extrema la precaución.';
  }
  if (risk.flags.stormSoon) {
    return 'Si mantienes la hora, deja margen y revisa la evolución.';
  }
  if (risk.flags.rainNow || risk.flags.rainSoon) {
    return offsetSuggestion === 'No hace falta cambiar la salida.'
      ? 'No hace falta cambiar la hora; conduce con margen.'
      : offsetSuggestion;
  }
  if (risk.flags.dataUncertain) {
    return 'No hace falta cambiar la hora; revisa antes de salir.';
  }
  return offsetSuggestion;
}

function providerLabels(routePlan: RoutePlanResult): { label: string; support: string } {
  if (routePlan.confidence === 'provider') {
    return {
      label: 'Ruta verificada',
      support: 'Segmentación calculada por proveedor de rutas.',
    };
  }
  return {
    label: 'Ruta estimada',
    support: routePlan.notes[0] ?? 'Estimación básica de ruta.',
  };
}

function resolveArrivalNarrative(params: {
  routePlan: RoutePlanResult;
  segmentSnapshots: Record<string, WeatherSnapshot>;
  departureDate: Date;
  thermalProfile: ThermalProfile;
}): { label: string; state: WeatherState | null } {
  const lastSegment = params.routePlan.segments[params.routePlan.segments.length - 1];
  if (!lastSegment) {
    return { label: 'Sin lectura de llegada por ahora.', state: null };
  }

  const snapshot = params.segmentSnapshots[lastSegment.id];
  if (!snapshot) {
    return { label: 'Sin lectura de llegada por ahora.', state: null };
  }

  const arrivalTimeMs = params.departureDate.getTime() + lastSegment.cumulativeMinutesAtEnd * 60_000;
  const point = findClosestHourlyPoint(snapshot.hourly, arrivalTimeMs) ?? snapshot.hourly[0];

  if (!point) {
    return { label: 'Sin lectura de llegada por ahora.', state: null };
  }

  const shiftedIndex = snapshot.hourly.findIndex((hourlyPoint) => hourlyPoint.timeISO === point.timeISO);
  const uvStatus: 'available' | 'unavailable' =
    point.isDay && Number.isFinite(point.uvIndex) ? 'available' : 'unavailable';
  const shifted =
    shiftedIndex >= 0
      ? {
          ...snapshot,
          current: {
            timeISO: point.timeISO,
            temperatureC: point.temperatureC,
            apparentTemperatureC: point.apparentTemperatureC,
            isDay: point.isDay,
            weatherCode: point.weatherCode,
            precipitationMm: point.precipitationMm,
            precipitationProbability: point.precipitationProbability,
            windSpeedKmh: point.windSpeedKmh,
            windGustKmh: point.windGustKmh,
            uvIndex: point.uvIndex,
            uvStatus,
            cloudCoverPct: point.cloudCoverPct,
            humidityPct: point.humidityPct,
          },
          hourly: snapshot.hourly.slice(shiftedIndex),
        }
      : snapshot;
  const recommendations = buildRecommendations(shifted, {
    thermalProfile: params.thermalProfile,
  });

  return {
    label: `${Math.round(point.temperatureC)}° al llegar · ${getWeatherStateLabel(recommendations.state)}`,
    state: recommendations.state,
  };
}

export function analyzeCarRoute(input: AnalyzeCarRouteInput): CarTrayectoAnalysis {
  const segmentRiskReadings: SegmentRiskReading[] = input.routePlan.segments.map((segment) => {
    const snapshot = input.segmentSnapshots[segment.id];
    const etaMs = input.departureDate.getTime() + segment.cumulativeMinutesAtEnd * 60_000;
    const point = snapshot ? findClosestHourlyPoint(snapshot.hourly, etaMs) ?? snapshot.hourly[0] : null;

    const rainScore = point ? rainRiskScore(point.precipitationProbability, point.precipitationMm) : 42;
    const windScore = point ? windRiskScore(point.windSpeedKmh, point.windGustKmh) : 42;
    const compositeScore = rainScore * 0.55 + windScore * 0.45;
    const riskProfile = point ? buildWeatherRiskProfileFromPoint(point) : null;

    return {
      rainScore,
      windScore,
      compositeScore,
      riskProfile,
      segment: {
        id: segment.id,
        label: segment.label,
        etaLabel: `+${segment.cumulativeMinutesAtEnd} min · ${formatClock(new Date(etaMs).toISOString())}`,
        rainRiskLabel: riskLabel(rainScore),
        windRiskLabel: riskLabel(windScore),
        support: segmentSupportFromRisk(rainScore, windScore),
      },
    };
  });

  const rainPeak = segmentRiskReadings.reduce((peak, reading) => Math.max(peak, reading.rainScore), 0);
  const windPeak = segmentRiskReadings.reduce((peak, reading) => Math.max(peak, reading.windScore), 0);
  const baselineScore =
    segmentRiskReadings.length > 0
      ? segmentRiskReadings.reduce((acc, reading) => acc + reading.compositeScore, 0) / segmentRiskReadings.length
      : 45;
  const routeRisk = mergeWeatherRiskProfiles(
    segmentRiskReadings.flatMap((reading) => (reading.riskProfile ? [reading.riskProfile] : [])),
    input.routePlan.confidence === 'fallback' || segmentRiskReadings.some((reading) => !reading.riskProfile),
  );
  const routeSafetyScore = clamp(100 - baselineScore, 0, 100);
  const safeLabel = getSafeRecommendationLabel('ruta', routeRisk, routeSafetyScore);

  const arrival = resolveArrivalNarrative({
    routePlan: input.routePlan,
    segmentSnapshots: input.segmentSnapshots,
    departureDate: input.departureDate,
    thermalProfile: input.thermalProfile,
  });
  const provider = providerLabels(input.routePlan);
  const departurePrefix = input.departureMode === 'ahora' ? 'Salida ahora' : `Salida ${formatClock(input.departureDate.toISOString())}`;
  const leaveDecisionBase = recommendationFromOffset({ input, baselineScore });
  const leaveDecision = safeCopy(leaveDecisionFromPolicy(safeLabel, routeRisk, leaveDecisionBase), routeRisk);
  const umbrellaRecommended = routeRisk.flags.rainNow || routeRisk.flags.rainSoon || rainPeak >= 45;
  const shortenSuggestion =
    routeRisk.flags.stormNow || routeRisk.flags.stormSoon || rainPeak >= 72 || windPeak >= 72
      ? 'Sí: mejor ruta directa y paradas cortas.'
      : rainPeak >= 48 || windPeak >= 52
        ? 'Ahora mejor paradas breves y margen.'
        : 'No hace falta acortar.';

  return {
    departureLabel: departurePrefix,
    summary: `${summaryFromPolicy(safeLabel, routeRisk, rainPeak, windPeak)} ${leaveDecision}`,
    leaveDecision,
    routeSummary: `${Math.round(input.routePlan.totalDistanceKm)} km · ${input.routePlan.totalDurationMin} min`,
    rainRiskLabel: riskLabel(rainPeak),
    windRiskLabel: riskLabel(windPeak),
    umbrellaRecommended,
    shortenSuggestion,
    arrivalWeather: arrival.label,
    providerLabel: provider.label,
    providerSupport: provider.support,
    segments: segmentRiskReadings.map((reading) => reading.segment),
  };
}
