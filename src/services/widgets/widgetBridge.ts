import { isCapabilityAvailable } from '@/src/services/platform/runtimeCapabilities';
import { isPremiumFeatureEnabled } from '@/src/services/premium/premiumFeatureFlags';
import type { DailyBrief } from '@/src/types/briefing';
import type { NativeBridgeActionResult } from '@/src/types/platform';

export interface DailyBriefWidgetPayload {
  brief: DailyBrief;
}

export interface RouteSummaryWidgetPayload {
  originName: string;
  destinationName: string;
  departureLabel: string;
  summary: string;
  rainRiskLabel: string;
  windRiskLabel: string;
}

export interface WidgetBridge {
  id: string;
  updateDailyBriefWidget: (payload: DailyBriefWidgetPayload) => Promise<NativeBridgeActionResult>;
  updateRouteSummaryWidget: (payload: RouteSummaryWidgetPayload) => Promise<NativeBridgeActionResult>;
  clearWidgets: () => Promise<NativeBridgeActionResult>;
}

const expoGoSafeWidgetBridge: WidgetBridge = {
  id: 'expo-go-safe-noop-widgets',
  updateDailyBriefWidget: async () => ({
    status: 'ignored',
    reason: 'Widgets no disponibles en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
  updateRouteSummaryWidget: async () => ({
    status: 'ignored',
    reason: 'Widgets no disponibles en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
  clearWidgets: async () => ({
    status: 'ignored',
    reason: 'Widgets no disponibles en Expo Go.',
    requiresDevelopmentBuild: true,
  }),
};

export function getWidgetBridge(): WidgetBridge {
  const widgetsEnabledByFlag =
    isPremiumFeatureEnabled('widgets_daily_brief') ||
    isPremiumFeatureEnabled('widgets_route_summary');
  const widgetsCapableRuntime = isCapabilityAvailable('widgets');

  if (widgetsEnabledByFlag && widgetsCapableRuntime) {
    return {
      ...expoGoSafeWidgetBridge,
      id: 'native-widget-bridge-pending',
    };
  }

  return expoGoSafeWidgetBridge;
}
