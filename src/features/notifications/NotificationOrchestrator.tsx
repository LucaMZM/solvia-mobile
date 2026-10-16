import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';

import {
  cancelDecisionNotificationsByCategory,
  getNotificationPermissionStatus,
  syncAdaptiveAndRoutineNotifications,
} from '@/src/services/notifications/notificationService';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { useLocationStore } from '@/src/state/locationStore';
import { usePreferencesStore } from '@/src/state/preferencesStore';
import { useRoutinesStore } from '@/src/state/routinesStore';
import type { SelectedLocationRef } from '@/src/types/location';
import type { UserRoutine } from '@/src/types/routines';

const MIN_SYNC_INTERVAL_MS = 2 * 60_000;

function buildSelectedLocationKey(selectedLocation: SelectedLocationRef): string {
  return selectedLocation.kind === 'saved' ? `saved:${selectedLocation.id}` : 'current';
}

function buildEnabledRoutinesKey(routines: UserRoutine[]): string {
  return routines
    .filter((routine) => routine.enabled)
    .map((routine) => `${routine.id}:${routine.preferredMoment}:${routine.locationContext.kind}`)
    .join('|');
}

export function NotificationOrchestrator() {
  const briefing = useWeatherBriefing();
  const routines = useRoutinesStore((state) => state.routines);
  const selectedLocation = useLocationStore((state) => state.selectedLocation);
  const notificationPermissionStatus = usePreferencesStore((state) => state.notificationPermissionStatus);
  const notificationCategories = usePreferencesStore((state) => state.notificationCategories);
  const setNotificationPermissionStatus = usePreferencesStore((state) => state.setNotificationPermissionStatus);

  const lastSyncKeyRef = useRef<string | null>(null);
  const lastSyncAtRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const refreshPermissionStatus = async () => {
      const status = await getNotificationPermissionStatus();
      if (!mounted) {
        return;
      }
      setNotificationPermissionStatus(status);
    };

    void refreshPermissionStatus();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshPermissionStatus();
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [setNotificationPermissionStatus]);

  useEffect(() => {
    if (notificationCategories.weather_adaptive) {
      return;
    }
    lastSyncKeyRef.current = null;
    void cancelDecisionNotificationsByCategory('weather_adaptive');
  }, [notificationCategories.weather_adaptive]);

  useEffect(() => {
    if (notificationCategories.routine) {
      return;
    }
    lastSyncKeyRef.current = null;
    void cancelDecisionNotificationsByCategory('routine');
  }, [notificationCategories.routine]);

  const syncKey = useMemo(() => {
    if (!briefing.snapshot || !briefing.recommendations) {
      return null;
    }

    const snapshot = briefing.snapshot;
    const recommendations = briefing.recommendations;
    const weatherKey = [
      snapshot.cityName,
      snapshot.current.timeISO.slice(0, 13),
      Math.round(snapshot.current.uvIndex),
      Math.round(snapshot.current.precipitationProbability / 10),
      Math.round(snapshot.current.windSpeedKmh),
      recommendations.state,
      recommendations.forecastConfidence.tone,
      recommendations.bestNextWindow.startISO.slice(0, 16),
    ].join(':');

    const categoryKey = `${notificationCategories.weather_adaptive ? 1 : 0}${notificationCategories.routine ? 1 : 0}`;
    const routinesKey = buildEnabledRoutinesKey(routines);

    return [buildSelectedLocationKey(selectedLocation), weatherKey, routinesKey, categoryKey].join('|');
  }, [
    briefing.recommendations,
    briefing.snapshot,
    notificationCategories.routine,
    notificationCategories.weather_adaptive,
    routines,
    selectedLocation,
  ]);

  useEffect(() => {
    if (!syncKey || !briefing.snapshot || !briefing.recommendations) {
      return;
    }

    if (!notificationCategories.weather_adaptive && !notificationCategories.routine) {
      return;
    }

    if (notificationPermissionStatus !== 'granted') {
      return;
    }

    const now = Date.now();
    if (lastSyncKeyRef.current === syncKey && now - lastSyncAtRef.current < MIN_SYNC_INTERVAL_MS) {
      return;
    }

    lastSyncKeyRef.current = syncKey;
    lastSyncAtRef.current = now;

    void syncAdaptiveAndRoutineNotifications({
      snapshot: briefing.snapshot,
      recommendations: briefing.recommendations,
      routines,
      selectedLocation,
      enabledCategories: notificationCategories,
    });
  }, [
    briefing.recommendations,
    briefing.snapshot,
    notificationCategories,
    notificationPermissionStatus,
    routines,
    selectedLocation,
    syncKey,
  ]);

  return null;
}
