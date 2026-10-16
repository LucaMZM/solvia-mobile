import type { WeatherState } from '@/src/types/recommendations';

export interface HeroAssetPlacement {
  top: number;
  right: number;
  width: number;
  height: number;
}

export interface HeroAssetMotionProfile {
  driftX: number;
  driftY: number;
  pulseMin: number;
  pulseMax: number;
  driftDurationMs: number;
  pulseDurationMs: number;
  tiltDeg: number;
}

export type HeroAssetSceneKind =
  | 'sun_soft'
  | 'sun_strong'
  | 'cloud_soft'
  | 'cloud_rain'
  | 'wind_flow'
  | 'twilight'
  | 'golden'
  | 'moon';

export interface HeroAssetProfile {
  placement: HeroAssetPlacement;
  motion: HeroAssetMotionProfile;
  sceneKind: HeroAssetSceneKind;
}

const heroAssetProfilesByState: Record<WeatherState, HeroAssetProfile> = {
  pleasant_sunny: {
    sceneKind: 'sun_soft',
    placement: { top: -62, right: -70, width: 292, height: 292 },
    motion: {
      driftX: 8,
      driftY: 7,
      pulseMin: 0.97,
      pulseMax: 1.02,
      driftDurationMs: 6400,
      pulseDurationMs: 4600,
      tiltDeg: 1.2,
    },
  },
  strong_sun: {
    sceneKind: 'sun_strong',
    placement: { top: -78, right: -84, width: 320, height: 320 },
    motion: {
      driftX: 10,
      driftY: 8,
      pulseMin: 0.97,
      pulseMax: 1.04,
      driftDurationMs: 6000,
      pulseDurationMs: 4200,
      tiltDeg: 1.6,
    },
  },
  soft_cloudy: {
    sceneKind: 'cloud_soft',
    placement: { top: 8, right: -26, width: 278, height: 194 },
    motion: {
      driftX: 7,
      driftY: 5,
      pulseMin: 0.985,
      pulseMax: 1.012,
      driftDurationMs: 7000,
      pulseDurationMs: 5200,
      tiltDeg: 0.8,
    },
  },
  rainy: {
    sceneKind: 'cloud_rain',
    placement: { top: 4, right: -30, width: 286, height: 214 },
    motion: {
      driftX: 6,
      driftY: 4,
      pulseMin: 0.99,
      pulseMax: 1.015,
      driftDurationMs: 7000,
      pulseDurationMs: 5400,
      tiltDeg: 0.6,
    },
  },
  windy: {
    sceneKind: 'wind_flow',
    placement: { top: 0, right: -30, width: 294, height: 220 },
    motion: {
      driftX: 11,
      driftY: 4,
      pulseMin: 0.985,
      pulseMax: 1.018,
      driftDurationMs: 5200,
      pulseDurationMs: 4400,
      tiltDeg: 1.8,
    },
  },
  cool_evening: {
    sceneKind: 'twilight',
    placement: { top: -8, right: -42, width: 270, height: 236 },
    motion: {
      driftX: 6,
      driftY: 6,
      pulseMin: 0.985,
      pulseMax: 1.012,
      driftDurationMs: 7600,
      pulseDurationMs: 6200,
      tiltDeg: 0.5,
    },
  },
  golden_hour: {
    sceneKind: 'golden',
    placement: { top: -18, right: -54, width: 296, height: 250 },
    motion: {
      driftX: 9,
      driftY: 7,
      pulseMin: 0.98,
      pulseMax: 1.022,
      driftDurationMs: 6500,
      pulseDurationMs: 5000,
      tiltDeg: 1.2,
    },
  },
  night_clear: {
    sceneKind: 'moon',
    placement: { top: -34, right: -20, width: 224, height: 224 },
    motion: {
      driftX: 5,
      driftY: 5,
      pulseMin: 0.99,
      pulseMax: 1.015,
      driftDurationMs: 7800,
      pulseDurationMs: 6400,
      tiltDeg: 0.5,
    },
  },
};

export function getHeroAssetProfile(state: WeatherState): HeroAssetProfile {
  return heroAssetProfilesByState[state] ?? heroAssetProfilesByState.pleasant_sunny;
}
