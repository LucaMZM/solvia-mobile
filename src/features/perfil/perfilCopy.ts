import type { ThermalProfile } from '@/src/types/recommendations';
import type { NotificationCategory } from '@/src/types/notifications';

export const thermalProfiles: readonly ThermalProfile[] = ['friolero', 'normal', 'caluroso'];

export const thermalProfileLabels: Record<ThermalProfile, string> = {
  friolero: 'Friolero',
  normal: 'Normal',
  caluroso: 'Caluroso',
};

export const notificationCategoryLabels: Record<NotificationCategory, string> = {
  daily_brief: 'resumen diario',
  weather_adaptive: 'cambios del tiempo',
  routine: 'rutinas personales',
  route_trip: 'trayectos',
};
