import type { ImageSourcePropType } from 'react-native';

import type { WeatherHeroArtworkKey } from '@/src/components/ui/weatherHeroVisualConfig';
import { getWeatherHeroAssetImageForArtworkKey } from '@/src/features/weatherHeroAssets/weatherHeroAssetCatalog';

export function resolveWeatherHeroArtwork(key: WeatherHeroArtworkKey): ImageSourcePropType | null {
  return getWeatherHeroAssetImageForArtworkKey(key) ?? null;
}
