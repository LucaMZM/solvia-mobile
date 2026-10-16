import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  PremiumNativeCapability,
  RuntimeCapabilitiesSnapshot,
  RuntimeEnvironment,
} from '@/src/types/platform';

function resolveRuntimeEnvironment(): RuntimeEnvironment {
  if (Platform.OS === 'web') {
    return 'web';
  }

  const ownership = (Constants.appOwnership ?? '').toLowerCase();
  if (ownership === 'expo') {
    return 'expo_go';
  }
  if (ownership === 'standalone') {
    return 'standalone';
  }
  if (ownership === 'guest') {
    return 'development_build';
  }

  return 'unknown';
}

function buildCapabilityMap(environment: RuntimeEnvironment) {
  const nativeBuild = environment === 'standalone' || environment === 'development_build';
  const nativeIOSBuild = nativeBuild && Platform.OS === 'ios';

  return {
    widgets: nativeBuild,
    remote_push: nativeBuild,
    live_surface: nativeIOSBuild,
    native_storage: nativeBuild,
    background_tasks: nativeBuild,
  };
}

export function getRuntimeCapabilities(): RuntimeCapabilitiesSnapshot {
  const environment = resolveRuntimeEnvironment();
  return {
    environment,
    appOwnership: Constants.appOwnership ?? 'unknown',
    capabilities: buildCapabilityMap(environment),
  };
}

export function isCapabilityAvailable(capability: PremiumNativeCapability): boolean {
  const runtime = getRuntimeCapabilities();
  return runtime.capabilities[capability];
}

export function requiresDevelopmentBuild(capability: PremiumNativeCapability): boolean {
  return !isCapabilityAvailable(capability);
}

export function isExpoGoRuntime(): boolean {
  return getRuntimeCapabilities().environment === 'expo_go';
}
