import type { ThermalProfile } from '@/src/types/recommendations';
import type { RoutePlanResult } from '@/src/types/trayecto';
import type { WeatherSnapshot } from '@/src/types/weather';

export interface RouteWindowContext {
  routePlan: RoutePlanResult;
  segmentSnapshots: Record<string, WeatherSnapshot>;
}

export interface BuildBestNextWindowsInput {
  snapshot: WeatherSnapshot;
  thermalProfile: ThermalProfile;
  routeContext?: RouteWindowContext;
}
