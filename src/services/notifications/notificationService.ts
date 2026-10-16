import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import {
  buildAdaptiveWeatherChangeDrafts,
  buildRouteTripNotificationDraft,
  buildRoutineNotificationDrafts,
} from '@/src/features/notifications/notificationDraftBuilders';
import type { DailyBriefMoment } from '@/src/types/briefing';
import type { RecommendationBundle } from '@/src/types/recommendations';
import type {
  DecisionNotificationDraft,
  NotificationCategory,
  NotificationCategoryPreferences,
  NotificationPermissionStatus,
  NotificationSyncResult,
} from '@/src/types/notifications';
import type { UserRoutine } from '@/src/types/routines';
import type { SelectedLocationRef } from '@/src/types/location';
import type { CarTrayectoAnalysis } from '@/src/types/trayecto';
import type { WeatherSnapshot } from '@/src/types/weather';
import {
  readNotificationRegistry,
  type StoredNotificationEntry,
  type StoredNotificationRegistry,
  writeNotificationRegistry,
} from '@/src/services/notifications/notificationRegistry';
import {
  hasSameScheduledContent,
  normalizeDecisionDrafts,
} from '@/src/services/notifications/notificationSyncPolicy';
import {
  getRemotePushProvider,
  type RemotePushRegistrationInput,
  type RemotePushSyncResult,
} from '@/src/services/notifications/remotePushProvider';

const notificationsRuntimeEnabled = Platform.OS !== 'web';

if (notificationsRuntimeEnabled) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Ignore unsupported notification handlers in Expo Go edge-cases.
  }
}

function toPermissionStatus(settings: Notifications.NotificationPermissionsStatus): NotificationPermissionStatus {
  if (settings.granted) {
    return 'granted';
  }

  const maybeDenied =
    settings.status === Notifications.PermissionStatus.DENIED ||
    settings.canAskAgain === false;
  if (maybeDenied) {
    return 'denied';
  }

  return 'unknown';
}

async function scheduleOneTimeDraft(draft: DecisionNotificationDraft): Promise<string | null> {
  if (!notificationsRuntimeEnabled) {
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: draft.title,
        body: draft.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(draft.triggerAtISO),
      },
    });
  } catch {
    return null;
  }
}

async function cancelScheduledById(scheduledId: string): Promise<boolean> {
  if (!notificationsRuntimeEnabled) {
    return false;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(scheduledId);
    return true;
  } catch {
    return false;
  }
}

async function cancelRegistryEntries(
  registry: StoredNotificationRegistry,
  shouldRemove: (entry: StoredNotificationEntry) => boolean,
): Promise<number> {
  let canceled = 0;

  for (const [dedupeKey, entry] of Object.entries(registry.items)) {
    if (!shouldRemove(entry)) {
      continue;
    }
    await cancelScheduledById(entry.scheduledId);
    delete registry.items[dedupeKey];
    canceled += 1;
  }

  return canceled;
}

function resolveCategoriesToSync(params: {
  normalizedDrafts: DecisionNotificationDraft[];
  enabledCategories: NotificationCategoryPreferences;
  categoriesToForceSync?: NotificationCategory[];
}): Set<NotificationCategory> {
  const categories = new Set(params.categoriesToForceSync ?? []);

  params.normalizedDrafts.forEach((draft) => {
    categories.add(draft.category);
  });

  (Object.keys(params.enabledCategories) as NotificationCategory[]).forEach((category) => {
    if (!params.enabledCategories[category]) {
      categories.add(category);
    }
  });

  return categories;
}

async function syncDrafts(params: {
  drafts: DecisionNotificationDraft[];
  enabledCategories: NotificationCategoryPreferences;
  categoriesToForceSync?: NotificationCategory[];
  requestPermissionIfNeeded?: boolean;
}): Promise<NotificationSyncResult> {
  if (!notificationsRuntimeEnabled) {
    return { scheduled: 0, kept: 0, canceled: 0 };
  }

  const normalizedDrafts = normalizeDecisionDrafts(
    params.drafts.filter((draft) => params.enabledCategories[draft.category]),
  );
  const categoriesToSync = resolveCategoriesToSync({
    normalizedDrafts,
    enabledCategories: params.enabledCategories,
    categoriesToForceSync: params.categoriesToForceSync,
  });
  const permissionGranted = params.requestPermissionIfNeeded
    ? await requestNotificationPermission()
    : (await getNotificationPermissionStatus()) === 'granted';
  if (!permissionGranted) {
    if (categoriesToSync.size === 0) {
      return { scheduled: 0, kept: 0, canceled: 0 };
    }

    const registry = await readNotificationRegistry();
    const canceled = await cancelRegistryEntries(registry, (entry) => categoriesToSync.has(entry.category));
    await writeNotificationRegistry(registry);
    return { scheduled: 0, kept: 0, canceled };
  }

  const nextKeys = new Set(normalizedDrafts.map((draft) => draft.dedupeKey));
  const registry = await readNotificationRegistry();
  let scheduled = 0;
  let kept = 0;
  let canceled = await cancelRegistryEntries(
    registry,
    (entry) => categoriesToSync.has(entry.category) && !nextKeys.has(entry.dedupeKey),
  );

  for (const draft of normalizedDrafts) {
    const existing = registry.items[draft.dedupeKey];
    if (existing && hasSameScheduledContent(existing, draft)) {
      kept += 1;
      continue;
    }

    if (existing) {
      await cancelScheduledById(existing.scheduledId);
      delete registry.items[draft.dedupeKey];
      canceled += 1;
    }

    const scheduledId = await scheduleOneTimeDraft(draft);
    if (!scheduledId) {
      continue;
    }

    registry.items[draft.dedupeKey] = {
      dedupeKey: draft.dedupeKey,
      category: draft.category,
      scheduledId,
      triggerAtISO: draft.triggerAtISO,
      title: draft.title,
      body: draft.body,
    };
    scheduled += 1;
  }

  await writeNotificationRegistry(registry);
  return { scheduled, kept, canceled };
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!notificationsRuntimeEnabled) {
    return 'denied';
  }

  try {
    const status = await Notifications.getPermissionsAsync();
    return toPermissionStatus(status);
  } catch {
    return 'unknown';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsRuntimeEnabled) {
    return false;
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function requestNotificationPermissionFlow(): Promise<NotificationPermissionStatus> {
  if (!notificationsRuntimeEnabled) {
    return 'denied';
  }

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return 'granted';
    }

    const requested = await Notifications.requestPermissionsAsync();
    return toPermissionStatus(requested);
  } catch {
    return 'unknown';
  }
}

