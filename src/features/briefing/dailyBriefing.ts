import { snapshotFromHourlyPoint } from '@/src/domain/forecast/forecastTimeframes';
import { buildRecommendations } from '@/src/features/recommendations/engine';
import { buildDailyBriefLines } from '@/src/features/briefing/briefingText';
import { getLocalHour } from '@/src/services/weather/localTime';
import type { DailyBrief, DailyBriefBundle, DailyBriefConfidence, DailyBriefMoment } from '@/src/types/briefing';
import type { SelectedLocationRef } from '@/src/types/location';
import type { PlanType } from '@/src/types/planning';
import type { RecommendationBundle, ThermalProfile } from '@/src/types/recommendations';
import type { UserRoutine } from '@/src/types/routines';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

interface BuildDailyBriefBundleParams {
  snapshot: WeatherSnapshot;
  recommendations: RecommendationBundle;
  thermalProfile: ThermalProfile;
  selectedPlanType: PlanType;
  selectedLocation: SelectedLocationRef;
  routines: UserRoutine[];
}

interface BriefMomentContext {
  moment: DailyBriefMoment;
  point: HourlyForecastPoint;
  recommendations: RecommendationBundle;
}

function findMomentHourlyIndex(snapshot: WeatherSnapshot, moment: DailyBriefMoment): number {
  if (snapshot.hourly.length === 0) {
    return 0;
  }

  const firstMatchIndex = snapshot.hourly.findIndex((point) => {
    const hour = getLocalHour(point.timeISO);

    if (moment === 'manana') {
      return point.isDay && hour >= 7 && hour <= 11;
    }
    if (moment === 'tarde') {
      return point.isDay && hour >= 16 && hour <= 19;
    }
    return !point.isDay && hour >= 20;
  });

  if (firstMatchIndex >= 0) {
    return firstMatchIndex;
  }

  if (moment === 'noche_siguiente') {
    const anyNightIndex = snapshot.hourly.findIndex((point) => !point.isDay);
    if (anyNightIndex >= 0) {
      return anyNightIndex;
    }
    return snapshot.hourly.length - 1;
  }

  if (moment === 'tarde') {
    const fallbackDayIndex = snapshot.hourly.findIndex((point) => point.isDay);
    return fallbackDayIndex >= 0 ? fallbackDayIndex : 0;
  }

  return 0;
}

function resolveDefaultMoment(nowISO: string): DailyBriefMoment {
  const hour = getLocalHour(nowISO);
  if (hour < 13) {
    return 'manana';
  }
  if (hour < 20) {
    return 'tarde';
  }
  return 'noche_siguiente';
}

function buildMomentContext(
  params: BuildDailyBriefBundleParams,
  moment: DailyBriefMoment,
): BriefMomentContext {
  const hourlyIndex = findMomentHourlyIndex(params.snapshot, moment);
  const point = params.snapshot.hourly[hourlyIndex] ?? {
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

  if (hourlyIndex === 0) {
    return {
      moment,
      point,
      recommendations: params.recommendations,
    };
  }

  const shiftedSnapshot = snapshotFromHourlyPoint(params.snapshot, hourlyIndex);
  const shiftedRecommendations = buildRecommendations(shiftedSnapshot, {
    thermalProfile: params.thermalProfile,
  });

  return {
    moment,
    point,
    recommendations: shiftedRecommendations,
  };
}

function buildDailyBriefForMoment(
  params: BuildDailyBriefBundleParams,
  moment: DailyBriefMoment,
): DailyBrief {
  const context = buildMomentContext(params, moment);
  const lines = buildDailyBriefLines({
    moment,
    recommendations: context.recommendations,
    selectedPlanType: params.selectedPlanType,
    selectedLocation: params.selectedLocation,
    routines: params.routines,
  });

  const confidenceByForecast: Record<RecommendationBundle['forecastConfidence']['tone'], DailyBriefConfidence> = {
    alta_confianza: 'alta',
    confianza_media: 'media',
    puede_cambiar: 'baja',
  };
  const confidence = confidenceByForecast[context.recommendations.forecastConfidence.tone];

  return {
    id: `${params.snapshot.cityName}-${moment}-${context.point.timeISO}`,
    cityName: params.snapshot.cityName,
    moment,
    targetTimeLabel: formatClock(context.point.timeISO),
    weatherState: context.recommendations.state,
    shortLine: lines.shortLine,
    supportLine: lines.supportLine,
    confidence,
    confidenceLabel: context.recommendations.forecastConfidence.label,
    routineHint: lines.routineHint,
    generatedAtISO: new Date().toISOString(),
  };
}

export function buildDailyBriefBundle(params: BuildDailyBriefBundleParams): DailyBriefBundle {
  const byMoment: Record<DailyBriefMoment, DailyBrief> = {
    manana: buildDailyBriefForMoment(params, 'manana'),
    tarde: buildDailyBriefForMoment(params, 'tarde'),
    noche_siguiente: buildDailyBriefForMoment(params, 'noche_siguiente'),
  };

  const defaultMoment = resolveDefaultMoment(params.snapshot.current.timeISO);

  return {
    current: byMoment[defaultMoment],
    byMoment,
  };
}
