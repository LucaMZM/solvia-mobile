import type { WeatherState } from '@/src/types/recommendations';

export type HeroOrbKind = 'none' | 'sun' | 'moon';
export type WeatherHeroArtworkKey =
  | 'hero_soft_sun_v1'
  | 'hero_strong_sun_v1'
  | 'hero_soft_cloud_v1'
  | 'hero_rain_cloud_v1'
  | 'hero_wind_flow_v1'
  | 'hero_cool_evening_v1'
  | 'hero_golden_hour_v1'
  | 'hero_moon_clear_v1';

export interface WeatherHeroVisualConfig {
  replaceableArtworkKey: WeatherHeroArtworkKey;
  orbKind: HeroOrbKind;
  orbSize: number;
  orbTop: number;
  orbRight: number;
  orbWarmth: number;
  orbIntensity: number;
  orbHaloOpacity: number;
  cloudOpacity: number;
  cloudScale: number;
  cloudTop: number;
  cloudLeft: number;
  rainOpacity: number;
  rainDensity: number;
  windOpacity: number;
  windDensity: number;
  starOpacity: number;
  starDensity: number;
  horizonGlowColor: string;
  horizonGlowOpacity: number;
  ambientMistColor: string;
  ambientMistOpacity: number;
}

const visualConfigByState: Record<WeatherState, WeatherHeroVisualConfig> = {
  pleasant_sunny: {
    replaceableArtworkKey: 'hero_soft_sun_v1',
    orbKind: 'sun',
    orbSize: 188,
    orbTop: -50,
    orbRight: -48,
    orbWarmth: 0.72,
    orbIntensity: 0.74,
    orbHaloOpacity: 0.42,
    cloudOpacity: 0.16,
    cloudScale: 0.9,
    cloudTop: 72,
    cloudLeft: -18,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.06,
    windDensity: 2,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#f6bc63',
    horizonGlowOpacity: 0.28,
    ambientMistColor: '#b9d8ff',
    ambientMistOpacity: 0.16,
  },
  strong_sun: {
    replaceableArtworkKey: 'hero_strong_sun_v1',
    orbKind: 'sun',
    orbSize: 226,
    orbTop: -72,
    orbRight: -56,
    orbWarmth: 0.98,
    orbIntensity: 1,
    orbHaloOpacity: 0.58,
    cloudOpacity: 0.04,
    cloudScale: 0.84,
    cloudTop: 96,
    cloudLeft: -24,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.04,
    windDensity: 2,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#ffb95f',
    horizonGlowOpacity: 0.4,
    ambientMistColor: '#ffd0a4',
    ambientMistOpacity: 0.2,
  },
  soft_cloudy: {
    replaceableArtworkKey: 'hero_soft_cloud_v1',
    orbKind: 'none',
    orbSize: 0,
    orbTop: 0,
    orbRight: 0,
    orbWarmth: 0,
    orbIntensity: 0,
    orbHaloOpacity: 0,
    cloudOpacity: 0.96,
    cloudScale: 1.08,
    cloudTop: 54,
    cloudLeft: -36,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.11,
    windDensity: 3,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#b9c8de',
    horizonGlowOpacity: 0.21,
    ambientMistColor: '#c9d3e6',
    ambientMistOpacity: 0.2,
  },
  rainy: {
    replaceableArtworkKey: 'hero_rain_cloud_v1',
    orbKind: 'none',
    orbSize: 0,
    orbTop: 0,
    orbRight: 0,
    orbWarmth: 0,
    orbIntensity: 0,
    orbHaloOpacity: 0,
    cloudOpacity: 0.98,
    cloudScale: 1.14,
    cloudTop: 48,
    cloudLeft: -32,
    rainOpacity: 0.58,
    rainDensity: 11,
    windOpacity: 0.18,
    windDensity: 4,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#8ea4c7',
    horizonGlowOpacity: 0.2,
    ambientMistColor: '#9db2cf',
    ambientMistOpacity: 0.3,
  },
  windy: {
    replaceableArtworkKey: 'hero_wind_flow_v1',
    orbKind: 'sun',
    orbSize: 152,
    orbTop: -26,
    orbRight: -34,
    orbWarmth: 0.34,
    orbIntensity: 0.38,
    orbHaloOpacity: 0.2,
    cloudOpacity: 0.52,
    cloudScale: 1,
    cloudTop: 62,
    cloudLeft: -22,
    rainOpacity: 0.05,
    rainDensity: 3,
    windOpacity: 0.52,
    windDensity: 8,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#9fb7ce',
    horizonGlowOpacity: 0.2,
    ambientMistColor: '#aec6de',
    ambientMistOpacity: 0.24,
  },
  cool_evening: {
    replaceableArtworkKey: 'hero_cool_evening_v1',
    orbKind: 'none',
    orbSize: 0,
    orbTop: 0,
    orbRight: 0,
    orbWarmth: 0,
    orbIntensity: 0,
    orbHaloOpacity: 0,
    cloudOpacity: 0.3,
    cloudScale: 1.03,
    cloudTop: 86,
    cloudLeft: -28,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.14,
    windDensity: 3,
    starOpacity: 0.12,
    starDensity: 3,
    horizonGlowColor: '#7ca2d8',
    horizonGlowOpacity: 0.36,
    ambientMistColor: '#9db9ea',
    ambientMistOpacity: 0.3,
  },
  golden_hour: {
    replaceableArtworkKey: 'hero_golden_hour_v1',
    orbKind: 'sun',
    orbSize: 194,
    orbTop: 4,
    orbRight: -48,
    orbWarmth: 0.96,
    orbIntensity: 0.88,
    orbHaloOpacity: 0.46,
    cloudOpacity: 0.34,
    cloudScale: 0.96,
    cloudTop: 88,
    cloudLeft: -16,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.08,
    windDensity: 2,
    starOpacity: 0,
    starDensity: 0,
    horizonGlowColor: '#ffb95f',
    horizonGlowOpacity: 0.44,
    ambientMistColor: '#ffcaa4',
    ambientMistOpacity: 0.24,
  },
  night_clear: {
    replaceableArtworkKey: 'hero_moon_clear_v1',
    orbKind: 'moon',
    orbSize: 146,
    orbTop: -28,
    orbRight: -18,
    orbWarmth: 0.05,
    orbIntensity: 0.9,
    orbHaloOpacity: 0.36,
    cloudOpacity: 0.1,
    cloudScale: 0.88,
    cloudTop: 88,
    cloudLeft: -18,
    rainOpacity: 0,
    rainDensity: 0,
    windOpacity: 0.08,
    windDensity: 2,
    starOpacity: 0.42,
    starDensity: 9,
    horizonGlowColor: '#7d8fc0',
    horizonGlowOpacity: 0.24,
    ambientMistColor: '#9eb0e3',
    ambientMistOpacity: 0.24,
  },
};

const fallbackVisualConfig = visualConfigByState.pleasant_sunny;

export function getWeatherHeroVisualConfig(state: WeatherState): WeatherHeroVisualConfig {
  return visualConfigByState[state] ?? fallbackVisualConfig;
}
