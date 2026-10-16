import { activityOrder } from '@/src/features/recommendations/recommendationCatalog';
import {
  deriveRecommendationSignals,
  resolveWeatherStateWithScores,
  type RecommendationSignals,
} from '@/src/features/recommendations/stateResolver';
import { capScoreForRisk } from '@/src/features/recommendations/recommendationPolicy';
import {
  buildWeatherRiskProfile,
  type WeatherRiskProfile,
} from '@/src/features/recommendations/weatherRisk';
import { isCloudyWeatherCode } from '@/src/services/weather/weatherCode';
import { minutesBetweenLocalIso } from '@/src/services/weather/localTime';
import type {
  ActivityId,
  HighlightedModule,
  ThermalProfile,
  WeatherState,
} from '@/src/types/recommendations';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';

interface ActivityAssessment {
  id: ActivityId;
  score: number;
  reasonCodes: ActivityReasonCode[];
}

interface OutfitNeedProfile {
  warmthLevel: 0 | 1 | 2 | 3;
  sunProtectionLevel: 0 | 1 | 2 | 3;
  breathableLevel: 0 | 1 | 2;
  rainProtection: boolean;
  windProtection: boolean;
  waterproofFootwear: boolean;
  addEveningLayer: boolean;
}

type WindowReasonCode =
  | 'luz_dorada'
  | 'lluvia_baja'
  | 'viento_estable'
  | 'temperatura_suave'
  | 'noche_serena'
  | 'equilibrado';

export type ActivityReasonCode =
  | 'current_rain'
  | 'upcoming_rain'
  | 'storm'
  | 'strong_wind'
  | 'cold_drop'
  | 'high_uv'
  | 'cloudy_but_dry'
  | 'good_window'
  | 'night';

interface BestWindowAssessment {
  startISO: string;
  endISO: string;
  score: number;
  reasonCode: WindowReasonCode;
}

