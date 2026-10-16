import { resolveDepartureDate } from '@/src/domain/trayecto/trayectoDomain';
import {
  average,
  findClosestHourlyPoint,
  max,
  sliceHourlyWindow,
  toRiskTrend,
} from '@/src/features/trayecto/analysis/weatherTimeline';
import {
  capScoreForRisk,
  getSafeRecommendationLabel,
} from '@/src/features/recommendations/recommendationPolicy';
import { buildWeatherRiskProfileFromPoint } from '@/src/features/recommendations/weatherRisk';
import type { LocalTrayectoConfig, LocalTrayectoAnalysis, TrayectoActivityType } from '@/src/types/trayecto';
import type { ThermalProfile } from '@/src/types/recommendations';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

interface AnalyzeLocalOutingInput {
  snapshot: WeatherSnapshot;
  config: LocalTrayectoConfig;
  thermalProfile: ThermalProfile;
}

interface ActivitySensitivityProfile {
  rainWeight: number;
  windWeight: number;
  thermalWeight: number;
}

const activitySensitivity: Record<TrayectoActivityType, ActivitySensitivityProfile> = {
  paseo: {
    rainWeight: 0.9,
    windWeight: 0.65,
    thermalWeight: 0.58,
  },
  correr_suave: {
    rainWeight: 0.68,
    windWeight: 0.9,
    thermalWeight: 0.92,
  },
  paseo_perro: {
    rainWeight: 1.04,
    windWeight: 0.7,
    thermalWeight: 0.64,
  },
  terraza: {
    rainWeight: 1.18,
    windWeight: 0.92,
    thermalWeight: 0.52,
  },
};

function thermalPenalty(temperature: number): number {
  if (temperature < 5) {
    return (5 - temperature) * 7.6;
  }
  if (temperature < 11) {
    return (11 - temperature) * 5.1;
  }
  if (temperature <= 27) {
    return 0;
  }
  if (temperature <= 32) {
    return (temperature - 27) * 6.3;
  }
  return (temperature - 32) * 8.8 + 31.5;
}

function computeOutingScore(
  points: readonly HourlyForecastPoint[],
  activityType: TrayectoActivityType,
): number {
  if (points.length === 0) {
    return 0;
  }

  const profile = activitySensitivity[activityType];
  const rainValues = points.map((point) => point.precipitationProbability);
  const windValues = points.map((point) => Math.max(point.windSpeedKmh, point.windGustKmh * 0.72));
  const thermalValues = points.map((point) => thermalPenalty(point.apparentTemperatureC));

  const rainPenalty = average(rainValues) * profile.rainWeight + max(rainValues) * 0.16;
  const windPenalty = average(windValues) * profile.windWeight + max(windValues) * 0.22;
  const thermalValue = average(thermalValues) * profile.thermalWeight;

  return Math.max(0, Math.min(100, 100 - rainPenalty - windPenalty - thermalValue));
}

function buildRainSupport(peakProbability: number, trend: LocalTrayectoAnalysis['rainTrend']): string {
  if (peakProbability >= 70) {
    return 'Lluvia alta: paraguas sí o sí.';
  }
  if (peakProbability >= 45) {
    return trend === 'sube'
      ? 'La lluvia sube durante la salida.'
      : 'Lluvia posible: mejor no alargarlo.';
  }
  if (trend === 'sube') {
    return 'La lluvia sube al final.';
  }
  return 'Lluvia baja en esta franja.';
}

function buildWindSupport(peakWind: number, trend: LocalTrayectoAnalysis['windTrend']): string {
  if (peakWind >= 38) {
    return 'Rachas fuertes: mejor ir resguardado.';
  }
  if (peakWind >= 25) {
    return trend === 'sube'
      ? 'El viento sube: evita zonas abiertas.'
      : 'Viento moderado: capa ligera.';
  }
  return 'Viento suave y estable.';
}

function buildCoolingSupport(
  startApparent: number,
  endApparent: number,
  trend: LocalTrayectoAnalysis['coolingTrend'],
): string {
  const delta = endApparent - startApparent;
  if (trend === 'sube') {
    return `Refresca ${Math.round(Math.abs(delta))}°: añade capa.`;
  }
  if (trend === 'baja') {
    return `Sube ${Math.round(Math.abs(delta))}°: puedes aligerar.`;
  }
  return 'Sensación térmica estable.';
}

function scoreDepartureCandidate(params: {
  snapshot: WeatherSnapshot;
  startPoint: HourlyForecastPoint;
  durationMin: number;
  activityType: TrayectoActivityType;
}): number {
  const startTimeMs = new Date(params.startPoint.timeISO).getTime();
  const endTimeMs = startTimeMs + params.durationMin * 60_000;
  const windowPoints = sliceHourlyWindow(params.snapshot.hourly, startTimeMs, endTimeMs);
  return computeOutingScore(windowPoints, params.activityType);
}

