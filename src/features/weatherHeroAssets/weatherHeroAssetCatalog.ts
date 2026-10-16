import type { WeatherHeroArtworkKey } from '@/src/components/ui/weatherHeroVisualConfig';
import type { WeatherState } from '@/src/types/recommendations';
import type {
  WeatherHeroAssetEntry,
  WeatherHeroAssetManifest,
  WeatherHeroAssetMetadata,
} from '@/src/features/weatherHeroAssets/types';
import { generatedWeatherHeroRegistry } from '@/src/features/weatherHeroAssets/generatedAssetRegistry';

const weatherHeroManifest = require('../../../assets/weather-hero/manifest.json') as WeatherHeroAssetManifest;
const pleasantSunnyMetadata = require('../../../assets/weather-hero/pleasant_sunny/metadata.json') as WeatherHeroAssetMetadata;
const strongSunMetadata = require('../../../assets/weather-hero/strong_sun/metadata.json') as WeatherHeroAssetMetadata;
const softCloudyMetadata = require('../../../assets/weather-hero/soft_cloudy/metadata.json') as WeatherHeroAssetMetadata;
const rainyMetadata = require('../../../assets/weather-hero/rainy/metadata.json') as WeatherHeroAssetMetadata;
const windyMetadata = require('../../../assets/weather-hero/windy/metadata.json') as WeatherHeroAssetMetadata;
const coolEveningMetadata = require('../../../assets/weather-hero/cool_evening/metadata.json') as WeatherHeroAssetMetadata;
const goldenHourMetadata = require('../../../assets/weather-hero/golden_hour/metadata.json') as WeatherHeroAssetMetadata;
const nightClearMetadata = require('../../../assets/weather-hero/night_clear/metadata.json') as WeatherHeroAssetMetadata;

const weatherHeroArtworkKeys: WeatherHeroArtworkKey[] = [
  'hero_soft_sun_v1',
  'hero_strong_sun_v1',
  'hero_soft_cloud_v1',
  'hero_rain_cloud_v1',
  'hero_wind_flow_v1',
  'hero_cool_evening_v1',
  'hero_golden_hour_v1',
  'hero_moon_clear_v1',
];

function isWeatherHeroArtworkKey(value: string): value is WeatherHeroArtworkKey {
  return (weatherHeroArtworkKeys as string[]).includes(value);
}

function withStateMetadata(
  state: WeatherState,
  metadata: WeatherHeroAssetMetadata,
  runtimeEntry: (typeof generatedWeatherHeroRegistry)[WeatherState],
): WeatherHeroAssetEntry {
  const id = metadata.id || `hero_${state}`;
  return {
    id,
    state,
    metadata: {
      ...metadata,
      id,
      weatherState: state,
      filePath: runtimeEntry.filePath ?? metadata.filePath ?? null,
      format: runtimeEntry.format ?? metadata.format ?? null,
      kind: runtimeEntry.kind ?? metadata.kind ?? 'image',
    },
    imageSource: runtimeEntry.imageSource ?? null,
    lottieSource: runtimeEntry.lottieSource ?? null,
    riveSource: runtimeEntry.riveSource ?? null,
    videoSource: runtimeEntry.videoSource ?? null,
    isPlaceholder: !runtimeEntry.filePath,
  };
}

const weatherHeroAssetsByState: Record<WeatherState, WeatherHeroAssetEntry> = {
  pleasant_sunny: withStateMetadata('pleasant_sunny', pleasantSunnyMetadata, generatedWeatherHeroRegistry.pleasant_sunny),
  strong_sun: withStateMetadata('strong_sun', strongSunMetadata, generatedWeatherHeroRegistry.strong_sun),
  soft_cloudy: withStateMetadata('soft_cloudy', softCloudyMetadata, generatedWeatherHeroRegistry.soft_cloudy),
  rainy: withStateMetadata('rainy', rainyMetadata, generatedWeatherHeroRegistry.rainy),
  windy: withStateMetadata('windy', windyMetadata, generatedWeatherHeroRegistry.windy),
  cool_evening: withStateMetadata('cool_evening', coolEveningMetadata, generatedWeatherHeroRegistry.cool_evening),
  golden_hour: withStateMetadata('golden_hour', goldenHourMetadata, generatedWeatherHeroRegistry.golden_hour),
  night_clear: withStateMetadata('night_clear', nightClearMetadata, generatedWeatherHeroRegistry.night_clear),
};

const fallbackArtworkKeyToStateMap: Record<WeatherHeroArtworkKey, WeatherState> = {
  hero_soft_sun_v1: 'pleasant_sunny',
  hero_strong_sun_v1: 'strong_sun',
  hero_soft_cloud_v1: 'soft_cloudy',
  hero_rain_cloud_v1: 'rainy',
  hero_wind_flow_v1: 'windy',
  hero_cool_evening_v1: 'cool_evening',
  hero_golden_hour_v1: 'golden_hour',
  hero_moon_clear_v1: 'night_clear',
};

const artworkKeyToStateMap: Record<WeatherHeroArtworkKey, WeatherState> = weatherHeroManifest.assets.reduce(
  (map, entry) => {
    if (isWeatherHeroArtworkKey(entry.artworkKey)) {
      map[entry.artworkKey] = entry.weatherState;
    }

    return map;
  },
  { ...fallbackArtworkKeyToStateMap },
);

export function getWeatherHeroAssetForState(state: WeatherState): WeatherHeroAssetEntry {
  return weatherHeroAssetsByState[state] ?? weatherHeroAssetsByState.pleasant_sunny;
}

export function getWeatherHeroAssetForArtworkKey(key: WeatherHeroArtworkKey): WeatherHeroAssetEntry {
  const state = artworkKeyToStateMap[key];
  return getWeatherHeroAssetForState(state);
}

export function getWeatherHeroAssetImageForArtworkKey(key: WeatherHeroArtworkKey) {
  return getWeatherHeroAssetForArtworkKey(key).imageSource;
}

export function getWeatherHeroAssetManifest(): WeatherHeroAssetManifest {
  return weatherHeroManifest;
}
