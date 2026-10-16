import type { RouteCityPoint, RoutePlanResult } from '@/src/types/trayecto';

export interface RoutePlanningInput {
  origin: RouteCityPoint;
  destination: RouteCityPoint;
  stops?: RouteCityPoint[];
}

export interface RoutingProvider {
  id: string;
  planRoute: (input: RoutePlanningInput) => Promise<RoutePlanResult>;
}
