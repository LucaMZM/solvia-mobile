import type { WeatherState } from '@/src/types/recommendations';
import type { WeatherHeroAssetFormat, WeatherHeroAssetKind } from '@/src/features/weatherHeroAssets/types';

export interface GeneratedWeatherHeroAssetEntry {
  filePath: string | null;
  format: WeatherHeroAssetFormat | null;
  kind: WeatherHeroAssetKind;
  imageSource?: unknown | null;
  lottieSource?: unknown | null;
  riveSource?: unknown | null;
  videoSource?: unknown | null;
}

// Archivo generado automáticamente. No editar manualmente.
export const generatedWeatherHeroRegistry: Record<WeatherState, GeneratedWeatherHeroAssetEntry> = {
  pleasant_sunny: { filePath: null, format: null, kind: 'image', imageSource: null },
  strong_sun: { filePath: null, format: null, kind: 'image', imageSource: null },
  soft_cloudy: { filePath: null, format: null, kind: 'image', imageSource: null },
  rainy: { filePath: null, format: null, kind: 'image', imageSource: null },
  windy: { filePath: null, format: null, kind: 'image', imageSource: null },
  cool_evening: { filePath: null, format: null, kind: 'image', imageSource: null },
  golden_hour: { filePath: null, format: null, kind: 'image', imageSource: null },
  night_clear: { filePath: null, format: null, kind: 'image', imageSource: null },
};
