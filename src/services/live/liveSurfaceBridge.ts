import { isCapabilityAvailable } from '@/src/services/platform/runtimeCapabilities';
import { isPremiumFeatureEnabled } from '@/src/services/premium/premiumFeatureFlags';
import type { NativeBridgeActionResult } from '@/src/types/platform';

export interface TrayectoLiveSurfacePayload {
  title: string;
  summary: string;
  departureLabel: string;
  arrivalLabel: string;
}

export interface LiveSurfaceBridge {
  id: string;
  startTrayectoSurface: (payload: TrayectoLiveSurfacePayload) => Promise<NativeBridgeActionResult>;
  updateTrayectoSurface: (payload: TrayectoLiveSurfacePayload) => Promise<NativeBridgeActionResult>;
  endTrayectoSurface: () => Promise<NativeBridgeActionResult>;
}

const expoGoSafeLiveSurfaceBridge: LiveSurfaceBridge = {
  id: 'expo-go-safe-noop-live-surface',
  startTrayectoSurface: async () => ({
    status: 'ignored',
    reason: 'Superficie en vivo no disponible en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
  updateTrayectoSurface: async () => ({
    status: 'ignored',
    reason: 'Superficie en vivo no disponible en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
  endTrayectoSurface: async () => ({
    status: 'ignored',
    reason: 'Superficie en vivo no disponible en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
};

export function getLiveSurfaceBridge(): LiveSurfaceBridge {
  const enabled = isPremiumFeatureEnabled('live_surface_trayecto');
  const capable = isCapabilityAvailable('live_surface');

  if (enabled && capable) {
    return {
      ...expoGoSafeLiveSurfaceBridge,
      id: 'native-live-surface-bridge-pending',
    };
  }

  return expoGoSafeLiveSurfaceBridge;
}
