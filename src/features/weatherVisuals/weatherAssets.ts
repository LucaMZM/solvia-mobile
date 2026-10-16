import type { ImageSourcePropType } from 'react-native';
import type { WeatherState } from '@/src/types/recommendations';

export type WeatherAssetKey =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'wind'
  | 'night-clear'
  | 'night-cloudy'
  | 'fog'
  | 'snow';

export interface WeatherAssetInput {
  weatherCode: number;
  isDay: boolean;
  precipitationProbability?: number;
  precipitationMm?: number;
  windSpeedKmh?: number;
  windGustKmh?: number;
  cloudCoverPct?: number;
}

interface WeatherAssetResolution {
  key: WeatherAssetKey;
  fallbackKey: WeatherAssetKey;
  isRenderable: boolean;
  source: ImageSourcePropType;
  sourceRoot: 'assets/weather-hero';
}

export const WEATHER_HERO_ASSETS: Record<WeatherAssetKey, ImageSourcePropType> = {
  sunny: require('../../../assets/weather-hero/sunny.png'),
  'partly-cloudy': require('../../../assets/weather-hero/partly-cloudy.png'),
  cloudy: require('../../../assets/weather-hero/cloudy.png'),
  rain: require('../../../assets/weather-hero/rain.png'),
  storm: require('../../../assets/weather-hero/storm.png'),
  wind: require('../../../assets/weather-hero/wind.png'),
  'night-clear': require('../../../assets/weather-hero/night-clear.png'),
  'night-cloudy': require('../../../assets/weather-hero/night-cloudy.png'),
  fog: require('../../../assets/weather-hero/fog.png'),
  snow: require('../../../assets/weather-hero/snow.png'),
};

const stormCodes = new Set([95, 96, 99]);
const snowCodes = new Set([71, 73, 75, 77, 85, 86]);
const rainCodes = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const fogCodes = new Set([45, 48]);

function isWindDominant(input: WeatherAssetInput): boolean {
  const speed = input.windSpeedKmh ?? 0;
  const gusts = input.windGustKmh ?? 0;
  const hasClearPrecipitation =
    (input.precipitationMm ?? 0) >= 0.3 || (input.precipitationProbability ?? 0) >= 55;

  return !hasClearPrecipitation && (speed >= 30 || gusts >= 44);
}

function fallbackBySky(input: WeatherAssetInput): WeatherAssetKey {
  const cloudCover = input.cloudCoverPct ?? 0;

  if (!input.isDay) {
    return cloudCover >= 45 ? 'night-cloudy' : 'night-clear';
  }

  if (cloudCover >= 78) {
    return 'cloudy';
  }

  return cloudCover >= 34 ? 'partly-cloudy' : 'sunny';
}

/**
 * Centraliza el mapeo Open-Meteo -> asset visual.
 * El viento solo domina cuando no hay lluvia, tormenta, nieve o niebla claras.
 */
export function getWeatherHeroAssetKey(input: WeatherAssetInput): WeatherAssetKey {
  const { weatherCode, isDay } = input;

  if (stormCodes.has(weatherCode)) {
    return 'storm';
  }
  if (snowCodes.has(weatherCode)) {
    return 'snow';
  }
  if (rainCodes.has(weatherCode)) {
    return 'rain';
  }
  if (fogCodes.has(weatherCode)) {
    return 'fog';
  }
  if (weatherCode === 3) {
    return 'cloudy';
  }
  if (weatherCode === 1 || weatherCode === 2) {
    return isDay ? 'partly-cloudy' : 'night-cloudy';
  }
  if (weatherCode === 0) {
    return isDay ? 'sunny' : 'night-clear';
  }
  if (isWindDominant(input)) {
    return 'wind';
  }

  return fallbackBySky(input);
}

export function getWeatherAssetKey(input: WeatherAssetInput): WeatherAssetKey {
  return getWeatherHeroAssetKey(input);
}

export function getWeatherVisualKey(input: WeatherAssetInput): WeatherAssetKey {
  return getWeatherHeroAssetKey(input);
}

export function getWeatherAsset(input: WeatherAssetInput): WeatherAssetResolution {
  return getWeatherVisualAsset(getWeatherHeroAssetKey(input));
}

export function getWeatherVisualKeyFromState(state: WeatherState): WeatherAssetKey {
  const keyByState: Record<WeatherState, WeatherAssetKey> = {
    pleasant_sunny: 'sunny',
    strong_sun: 'sunny',
    soft_cloudy: 'partly-cloudy',
    rainy: 'rain',
    windy: 'wind',
    cool_evening: 'night-cloudy',
    golden_hour: 'partly-cloudy',
    night_clear: 'night-clear',
  };

  return keyByState[state] ?? 'partly-cloudy';
}

export function getWeatherVisualAsset(key: WeatherAssetKey): WeatherAssetResolution {
  const source = WEATHER_HERO_ASSETS[key] ?? WEATHER_HERO_ASSETS['partly-cloudy'];

  return {
    key,
    fallbackKey: key,
    isRenderable: true,
    source,
    sourceRoot: 'assets/weather-hero',
  };
}

export function getWeatherHeroConfig(input: WeatherAssetInput): WeatherAssetResolution {
  return getWeatherVisualAsset(getWeatherHeroAssetKey(input));
}

export function getWeatherAssetSource(key: WeatherAssetKey): ImageSourcePropType {
  return getWeatherVisualAsset(key).source;
}
