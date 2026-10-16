export type RuntimeEnvironment =
  | 'expo_go'
  | 'development_build'
  | 'standalone'
  | 'web'
  | 'unknown';

export type PremiumNativeCapability =
  | 'widgets'
  | 'remote_push'
  | 'live_surface'
  | 'native_storage'
  | 'background_tasks';

export interface RuntimeCapabilityMap {
  widgets: boolean;
  remote_push: boolean;
  live_surface: boolean;
  native_storage: boolean;
  background_tasks: boolean;
}

export interface RuntimeCapabilitiesSnapshot {
  environment: RuntimeEnvironment;
  appOwnership: string;
  capabilities: RuntimeCapabilityMap;
}

export interface NativeBridgeActionResult {
  status: 'applied' | 'ignored' | 'failed';
  reason?: string;
  requiresDevelopmentBuild?: boolean;
}

export type PremiumFeatureFlag =
  | 'widgets_daily_brief'
  | 'widgets_route_summary'
  | 'remote_push_advanced'
  | 'live_surface_trayecto'
  | 'storage_mmkv_native'
  | 'route_provider_native'
  | 'weather_provider_alternative';