export async function openNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Ignore unsupported settings deep-link in constrained runtimes.
  }
}

export async function scheduleDailySunscreenReminder(): Promise<string | null> {
  if (!notificationsRuntimeEnabled) {
    return null;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Solvía',
        body: 'Antes de salir, revisa el índice UV y si necesitas protección.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 11,
        minute: 0,
      },
    });
  } catch {
    return null;
  }
}

interface DailyBriefScheduleInput {
  cityName: string;
  moment: DailyBriefMoment;
  summaryLine: string;
  hour: number;
  minute: number;
}

export async function cancelScheduledNotification(id: string | null): Promise<void> {
  if (!notificationsRuntimeEnabled || !id) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Ignore unsupported cancellation edge-cases.
  }
}

export async function scheduleDailyBriefNotification(
  input: DailyBriefScheduleInput,
): Promise<string | null> {
  if (!notificationsRuntimeEnabled) {
    return null;
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return null;
  }

  const safeHour = Math.max(0, Math.min(23, Math.round(input.hour)));
  const safeMinute = Math.max(0, Math.min(59, Math.round(input.minute)));

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Solvía · Resumen diario',
        body: `${input.cityName}: ${input.summaryLine}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: safeHour,
        minute: safeMinute,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelDecisionNotificationsByCategory(
  category: NotificationCategory,
): Promise<number> {
  if (!notificationsRuntimeEnabled) {
    return 0;
  }

  const registry = await readNotificationRegistry();
  const hasEntries = Object.values(registry.items).some((entry) => entry.category === category);
  if (!hasEntries) {
    return 0;
  }

  const canceled = await cancelRegistryEntries(registry, (entry) => entry.category === category);
  await writeNotificationRegistry(registry);
  return canceled;
}

export async function syncAdaptiveAndRoutineNotifications(input: {
  snapshot: WeatherSnapshot;
  recommendations: RecommendationBundle;
  routines: UserRoutine[];
  selectedLocation: SelectedLocationRef;
  enabledCategories: NotificationCategoryPreferences;
}): Promise<NotificationSyncResult> {
  const adaptiveDrafts = input.enabledCategories.weather_adaptive
    ? buildAdaptiveWeatherChangeDrafts({
        snapshot: input.snapshot,
        recommendations: input.recommendations,
      })
    : [];

  const routineDrafts = input.enabledCategories.routine
    ? buildRoutineNotificationDrafts({
        snapshot: input.snapshot,
        recommendations: input.recommendations,
        routines: input.routines,
        selectedLocation: input.selectedLocation,
      })
    : [];

  return syncDrafts({
    drafts: [...adaptiveDrafts, ...routineDrafts],
    enabledCategories: input.enabledCategories,
    categoriesToForceSync: ['weather_adaptive', 'routine'],
    requestPermissionIfNeeded: false,
  });
}

export async function syncRouteTripNotification(input: {
  analysis: CarTrayectoAnalysis;
  departureISO: string;
  originName: string;
  destinationName: string;
  enabledCategories: NotificationCategoryPreferences;
}): Promise<NotificationSyncResult> {
  const draft = input.enabledCategories.route_trip
    ? buildRouteTripNotificationDraft({
        analysis: input.analysis,
        departureISO: input.departureISO,
        originName: input.originName,
        destinationName: input.destinationName,
      })
    : null;

  return syncDrafts({
    drafts: draft ? [draft] : [],
    enabledCategories: input.enabledCategories,
    categoriesToForceSync: ['route_trip'],
    requestPermissionIfNeeded: false,
  });
}

export async function syncRemotePushRegistration(
  input: RemotePushRegistrationInput,
): Promise<RemotePushSyncResult> {
  const provider = getRemotePushProvider();
  return provider.syncRegistration(input);
}
