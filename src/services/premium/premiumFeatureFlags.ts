import type { PremiumFeatureFlag } from '@/src/types/platform';

export type PremiumFeatureFlagMap = Record<PremiumFeatureFlag, boolean>;

const premiumFlagEnvMap: Record<PremiumFeatureFlag, string> = {
  widgets_daily_brief: 'EXPO_PUBLIC_PREMIUM_WIDGETS_DAILY_BRIEF',
  widgets_route_summary: 'EXPO_PUBLIC_PREMIUM_WIDGETS_ROUTE_SUMMARY',
  remote_push_advanced: 'EXPO_PUBLIC_PREMIUM_REMOTE_PUSH_ADVANCED',
  live_surface_trayecto: 'EXPO_PUBLIC_PREMIUM_LIVE_SURFACE_TRAYECTO',
  storage_mmkv_native: 'EXPO_PUBLIC_PREMIUM_STORAGE_MMKV_NATIVE',
  route_provider_native: 'EXPO_PUBLIC_PREMIUM_ROUTE_PROVIDER_NATIVE',
  weather_provider_alternative: 'EXPO_PUBLIC_PREMIUM_WEATHER_PROVIDER_ALTERNATIVE',
};

const premiumFlagDefaults: PremiumFeatureFlagMap = {
  widgets_daily_brief: false,
  widgets_route_summary: false,
  remote_push_advanced: false,
  live_surface_trayecto: false,
  storage_mmkv_native: false,
  route_provider_native: false,
  weather_provider_alternative: false,
};

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return null;
}

export function getPremiumFeatureFlags(): PremiumFeatureFlagMap {
  return (Object.keys(premiumFlagDefaults) as PremiumFeatureFlag[]).reduce<PremiumFeatureFlagMap>(
    (acc, flag) => {
      const envValue = parseBooleanEnv(process.env[premiumFlagEnvMap[flag]]);
      acc[flag] = envValue ?? premiumFlagDefaults[flag];
      return acc;
    },
    { ...premiumFlagDefaults },
  );
}

export function isPremiumFeatureEnabled(flag: PremiumFeatureFlag): boolean {
  return getPremiumFeatureFlags()[flag];
}
