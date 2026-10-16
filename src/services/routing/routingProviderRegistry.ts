import { fallbackRoutingProvider } from '@/src/services/routing/fallbackRoutingProvider';
import type { RoutingProvider } from '@/src/services/routing/routingProvider';

export type RoutingProviderSelection = 'fallback' | 'mapbox' | 'google' | 'openrouteservice';

export interface RoutingProviderRuntimeInfo {
  requested: string;
  active: RoutingProviderSelection;
  usingFallback: boolean;
  note?: string;
}

interface RegisteredRoutingProvider {
  provider: RoutingProvider;
  available: boolean;
  fallbackNote?: string;
}

const routingRegistry: Record<RoutingProviderSelection, RegisteredRoutingProvider> = {
  fallback: {
    provider: fallbackRoutingProvider,
    available: true,
  },
  mapbox: {
    provider: fallbackRoutingProvider,
    available: false,
    fallbackNote: 'Proveedor Mapbox listo para fase premium (build de desarrollo).',
  },
  google: {
    provider: fallbackRoutingProvider,
    available: false,
    fallbackNote: 'Proveedor Google listo para fase premium (build de desarrollo).',
  },
  openrouteservice: {
    provider: fallbackRoutingProvider,
    available: false,
    fallbackNote: 'Proveedor OpenRouteService listo para fase premium (build de desarrollo).',
  },
};

function isRoutingProviderSelection(value: string): value is RoutingProviderSelection {
  return value in routingRegistry;
}

export function resolveRoutingProvider(requestedRaw: string): {
  provider: RoutingProvider;
  runtime: RoutingProviderRuntimeInfo;
} {
  const requested = requestedRaw.trim().toLowerCase();
  const selection: RoutingProviderSelection = isRoutingProviderSelection(requested) ? requested : 'fallback';
  const resolved = routingRegistry[selection];

  if (resolved.available) {
    return {
      provider: resolved.provider,
      runtime: {
        requested: requestedRaw,
        active: selection,
        usingFallback: selection === 'fallback',
      },
    };
  }

  return {
    provider: fallbackRoutingProvider,
    runtime: {
      requested: requestedRaw,
      active: 'fallback',
      usingFallback: true,
      note: resolved.fallbackNote,
    },
  };
}
