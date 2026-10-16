import { deriveRecommendationModel } from '@/src/features/recommendations/derivation';
import {
  canUseStrongPositiveLanguage,
  getSafeRecommendationLabel,
} from '@/src/features/recommendations/recommendationPolicy';
import { buildWeatherRiskProfile } from '@/src/features/recommendations/weatherRisk';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function point(overrides: Partial<HourlyForecastPoint> = {}): HourlyForecastPoint {
  return {
    timeISO: '2026-08-05T13:00',
    temperatureC: 24,
    apparentTemperatureC: 24,
    weatherCode: 1,
    isDay: true,
    windSpeedKmh: 10,
    windGustKmh: 16,
    uvIndex: 5,
    precipitationProbability: 10,
    precipitationMm: 0,
    cloudCoverPct: 30,
    humidityPct: 55,
    ...overrides,
  };
}

function snapshot(params: {
  current?: Partial<HourlyForecastPoint>;
  next?: Array<Partial<HourlyForecastPoint>>;
  uncertain?: boolean;
} = {}): WeatherSnapshot {
  const current = point(params.current);
  const next = (params.next ?? []).map((overrides, index) =>
    point({
      timeISO: `2026-08-05T${String(14 + index).padStart(2, '0')}:00`,
      ...overrides,
    }),
  );

  return {
    cityName: 'Valencia',
    coordinates: { latitude: 39.47, longitude: -0.38 },
    current: {
      ...current,
      uvStatus: current.isDay ? 'available' : 'unavailable',
    },
    hourly: [current, ...next],
    daily: {
      sunriseISO: '2026-08-05T07:02',
      sunsetISO: '2026-08-05T21:08',
      uvIndexMax: 8,
      maxTemperatureC: 30,
      minTemperatureC: 20,
    },
    dailySeries: [],
    fetchedAtISO: '2026-08-05T13:00',
    timezone: 'Europe/Madrid',
    meta: {
      source: params.uncertain ? 'cache' : 'live',
      cacheAgeMinutes: params.uncertain ? 35 : 0,
      isStale: params.uncertain ?? false,
      dataStatus: params.uncertain ? 'partial' : 'available',
    },
  };
}

export function runRecommendationRegressionChecks(): void {
  const rain = buildWeatherRiskProfile(snapshot({
    current: { weatherCode: 61, precipitationMm: 0.7, precipitationProbability: 90 },
  }));
  assert(getSafeRecommendationLabel('caminar', rain, 95) !== 'Recomendado', 'Lluvia: caminar no puede ser recomendado.');
  assert(getSafeRecommendationLabel('terraza', rain, 95) === 'Solo cubierto', 'Lluvia: terraza debe ser cubierta.');
  assert(getSafeRecommendationLabel('tomar_sol', rain, 95) === 'No recomendado', 'Lluvia: tomar el sol no es viable.');
  assert(getSafeRecommendationLabel('paraguas', rain, 95) === 'Con paraguas', 'Lluvia: el paraguas debe priorizarse.');

  const storm = buildWeatherRiskProfile(snapshot({ current: { weatherCode: 95 } }));
  assert(storm.flags.stormNow, 'Tormenta actual debe detectarse.');
  assert(getSafeRecommendationLabel('running_suave', storm, 100) === 'No recomendado', 'Tormenta: running no recomendado.');

  const stormSoon = buildWeatherRiskProfile(snapshot({ next: [{ weatherCode: 95 }] }));
  assert(stormSoon.flags.stormSoon && !stormSoon.flags.stormNow, 'Tormenta futura no debe presentarse como actual.');
  assert(getSafeRecommendationLabel('caminar', stormSoon, 100) === 'Mejor esperar', 'Tormenta próxima debe limitar exterior.');

  const cloudyDry = buildWeatherRiskProfile(snapshot({
    current: { weatherCode: 3, cloudCoverPct: 90, precipitationProbability: 12 },
  }));
  assert(cloudyDry.flags.cloudyDry, 'Nublado seco debe reconocerse sin convertirlo en lluvia.');
  assert(getSafeRecommendationLabel('caminar', cloudyDry, 70) === 'Viable', 'Nublado seco puede permitir caminar.');

  const wind = buildWeatherRiskProfile(snapshot({ current: { windSpeedKmh: 38, windGustKmh: 52 } }));
  assert(getSafeRecommendationLabel('terraza', wind, 90) === 'Con ajustes', 'Viento: terraza debe bajar prioridad.');
  assert(getSafeRecommendationLabel('caminar', wind, 90) === 'Mejor corto', 'Viento: caminar requiere ajuste.');

  const night = buildWeatherRiskProfile(snapshot({
    current: { isDay: false, uvIndex: 0, weatherCode: 0, timeISO: '2026-08-05T23:00' },
  }));
  assert(getSafeRecommendationLabel('tomar_sol', night, 100) === 'No recomendado', 'Noche: tomar el sol no puede ser positivo.');

  const uncertain = buildWeatherRiskProfile(snapshot({ uncertain: true }));
  assert(!canUseStrongPositiveLanguage(uncertain), 'Datos inciertos no permiten lenguaje fuerte.');
  assert(getSafeRecommendationLabel('caminar', uncertain, 100) !== 'Recomendado', 'Datos inciertos deben limitar la etiqueta.');

  const mild = snapshot({ current: { apparentTemperatureC: 15, temperatureC: 16 } });
  const normalWarmth = deriveRecommendationModel(mild, 'normal').outfitNeeds.warmthLevel;
  const coldSensitiveWarmth = deriveRecommendationModel(mild, 'friolero').outfitNeeds.warmthLevel;
  assert(coldSensitiveWarmth >= normalWarmth, 'El perfil friolero debe mantener o aumentar la capa térmica.');
}

export function runRecommendationRegressionChecksSafely(): void {
  if (!__DEV__) {
    return;
  }

  try {
    runRecommendationRegressionChecks();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[recommendations] Regresión detectada en checks locales:', error);
  }
}
