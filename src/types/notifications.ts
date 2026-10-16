export type NotificationPermissionStatus = 'unknown' | 'granted' | 'denied';

export type NotificationCategory =
  | 'daily_brief'
  | 'weather_adaptive'
  | 'routine'
  | 'route_trip';

export interface NotificationCategoryPreferences {
  daily_brief: boolean;
  weather_adaptive: boolean;
  routine: boolean;
  route_trip: boolean;
}

export interface DecisionNotificationDraft {
  dedupeKey: string;
  category: NotificationCategory;
  title: string;
  body: string;
  triggerAtISO: string;
}

export interface NotificationSyncResult {
  scheduled: number;
  kept: number;
  canceled: number;
}