function resolveBestDeparture(params: {
  snapshot: WeatherSnapshot;
  durationMin: number;
  activityType: TrayectoActivityType;
}): { point: HourlyForecastPoint; label: string } {
  const horizon = params.snapshot.hourly.slice(0, 8);
  const firstPoint = horizon[0] ?? params.snapshot.hourly[0];

  if (!firstPoint) {
    const fallbackPoint: HourlyForecastPoint = {
      timeISO: params.snapshot.current.timeISO,
      temperatureC: params.snapshot.current.temperatureC,
      apparentTemperatureC: params.snapshot.current.apparentTemperatureC,
      weatherCode: params.snapshot.current.weatherCode,
      isDay: params.snapshot.current.isDay,
      windSpeedKmh: params.snapshot.current.windSpeedKmh,
      windGustKmh: params.snapshot.current.windGustKmh,
      uvIndex: params.snapshot.current.uvIndex,
      precipitationProbability: params.snapshot.current.precipitationProbability,
      precipitationMm: params.snapshot.current.precipitationMm,
      cloudCoverPct: params.snapshot.current.cloudCoverPct,
      humidityPct: params.snapshot.current.humidityPct,
    };
    return { point: fallbackPoint, label: 'Sin alternativa horaria fiable' };
  }

  let bestPoint = firstPoint;
  const currentScore = scoreDepartureCandidate({
    snapshot: params.snapshot,
    startPoint: firstPoint,
    durationMin: params.durationMin,
    activityType: params.activityType,
  });
  let bestScore = currentScore;

  for (let index = 1; index < horizon.length; index += 1) {
    const candidate = horizon[index];
    const candidateScore = scoreDepartureCandidate({
      snapshot: params.snapshot,
      startPoint: candidate,
      durationMin: params.durationMin,
      activityType: params.activityType,
    });

    if (candidateScore > bestScore) {
      bestPoint = candidate;
      bestScore = candidateScore;
    }
  }

  const bestTime = new Date(bestPoint.timeISO).getTime();
  const nowTime = new Date(firstPoint.timeISO).getTime();
  if (bestScore < 46) {
    return { point: bestPoint, label: 'Mejor evitar por ahora' };
  }
  if (Math.abs(bestTime - nowTime) <= 20 * 60_000) {
    return { point: bestPoint, label: 'Ahora es viable' };
  }

  const scoreGain = bestScore - currentScore;
  if (scoreGain < 6) {
    return { point: bestPoint, label: 'No hace falta cambiar la salida' };
  }

  const rainImprovement = firstPoint.precipitationProbability - bestPoint.precipitationProbability;
  const windImprovement =
    Math.max(firstPoint.windSpeedKmh, firstPoint.windGustKmh) -
    Math.max(bestPoint.windSpeedKmh, bestPoint.windGustKmh);
  if (rainImprovement >= 12) {
    return { point: bestPoint, label: 'Más tarde baja la lluvia' };
  }
  if (windImprovement >= 6) {
    return { point: bestPoint, label: 'Más tarde mejora el viento' };
  }

  return {
    point: bestPoint,
    label: 'Más tarde mejora el confort',
  };
}

function resolveLatestReturnTime(params: {
  outingPoints: readonly HourlyForecastPoint[];
  departureTimeMs: number;
  plannedReturnTimeMs: number;
}): number {
  const firstRiskPoint = params.outingPoints.find((point) => {
    const rainRisk = point.precipitationProbability >= 55 || point.precipitationMm >= 0.5;
    const windRisk = point.windSpeedKmh >= 32 || point.windGustKmh >= 42;
    return rainRisk || windRisk;
  });

  if (!firstRiskPoint) {
    return params.plannedReturnTimeMs;
  }

  const firstRiskMs = new Date(firstRiskPoint.timeISO).getTime();
  const safetyBufferMs = 15 * 60_000;
  const returnAtMs = Math.max(params.departureTimeMs + 15 * 60_000, firstRiskMs - safetyBufferMs);
  return Math.min(returnAtMs, params.plannedReturnTimeMs);
}

