import { planTypes } from '@/src/features/planning/catalog';
import { bestWindowFromHourly } from '@/src/features/planning/hourlyWindowEngine';
import { bestRouteWindow } from '@/src/features/planning/routeWindowEngine';
import type { BuildBestNextWindowsInput, RouteWindowContext } from '@/src/features/planning/windowTypes';
import type { ThermalProfile } from '@/src/types/recommendations';
import type { PlanType, PlanWindowResult } from '@/src/types/planning';
import type { WeatherSnapshot } from '@/src/types/weather';

export function getBestNextWindowForPlan(params: {
  snapshot: WeatherSnapshot;
  thermalProfile: ThermalProfile;
  planType: PlanType;
  routeContext?: RouteWindowContext;
}): PlanWindowResult {
  if (params.planType === 'trayecto' && params.routeContext) {
    return bestRouteWindow({
      snapshot: params.snapshot,
      routeContext: params.routeContext,
    });
  }

  return bestWindowFromHourly({
    snapshot: params.snapshot,
    thermalProfile: params.thermalProfile,
    planType: params.planType,
  });
}

export function buildBestNextWindows(input: BuildBestNextWindowsInput): Record<PlanType, PlanWindowResult> {
  return Object.fromEntries(
    planTypes.map((planType) => [
      planType,
      getBestNextWindowForPlan({
        snapshot: input.snapshot,
        thermalProfile: input.thermalProfile,
        planType,
        routeContext: planType === 'trayecto' ? input.routeContext : undefined,
      }),
    ]),
  ) as Record<PlanType, PlanWindowResult>;
}
