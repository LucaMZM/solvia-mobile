import type { ImageSourcePropType } from 'react-native';

import type { WeatherState } from '@/src/types/recommendations';

export type WeatherHeroAssetFormat = 'png' | 'webp' | 'lottie_json' | 'rive' | 'mp4';

export type WeatherHeroAssetKind = 'image' | 'lottie' | 'rive' | 'video';

export interface WeatherHeroAssetMetadata {
  id: string;
  weatherState: WeatherState;
  filePath: string | null;
  format: WeatherHeroAssetFormat | null;
  kind: WeatherHeroAssetKind;
  source: string;
  author: string;
  license: string;
  attributionRequired: boolean;
  commercialUseAllowed: boolean;
  notes: string;
}

export interface WeatherHeroAssetEntry {
  id: string;
  state: WeatherState;
  metadata: WeatherHeroAssetMetadata;
  imageSource?: ImageSourcePropType | null;
  lottieSource?: unknown | null;
  riveSource?: unknown | null;
  videoSource?: unknown | null;
  isPlaceholder: boolean;
}

export interface WeatherHeroManifestAssetEntry {
  id: string;
  weatherState: WeatherState;
  artworkKey: string;
  metadataPath: string;
  defaultFilePath: string;
  fallbackMode: 'procedural' | 'none';
}

export interface WeatherHeroAssetManifest {
  version: string;
  description: string;
  assets: WeatherHeroManifestAssetEntry[];
}
