import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { NotificationCategory } from '@/src/types/notifications';
import type { PlanType } from '@/src/types/planning';
import type { ActivityId } from '@/src/types/recommendations';
import type { TrayectoActivityType, TrayectoMode } from '@/src/types/trayecto';

export type AppIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const appIcons = {
  tabs: {
    hoy: 'calendar-today',
    trayecto: 'car-connected',
    sol: 'white-balance-sunny',
    ropa: 'hanger',
    perfil: 'account-circle-outline',
  } as const satisfies Record<string, AppIconName>,
  modules: {
    solUv: 'white-balance-sunny',
    viento: 'weather-windy',
    ropa: 'hanger',
    trayecto: 'car-connected',
    resumenDiario: 'calendar-clock-outline',
    rutinas: 'calendar-check-outline',
    ubicaciones: 'map-marker-radius-outline',
    notificaciones: 'bell-cog-outline',
    modoPlan: 'compass-rose',
  } as const satisfies Record<string, AppIconName>,
  activities: {
    tomar_sol: 'white-balance-sunny',
    caminar: 'walk',
    terraza: 'silverware-fork-knife',
    running_suave: 'run-fast',
  } as const satisfies Record<ActivityId, AppIconName>,
  trayectoModes: {
    paseo_local: 'walk',
    coche_ruta: 'highway',
  } as const satisfies Record<TrayectoMode, AppIconName>,
  trayectoActivities: {
    paseo: 'walk',
    correr_suave: 'run-fast',
    paseo_perro: 'dog-side',
    terraza: 'silverware-fork-knife',
  } as const satisfies Record<TrayectoActivityType, AppIconName>,
  planTypes: {
    caminar: 'walk',
    correr_suave: 'run-fast',
    terraza: 'silverware-fork-knife',
    piscina: 'pool',
    playa: 'beach',
    tomar_sol: 'white-balance-sunny',
    paseo_perro: 'dog-side',
    trayecto: 'car-connected',
  } as const satisfies Record<PlanType, AppIconName>,
  notificationCategories: {
    daily_brief: 'calendar-clock-outline',
    weather_adaptive: 'weather-partly-rainy',
    routine: 'calendar-check-outline',
    route_trip: 'car-clock',
  } as const satisfies Record<NotificationCategory, AppIconName>,
} as const;