export interface RecommendationDerivation {
  state: WeatherState;
  signals: RecommendationSignals;
  riskProfile: WeatherRiskProfile;
  stateScores: Record<WeatherState, number>;
  activities: ActivityAssessment[];
  outfitNeeds: OutfitNeedProfile;
  bestWindow: BestWindowAssessment;
  highlightedModule: HighlightedModule;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function thermalOffset(profile: ThermalProfile): number {
  if (profile === 'friolero') {
    return -2.5;
  }
  if (profile === 'caluroso') {
    return 2;
  }
  return 0;
}

function outdoorTemperaturePenalty(apparentTemperature: number, profile: ThermalProfile): number {
  const adjusted = apparentTemperature + thermalOffset(profile);
  const coldPenalty = adjusted < 10 ? (10 - adjusted) * 3.2 : 0;
  const heatPenalty = adjusted > 29 ? (adjusted - 29) * 4.4 : 0;
  return coldPenalty + heatPenalty;
}

function scoreTomarSol(signals: RecommendationSignals, state: WeatherState): number {
  if (signals.stormNow) {
    return 0;
  }
  if (!signals.snapshot.current.isDay) {
    return 4;
  }
  if (signals.rainNow || signals.rainRisk >= 55 || signals.upcomingRainRisk) {
    return 6;
  }

  const sunPenalty = Math.max(0, signals.sunExposure - 70) * 0.78;
  const rainPenalty = signals.rainRisk * 0.82;
  const windPenalty = signals.windImpact * 0.26;
  const bonuses = (state === 'golden_hour' ? 20 : 0) + (signals.cloudCover > 20 && signals.cloudCover < 60 ? 6 : 0);

  return clamp(82 + bonuses - sunPenalty - rainPenalty - windPenalty, 0, 100);
}

function scoreCaminar(signals: RecommendationSignals, state: WeatherState): number {
  if (signals.stormNow) {
    return 8;
  }
  const rainPenalty = signals.rainRisk * 0.68;
  const windPenalty = signals.windImpact * 0.44;
  const thermalPenalty = outdoorTemperaturePenalty(signals.apparentTemperature, signals.thermalProfile) * 1.12;
  const goldenBonus = state === 'golden_hour' ? 10 : 0;
  const nightBonus = state === 'night_clear' ? 8 : 0;

  const rawScore = 86 + goldenBonus + nightBonus - rainPenalty - windPenalty - thermalPenalty;
  const cap =
    signals.rainNow
      ? 54
      : signals.upcomingRainRisk
        ? 58
        : signals.windImpact >= 72
          ? 60
          : 100;

  return clamp(Math.min(rawScore, cap), 0, 100);
}

function scoreTerraza(signals: RecommendationSignals, state: WeatherState): number {
  if (signals.stormNow) {
    return 4;
  }
  const rainPenalty = signals.rainRisk * 0.92;
  const windPenalty = signals.windImpact * 0.62;
  const uvPenalty =
    signals.snapshot.current.isDay && signals.nowHour >= 12 && signals.nowHour <= 17
      ? Math.max(0, signals.snapshot.current.uvIndex - 6) * 6
      : 0;
  const thermalPenalty = outdoorTemperaturePenalty(signals.apparentTemperature, signals.thermalProfile) * 0.85;
  const goldenBonus = state === 'golden_hour' ? 16 : 0;

  const rawScore = 80 + goldenBonus - rainPenalty - windPenalty - uvPenalty - thermalPenalty;
  const cap =
    signals.rainNow
      ? 34
      : signals.upcomingRainRisk
        ? 46
        : signals.windImpact >= 68
          ? 48
          : 100;

  return clamp(Math.min(rawScore, cap), 0, 100);
}

function scoreRunningSuave(signals: RecommendationSignals): number {
  if (signals.stormNow) {
    return 4;
  }
  const rainPenalty = signals.rainRisk * 0.78;
  const windPenalty = signals.windImpact * 0.54;
  const heatPenalty = Math.max(0, signals.thermalAdjustedApparent - 27) * 5.8;
  const coldPenalty = Math.max(0, 8 - signals.thermalAdjustedApparent) * 4.2;

  const rawScore = 74 - rainPenalty - windPenalty - heatPenalty - coldPenalty;
  const cap =
    signals.rainNow
      ? signals.snapshot.current.precipitationMm <= 0.2
        ? 44
        : 28
      : signals.upcomingRainRisk
        ? 48
        : signals.windImpact >= 72
          ? 50
          : 100;

  return clamp(Math.min(rawScore, cap), 0, 100);
}

function deriveActivityReasonCodes(
  activityId: ActivityId,
  signals: RecommendationSignals,
  score: number,
): ActivityReasonCode[] {
  const codes: ActivityReasonCode[] = [];
  const isSunActivity = activityId === 'tomar_sol';
  const isTerrace = activityId === 'terraza';

  if (signals.stormNow) {
    codes.push('storm');
  }
  if (signals.rainNow) {
    codes.push('current_rain');
  } else if (signals.upcomingRainRisk || signals.rainRisk >= 55) {
    codes.push('upcoming_rain');
  }
  if (signals.windImpact >= 62) {
    codes.push('strong_wind');
  }
  if (signals.thermalAdjustedApparent <= 11 || signals.temperatureTrend3h >= 3.5) {
    codes.push('cold_drop');
  }
  if (signals.snapshot.current.isDay && signals.snapshot.current.uvIndex >= 7 && (isSunActivity || score >= 42)) {
    codes.push('high_uv');
  }
  if (
    signals.snapshot.current.isDay &&
    isCloudyWeatherCode(signals.snapshot.current.weatherCode) &&
    !signals.rainNow &&
    signals.rainRisk < 45 &&
    (activityId === 'caminar' || isTerrace)
  ) {
    codes.push('cloudy_but_dry');
  }
  if (!signals.snapshot.current.isDay && isSunActivity) {
    codes.push('night');
  }
  if (codes.length === 0 && score >= 62) {
    codes.push('good_window');
  }

  return codes;
}

function deriveActivityAssessments(
  signals: RecommendationSignals,
  state: WeatherState,
  risk: WeatherRiskProfile,
): ActivityAssessment[] {
  const scoresByActivity: Record<ActivityId, number> = {
    tomar_sol: scoreTomarSol(signals, state),
    caminar: scoreCaminar(signals, state),
    terraza: scoreTerraza(signals, state),
    running_suave: scoreRunningSuave(signals),
  };
  return activityOrder.map((id) => {
    const score = capScoreForRisk(id, scoresByActivity[id], risk);
    return {
      id,
      score,
      reasonCodes: deriveActivityReasonCodes(id, signals, score),
    };
  });
}

function deriveOutfitNeeds(signals: RecommendationSignals, state: WeatherState): OutfitNeedProfile {
  const adjusted = signals.thermalAdjustedApparent;
  const warmthBase = adjusted <= 6 ? 3 : adjusted <= 13 ? 2 : adjusted <= 19 ? 1 : 0;
  const warmthLevel = clamp(
    warmthBase + (signals.thermalProfile === 'friolero' ? 1 : 0) - (signals.thermalProfile === 'caluroso' ? 1 : 0),
    0,
    3,
  ) as OutfitNeedProfile['warmthLevel'];

  const sunProtectionLevel = !signals.snapshot.current.isDay
    ? 0
    : signals.snapshot.current.uvIndex >= 9
      ? 3
      : signals.snapshot.current.uvIndex >= 7
        ? 2
        : signals.snapshot.current.uvIndex >= 4
          ? 1
          : 0;

  const breathableLevel = adjusted >= 26 ? 2 : adjusted >= 20 ? 1 : 0;
  const rainProtection = signals.rainNow || signals.rainRisk >= 45;
  const windProtection = signals.windImpact >= 55 || state === 'windy';
  const waterproofFootwear = rainProtection && (signals.snapshot.current.precipitationMm >= 0.3 || signals.rainRisk >= 65);
  const addEveningLayer =
    state === 'cool_evening' ||
    (signals.snapshot.current.isDay && signals.minutesToSunset <= 120 && adjusted <= 22);

  return {
    warmthLevel,
    sunProtectionLevel,
    breathableLevel: breathableLevel as OutfitNeedProfile['breathableLevel'],
    rainProtection,
    windProtection,
    waterproofFootwear,
    addEveningLayer,
  };
}

function evaluateWindowPoint(
  point: HourlyForecastPoint,
  signals: RecommendationSignals,
  state: WeatherState,
): number {
  const rainPenalty = point.precipitationProbability * 0.72 + point.precipitationMm * 28;
  const windPenalty = Math.max(0, point.windSpeedKmh - 17) * 2.2 + Math.max(0, point.windGustKmh - 30) * 1.6;
  const uvPenalty = point.isDay ? Math.max(0, point.uvIndex - 7) * 5.5 : 0;
  const thermalPenalty = outdoorTemperaturePenalty(point.apparentTemperatureC, signals.thermalProfile);
  const humidityPenalty = point.humidityPct >= 84 && point.apparentTemperatureC >= 26 ? 8 : 0;

  const minutesToSunset = minutesBetweenLocalIso(point.timeISO, signals.snapshot.daily.sunsetISO);
  const goldenBonus = point.isDay && minutesToSunset >= 20 && minutesToSunset <= 95 ? 12 : 0;
  const nightBonus = !point.isDay && state === 'night_clear' ? 7 : 0;

  return clamp(100 + goldenBonus + nightBonus - rainPenalty - windPenalty - uvPenalty - thermalPenalty - humidityPenalty, 0, 100);
}

function reasonCodeFromWindowPoint(point: HourlyForecastPoint, state: WeatherState): WindowReasonCode {
  if (state === 'golden_hour') {
    return 'luz_dorada';
  }
  if (!point.isDay && state === 'night_clear') {
    return 'noche_serena';
  }
  if (point.precipitationProbability <= 20 && point.precipitationMm <= 0.1) {
    return 'lluvia_baja';
  }
  if (point.windSpeedKmh <= 18 && point.windGustKmh <= 28) {
    return 'viento_estable';
  }
  if (point.apparentTemperatureC >= 14 && point.apparentTemperatureC <= 24) {
    return 'temperatura_suave';
  }
  return 'equilibrado';
}

function deriveBestWindow(signals: RecommendationSignals, state: WeatherState): BestWindowAssessment {
  const horizon = signals.snapshot.hourly.slice(0, 8);
  const fallbackStart = horizon[0]?.timeISO ?? signals.snapshot.current.timeISO;
  const fallbackEnd = horizon[1]?.timeISO ?? fallbackStart;

  if (horizon.length < 2) {
    return {
      startISO: fallbackStart,
      endISO: fallbackEnd,
      score: 0,
      reasonCode: 'equilibrado',
    };
  }

  let best = {
    startISO: fallbackStart,
    endISO: fallbackEnd,
    score: -1,
    reasonCode: 'equilibrado' as WindowReasonCode,
  };

  for (let index = 0; index < horizon.length - 1; index += 1) {
    const first = horizon[index];
    const second = horizon[index + 1];
    const firstScore = evaluateWindowPoint(first, signals, state);
    const secondScore = evaluateWindowPoint(second, signals, state);
    const average = Number(((firstScore + secondScore) / 2).toFixed(1));

    if (average > best.score) {
      best = {
        startISO: first.timeISO,
        endISO: second.timeISO,
        score: average,
        reasonCode: reasonCodeFromWindowPoint(first, state),
      };
    }
  }

  return best;
}

function deriveHighlightedModule(state: WeatherState): HighlightedModule {
  const moduleByState: Record<WeatherState, HighlightedModule> = {
    pleasant_sunny: 'actividades',
    strong_sun: 'sol_uv',
    soft_cloudy: 'actividades',
    rainy: 'proximas_horas',
    windy: 'viento',
    cool_evening: 'ropa',
    golden_hour: 'actividades',
    night_clear: 'actividades',
  };

  return moduleByState[state];
}

export function deriveRecommendationModel(
  snapshot: WeatherSnapshot,
  thermalProfile: ThermalProfile,
): RecommendationDerivation {
  const signals = deriveRecommendationSignals(snapshot, thermalProfile);
  const { state, scores } = resolveWeatherStateWithScores(signals);
  const riskProfile = buildWeatherRiskProfile(snapshot);

  return {
    state,
    signals,
    riskProfile,
    stateScores: scores,
    activities: deriveActivityAssessments(signals, state, riskProfile),
    outfitNeeds: deriveOutfitNeeds(signals, state),
    bestWindow: deriveBestWindow(signals, state),
    highlightedModule: deriveHighlightedModule(state),
  };
}
