import {
  isCloudyWeatherCode,
  isRainWeatherCode,
  isStormWeatherCode,
} from '@/src/services/weather/weatherCode';
import type { CurrentWeather, HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';

export type WeatherRiskSeverity = 'clear' | 'minor' | 'moderate' | 'high' | 'severe';

export type WeatherRiskReasonCode =
  | 'storm'
  | 'storm_soon'
  | 'current_rain'
  | 'upcoming_rain'
  | 'heavy_rain'
  | 'strong_wind'
  | 'strong_gusts'
  | 'cold_now'
  | 'cold_soon'
  | 'heat_risk'
  | 'high_uv'
  | 'night'
  | 'cloudy_dry'
  | 'data_uncertain';

export interface WeatherRiskFlags {
  stormNow: boolean;
  stormSoon: boolean;
  rainNow: boolean;
  rainSoon: boolean;
  heavyRain: boolean;
  strongWind: boolean;
  strongGusts: boolean;
  coldNow: boolean;
  coldSoon: boolean;
  heatRisk: boolean;
  highUv: boolean;
  night: boolean;
  cloudyDry: boolean;
  dataUncertain: boolean;
}

export interface WeatherRiskProfile {
  severity: WeatherRiskSeverity;
  flags: WeatherRiskFlags;
  summary: string;
  reasonCodes: WeatherRiskReasonCode[];
  rainPeakProbability: number;
  rainPeakMm: number;
  windPeakKmh: number;
  gustPeakKmh: number;
}

function max(values: readonly number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

function deriveSeverity(flags: WeatherRiskFlags): WeatherRiskSeverity {
  if (flags.stormNow || flags.heavyRain) {
    return 'severe';
  }
  if (flags.stormSoon || flags.rainNow || flags.strongGusts || (flags.rainSoon && flags.strongWind)) {
    return 'high';
  }
  if (flags.rainSoon || flags.strongWind || flags.coldNow || flags.heatRisk || flags.highUv) {
    return 'moderate';
  }
  if (flags.coldSoon || flags.cloudyDry || flags.dataUncertain) {
    return 'minor';
  }
  return 'clear';
}

function buildReasonCodes(flags: WeatherRiskFlags): WeatherRiskReasonCode[] {
  const codes: WeatherRiskReasonCode[] = [];

  if (flags.stormNow) codes.push('storm');
  if (flags.stormSoon) codes.push('storm_soon');
  if (flags.rainNow) codes.push('current_rain');
  if (flags.rainSoon) codes.push('upcoming_rain');
  if (flags.heavyRain) codes.push('heavy_rain');
  if (flags.strongWind) codes.push('strong_wind');
  if (flags.strongGusts) codes.push('strong_gusts');
  if (flags.coldNow) codes.push('cold_now');
  if (flags.coldSoon) codes.push('cold_soon');
  if (flags.heatRisk) codes.push('heat_risk');
  if (flags.highUv) codes.push('high_uv');
  if (flags.night) codes.push('night');
  if (flags.cloudyDry) codes.push('cloudy_dry');
  if (flags.dataUncertain) codes.push('data_uncertain');

  return codes;
}

function summaryFromFlags(flags: WeatherRiskFlags): string {
  if (flags.stormNow) return 'Tormenta: mejor evitar exterior.';
  if (flags.stormSoon) return 'Tormenta próxima: mejor no alargar planes exteriores.';
  if (flags.heavyRain) return 'Lluvia fuerte: prioriza cubierto.';
  if (flags.rainNow) return 'Lluvia activa: salida corta y protegida.';
  if (flags.rainSoon) return 'Puede llover pronto.';
  if (flags.strongGusts || flags.strongWind) return 'Viento marcado: mejor zonas resguardadas.';
  if (flags.coldNow || flags.coldSoon) return 'Refresca: conviene capa.';
  if (flags.highUv) return 'UV alto: protección y sombra.';
  if (flags.night) return 'Noche: sin UV, mira fresco y viento.';
  if (flags.cloudyDry) return 'Día gris, viable si se mantiene seco.';
  if (flags.dataUncertain) return 'Lectura prudente: puede cambiar.';
  return 'Condiciones estables.';
}

export function buildWeatherRiskProfile(snapshot: WeatherSnapshot): WeatherRiskProfile {
  const current = snapshot.current;
  const next = snapshot.hourly.slice(0, 3);
  const rainPeakProbability = max([current.precipitationProbability, ...next.map((point) => point.precipitationProbability)]);
  const rainPeakMm = max([current.precipitationMm, ...next.map((point) => point.precipitationMm)]);
  const windPeakKmh = max([current.windSpeedKmh, ...next.map((point) => point.windSpeedKmh)]);
  const gustPeakKmh = max([current.windGustKmh, ...next.map((point) => point.windGustKmh)]);
  const nextApparentMin = Math.min(current.apparentTemperatureC, ...next.map((point) => point.apparentTemperatureC));
  const nextHasRainCode = next.some((point) => isRainWeatherCode(point.weatherCode));
  const nextHasStormCode = next.some((point) => isStormWeatherCode(point.weatherCode));

  const flags: WeatherRiskFlags = {
    stormNow: isStormWeatherCode(current.weatherCode),
    stormSoon: !isStormWeatherCode(current.weatherCode) && nextHasStormCode,
    rainNow: isRainWeatherCode(current.weatherCode) || current.precipitationMm > 0,
    rainSoon: rainPeakProbability >= 55 || rainPeakMm >= 0.5 || nextHasRainCode,
    // `heavyRain` describes what is happening now. Future amounts are already
    // represented by `rainSoon` and must not turn a forecast into a current alert.
    heavyRain: current.precipitationMm >= 1.2,
    strongWind: windPeakKmh >= 32,
    strongGusts: gustPeakKmh >= 44,
    coldNow: current.apparentTemperatureC <= 10,
    coldSoon: nextApparentMin <= 9 || current.apparentTemperatureC - nextApparentMin >= 3,
    heatRisk: current.apparentTemperatureC >= 31,
    highUv: current.isDay && current.uvStatus === 'available' && current.uvIndex >= 7,
    night: !current.isDay,
    cloudyDry:
      current.isDay &&
      isCloudyWeatherCode(current.weatherCode) &&
      rainPeakProbability < 35 &&
      rainPeakMm < 0.3,
    dataUncertain:
      snapshot.meta?.isStale === true ||
      (snapshot.meta?.source === 'cache' && snapshot.meta.cacheAgeMinutes > 15) ||
      snapshot.meta?.source === 'demo' ||
      snapshot.meta?.dataStatus === 'partial',
  };

  const severity = deriveSeverity(flags);
  return {
    severity,
    flags,
    summary: summaryFromFlags(flags),
    reasonCodes: buildReasonCodes(flags),
    rainPeakProbability,
    rainPeakMm,
    windPeakKmh,
    gustPeakKmh,
  };
}

export function mergeWeatherRiskProfiles(
  profiles: readonly WeatherRiskProfile[],
  forceDataUncertain = false,
): WeatherRiskProfile {
  const flags: WeatherRiskFlags = {
    stormNow: profiles.some((profile) => profile.flags.stormNow),
    stormSoon: profiles.some((profile) => profile.flags.stormSoon),
    rainNow: profiles.some((profile) => profile.flags.rainNow),
    rainSoon: profiles.some((profile) => profile.flags.rainSoon),
    heavyRain: profiles.some((profile) => profile.flags.heavyRain),
    strongWind: profiles.some((profile) => profile.flags.strongWind),
    strongGusts: profiles.some((profile) => profile.flags.strongGusts),
    coldNow: profiles.some((profile) => profile.flags.coldNow),
    coldSoon: profiles.some((profile) => profile.flags.coldSoon),
    heatRisk: profiles.some((profile) => profile.flags.heatRisk),
    highUv: profiles.some((profile) => profile.flags.highUv),
    night: profiles.length > 0 && profiles.every((profile) => profile.flags.night),
    cloudyDry: profiles.length > 0 && profiles.every((profile) => profile.flags.cloudyDry),
    dataUncertain: forceDataUncertain || profiles.length === 0 || profiles.some((profile) => profile.flags.dataUncertain),
  };

  return {
    severity: deriveSeverity(flags),
    flags,
    summary: summaryFromFlags(flags),
    reasonCodes: buildReasonCodes(flags),
    rainPeakProbability: max(profiles.map((profile) => profile.rainPeakProbability)),
    rainPeakMm: max(profiles.map((profile) => profile.rainPeakMm)),
    windPeakKmh: max(profiles.map((profile) => profile.windPeakKmh)),
    gustPeakKmh: max(profiles.map((profile) => profile.gustPeakKmh)),
  };
}

export function buildWeatherRiskProfileFromPoint(
  current: CurrentWeather | HourlyForecastPoint,
  next: readonly HourlyForecastPoint[] = [],
): WeatherRiskProfile {
  return buildWeatherRiskProfile({
    cityName: 'Trayecto',
    coordinates: { latitude: 0, longitude: 0 },
    current: {
      timeISO: current.timeISO,
      temperatureC: current.temperatureC,
      apparentTemperatureC: current.apparentTemperatureC,
      isDay: current.isDay,
      weatherCode: current.weatherCode,
      precipitationMm: current.precipitationMm,
      precipitationProbability: current.precipitationProbability,
      windSpeedKmh: current.windSpeedKmh,
      windGustKmh: current.windGustKmh,
      uvIndex: current.uvIndex,
      uvStatus: 'uvStatus' in current ? current.uvStatus : 'available',
      cloudCoverPct: current.cloudCoverPct,
      humidityPct: current.humidityPct,
    },
    daily: {
      sunriseISO: current.timeISO,
      sunsetISO: current.timeISO,
      uvIndexMax: current.uvIndex,
      maxTemperatureC: current.temperatureC,
      minTemperatureC: current.temperatureC,
    },
    dailySeries: [],
    fetchedAtISO: current.timeISO,
    hourly: [...next],
    timezone: 'auto',
  });
}
