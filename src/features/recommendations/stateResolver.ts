import {
  isClearWeatherCode,
  isCloudyWeatherCode,
  isRainWeatherCode,
  isStormWeatherCode,
} from '@/src/services/weather/weatherCode';
import { getLocalHour, minutesBetweenLocalIso } from '@/src/services/weather/localTime';
import type { ThermalProfile, WeatherState } from '@/src/types/recommendations';
import type { WeatherSnapshot } from '@/src/types/weather';

interface StateScoreMap extends Record<WeatherState, number> {}

export interface RecommendationSignals {
  snapshot: WeatherSnapshot;
  thermalProfile: ThermalProfile;
  nowHour: number;
  minutesToSunset: number;
  rainRisk: number;
  rainNow: boolean;
  stormNow: boolean;
  upcomingRainRisk: boolean;
  windImpact: number;
  sunExposure: number;
  cloudCover: number;
  humidity: number;
  apparentTemperature: number;
  thermalAdjustedApparent: number;
  temperatureTrend3h: number;
}

interface ResolvedState {
  state: WeatherState;
  scores: StateScoreMap;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toPercentageScore(value: number, maxExpected: number): number {
  return clamp((value / maxExpected) * 100, 0, 100);
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

function minutesBetween(startISO: string, endISO: string): number {
  return minutesBetweenLocalIso(startISO, endISO);
}

function deriveRainRisk(snapshot: WeatherSnapshot): number {
  const current = snapshot.current;
  const next = snapshot.hourly.slice(0, 3);
  const probability = Math.max(current.precipitationProbability, ...next.map((point) => point.precipitationProbability));
  const amount = Math.max(current.precipitationMm, ...next.map((point) => point.precipitationMm));
  const rainCode = isRainWeatherCode(current.weatherCode) ? 100 : 0;
  const stormCode = isStormWeatherCode(current.weatherCode) ? 100 : 0;

  return clamp(probability * 0.58 + toPercentageScore(amount, 2.2) * 0.3 + rainCode * 0.18 + stormCode * 0.22, 0, 100);
}

function deriveWindImpact(snapshot: WeatherSnapshot): number {
  const current = snapshot.current;
  const next = snapshot.hourly.slice(0, 3);
  const speed = Math.max(current.windSpeedKmh, ...next.map((point) => point.windSpeedKmh));
  const gust = Math.max(current.windGustKmh, ...next.map((point) => point.windGustKmh));

  return clamp(toPercentageScore(speed, 45) * 0.56 + toPercentageScore(gust, 65) * 0.44, 0, 100);
}

function deriveSunExposure(snapshot: WeatherSnapshot): number {
  const uv = snapshot.current.uvIndex;
  const clearSkyFactor = clamp(100 - snapshot.current.cloudCoverPct, 0, 100);
  return clamp(uv * 11 + clearSkyFactor * 0.24, 0, 100);
}

export function deriveRecommendationSignals(
  snapshot: WeatherSnapshot,
  thermalProfile: ThermalProfile,
): RecommendationSignals {
  const nowHour = getLocalHour(snapshot.current.timeISO);
  const minutesToSunset = minutesBetween(snapshot.current.timeISO, snapshot.daily.sunsetISO);
  const currentApparent = snapshot.current.apparentTemperatureC;
  const futureApparent = snapshot.hourly[2]?.apparentTemperatureC ?? currentApparent;

  return {
    snapshot,
    thermalProfile,
    nowHour,
    minutesToSunset,
    rainRisk: deriveRainRisk(snapshot),
    rainNow: isRainWeatherCode(snapshot.current.weatherCode) || snapshot.current.precipitationMm > 0,
    stormNow: isStormWeatherCode(snapshot.current.weatherCode),
    upcomingRainRisk:
      Math.max(snapshot.current.precipitationProbability, ...snapshot.hourly.slice(0, 3).map((point) => point.precipitationProbability)) >= 55 ||
      Math.max(snapshot.current.precipitationMm, ...snapshot.hourly.slice(0, 3).map((point) => point.precipitationMm)) >= 0.5,
    windImpact: deriveWindImpact(snapshot),
    sunExposure: deriveSunExposure(snapshot),
    cloudCover: snapshot.current.cloudCoverPct,
    humidity: snapshot.current.humidityPct,
    apparentTemperature: currentApparent,
    thermalAdjustedApparent: currentApparent + thermalOffset(thermalProfile),
    temperatureTrend3h: currentApparent - futureApparent,
  };
}

function scoreComfortBand(signals: RecommendationSignals): number {
  const target = 22;
  const distance = Math.abs(signals.thermalAdjustedApparent - target);
  return clamp(100 - distance * 8, 0, 100);
}

function scoreGoldenHour(signals: RecommendationSignals): number {
  if (!signals.snapshot.current.isDay || signals.minutesToSunset < 0 || signals.minutesToSunset > 110) {
    return 0;
  }

  const sunsetBonus = clamp(100 - Math.abs(signals.minutesToSunset - 45) * 1.4, 0, 100);
  return clamp(sunsetBonus * 0.5 + scoreComfortBand(signals) * 0.22 + (100 - signals.rainRisk) * 0.18 + (100 - signals.windImpact) * 0.1, 0, 100);
}

function scoreState(signals: RecommendationSignals): StateScoreMap {
  const current = signals.snapshot.current;
  const isDay = current.isDay;
  const clear = isClearWeatherCode(current.weatherCode);
  const cloudy = isCloudyWeatherCode(current.weatherCode);
  const rain = signals.rainNow;
  const comfort = scoreComfortBand(signals);
  const golden = scoreGoldenHour(signals);
  const coolnessIndex = clamp(
    toPercentageScore(18 - signals.thermalAdjustedApparent, 14) * 0.62 +
      toPercentageScore(signals.temperatureTrend3h, 6) * 0.38,
    0,
    100,
  );

  return {
    rainy: clamp((rain ? 78 : 20) + signals.rainRisk * 0.52 + signals.cloudCover * 0.18 - signals.sunExposure * 0.15, 0, 100),
    windy: clamp(signals.windImpact * 0.78 + (isDay ? 12 : 8) + (signals.rainRisk > 60 ? -15 : 0), 0, 100),
    strong_sun: isDay
      ? clamp(signals.sunExposure * 0.72 + (100 - signals.cloudCover) * 0.24 - signals.rainRisk * 0.32, 0, 100)
      : 0,
    golden_hour: golden,
    cool_evening: isDay
      ? clamp(
          coolnessIndex * 0.68 +
            (signals.nowHour >= 17 ? 14 : 0) +
            (signals.minutesToSunset >= -20 && signals.minutesToSunset <= 150 ? 10 : 0),
          0,
          100,
        )
      : 0,
    night_clear: !isDay
      ? clamp((clear ? 64 : 26) + (100 - signals.cloudCover) * 0.28 - signals.rainRisk * 0.34 - signals.windImpact * 0.22, 0, 100)
      : 0,
    soft_cloudy: isDay
      ? clamp((cloudy ? 56 : 24) + (100 - Math.abs(signals.cloudCover - 58) * 1.15) * 0.45 + comfort * 0.3 - signals.rainRisk * 0.2, 0, 100)
      : 0,
    pleasant_sunny: isDay
      ? clamp((clear ? 58 : 30) + comfort * 0.46 + (100 - signals.rainRisk) * 0.2 + (100 - signals.windImpact) * 0.14 - signals.sunExposure * 0.08, 0, 100)
      : 0,
  };
}

function chooseState(signals: RecommendationSignals, scores: StateScoreMap): WeatherState {
  if (signals.stormNow || signals.rainNow || signals.rainRisk >= 72) {
    return 'rainy';
  }

  if (!signals.snapshot.current.isDay) {
    if (scores.rainy >= 64) {
      return 'rainy';
    }
    if (scores.windy >= 64) {
      return 'windy';
    }
    return scores.night_clear >= 40 ? 'night_clear' : 'cool_evening';
  }

  if (scores.rainy >= 70) {
    return 'rainy';
  }
  if (scores.golden_hour >= 76) {
    return 'golden_hour';
  }

  const orderedStates = (Object.keys(scores) as WeatherState[]).sort((left, right) => scores[right] - scores[left]);
  const picked = orderedStates[0] ?? 'pleasant_sunny';
  if (!signals.snapshot.current.isDay) {
    if (picked === 'pleasant_sunny' || picked === 'strong_sun' || picked === 'golden_hour' || picked === 'soft_cloudy') {
      return 'night_clear';
    }
  }
  return picked;
}

export function resolveWeatherState(
  snapshot: WeatherSnapshot,
  thermalProfile: ThermalProfile = 'normal',
): WeatherState {
  const signals = deriveRecommendationSignals(snapshot, thermalProfile);
  return resolveWeatherStateWithScores(signals).state;
}

export function resolveWeatherStateWithScores(signals: RecommendationSignals): ResolvedState {
  const scores = scoreState(signals);
  const state = chooseState(signals, scores);
  return { state, scores };
}
