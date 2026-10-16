import type { RoutePlanningInput } from '@/src/services/routing/routingProvider';
import { resolveRoutingProvider } from '@/src/services/routing/routingProviderRegistry';
import type { RoutePlanResult } from '@/src/types/trayecto';

const configuredProvider = (process.env.EXPO_PUBLIC_ROUTING_PROVIDER ?? 'fallback').trim().toLowerCase();
const resolvedRouting = resolveRoutingProvider(configuredProvider);

export function getRoutingProviderRuntimeInfo() {
  return resolvedRouting.runtime;
}

export async function planRoute(input: RoutePlanningInput): Promise<RoutePlanResult> {
  return resolvedRouting.provider.planRoute(input);
}
