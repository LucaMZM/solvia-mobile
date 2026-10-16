import { getRuntimeCapabilities } from '@/src/services/platform/runtimeCapabilities';
import { getPremiumFeatureFlags } from '@/src/services/premium/premiumFeatureFlags';
import { getRoutingProviderRuntimeInfo } from '@/src/services/routing/routingService';
import { storageRuntimeInfo } from '@/src/services/storage/appStorage';
import { getWeatherProviderRuntimeInfo } from '@/src/services/weather/weatherService';

export interface PremiumRuntimeSnapshot {
  capabilities: ReturnType<typeof getRuntimeCapabilities>;
  featureFlags: ReturnType<typeof getPremiumFeatureFlags>;
  storage: typeof storageRuntimeInfo;
  routingProvider: ReturnType<typeof getRoutingProviderRuntimeInfo>;
  weatherProvider: ReturnType<typeof getWeatherProviderRuntimeInfo>;
}

export function getPremiumRuntimeSnapshot(): PremiumRuntimeSnapshot {
  return {
    capabilities: getRuntimeCapabilities(),
    featureFlags: getPremiumFeatureFlags(),
    storage: storageRuntimeInfo,
    routingProvider: getRoutingProviderRuntimeInfo(),
    weatherProvider: getWeatherProviderRuntimeInfo(),
  };
}