export function analyzeLocalOuting(input: AnalyzeLocalOutingInput): LocalTrayectoAnalysis {
  const departureDate = resolveDepartureDate({
    departureMode: input.config.departureMode,
    customHour: input.config.departureCustomHour,
    customMinute: input.config.departureCustomMinute,
    referenceISO: input.snapshot.current.timeISO,
  });
  const departureTimeMs = departureDate.getTime();
  const returnTimeMs = departureTimeMs + input.config.durationMin * 60_000;

  const departurePoint =
    findClosestHourlyPoint(input.snapshot.hourly, departureTimeMs) ?? input.snapshot.hourly[0] ?? {
      timeISO: input.snapshot.current.timeISO,
      temperatureC: input.snapshot.current.temperatureC,
      apparentTemperatureC: input.snapshot.current.apparentTemperatureC,
      weatherCode: input.snapshot.current.weatherCode,
      isDay: input.snapshot.current.isDay,
      windSpeedKmh: input.snapshot.current.windSpeedKmh,
      windGustKmh: input.snapshot.current.windGustKmh,
      uvIndex: input.snapshot.current.uvIndex,
      precipitationProbability: input.snapshot.current.precipitationProbability,
      precipitationMm: input.snapshot.current.precipitationMm,
      cloudCoverPct: input.snapshot.current.cloudCoverPct,
      humidityPct: input.snapshot.current.humidityPct,
    };

  const outingPoints = sliceHourlyWindow(input.snapshot.hourly, departureTimeMs, returnTimeMs);
  const firstPoint = outingPoints[0] ?? departurePoint;
  const lastPoint = outingPoints[outingPoints.length - 1] ?? departurePoint;
  const riskProfile = buildWeatherRiskProfileFromPoint(firstPoint, outingPoints.slice(1, 4));
  const rainTrend = toRiskTrend(lastPoint.precipitationProbability - firstPoint.precipitationProbability, 9);
  const windTrend = toRiskTrend(lastPoint.windSpeedKmh - firstPoint.windSpeedKmh, 4);
  const coolingTrend = toRiskTrend(firstPoint.apparentTemperatureC - lastPoint.apparentTemperatureC, 1.2);

  const rainPeakProbability = max(outingPoints.map((point) => point.precipitationProbability));
  const rainPeakAmount = max(outingPoints.map((point) => point.precipitationMm));
  const windPeak = max(outingPoints.map((point) => Math.max(point.windSpeedKmh, point.windGustKmh)));
  const umbrellaRecommended = rainPeakProbability >= 45 || rainPeakAmount >= 0.4;
  const shorterOutingRecommended =
    rainPeakProbability >= 66 ||
    rainPeakAmount >= 0.9 ||
    windPeak >= 43 ||
    (coolingTrend === 'sube' && Math.abs(lastPoint.apparentTemperatureC - firstPoint.apparentTemperatureC) >= 4);

  const bestDeparture = resolveBestDeparture({
    snapshot: input.snapshot,
    durationMin: input.config.durationMin,
    activityType: input.config.activityType,
  });
  const latestReturnTimeMs = resolveLatestReturnTime({
    outingPoints,
    departureTimeMs,
    plannedReturnTimeMs: returnTimeMs,
  });

  const rawOutingScore = computeOutingScore(outingPoints, input.config.activityType);
  const outingScore = capScoreForRisk(input.config.activityType, rawOutingScore, riskProfile);
  const safeLabel = getSafeRecommendationLabel(input.config.activityType, riskProfile, outingScore);
  const summary =
    safeLabel === 'No recomendado' || safeLabel === 'Mejor esperar'
      ? 'Mejor esperar otra ventana.'
      : safeLabel === 'Solo cubierto'
        ? 'Mejor plan cubierto.'
        : safeLabel === 'Con paraguas'
          ? 'Salida corta con paraguas.'
          : safeLabel === 'Con capa'
            ? 'Salida viable con capa.'
            : safeLabel === 'Con ajustes' || safeLabel === 'Mejor corto'
              ? 'Salida viable con ajustes.'
          : outingScore >= 76
      ? 'Salida recomendada.'
      : outingScore >= 58
        ? 'Salida viable con ajustes.'
        : outingScore >= 42
          ? 'Condición variable: mejor recortar.'
          : 'Mejor esperar otra ventana.';

  const leaveDecision =
    safeLabel === 'No recomendado' || safeLabel === 'Mejor esperar'
      ? 'Mejor esperar o cambiar a plan cubierto.'
      : safeLabel === 'Solo cubierto'
        ? 'Terraza solo si es cubierta.'
        : safeLabel === 'Con paraguas'
          ? 'Si vas ahora, paraguas y vuelta corta.'
          : safeLabel === 'Con capa'
            ? 'Si vas ahora, añade una capa.'
            : safeLabel === 'Con ajustes' || safeLabel === 'Mejor corto'
              ? 'Ahora es viable si mantienes la salida corta.'
          : outingScore >= 76
      ? 'Ahora es viable.'
      : umbrellaRecommended && shorterOutingRecommended
        ? 'Si vas ahora, corto y con paraguas.'
        : umbrellaRecommended
          ? 'Si vas ahora, paraguas y vuelta atenta.'
          : shorterOutingRecommended
            ? 'Ahora mejor corto o volver antes.'
            : 'Ahora viable con ajustes ligeros.';

  return {
    departureLabel:
      input.config.departureMode === 'ahora'
        ? 'Ahora'
        : `Salida ${formatClock(departureDate.toISOString())}`,
    summary: summary,
    leaveDecision,
    bestDepartureLabel:
      safeLabel === 'Recomendado' || safeLabel === 'Viable'
        ? bestDeparture.label
        : safeLabel,
    latestReturnLabel: formatClock(new Date(latestReturnTimeMs).toISOString()),
    umbrellaRecommended,
    shorterOutingRecommended,
    rainTrend,
    windTrend,
    coolingTrend,
    rainSupport: buildRainSupport(rainPeakProbability, rainTrend),
    windSupport: buildWindSupport(windPeak, windTrend),
    coolingSupport: buildCoolingSupport(firstPoint.apparentTemperatureC, lastPoint.apparentTemperatureC, coolingTrend),
  };
}
