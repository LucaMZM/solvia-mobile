import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStateStorage } from '@/src/services/storage/persistedStorage';
import type { DailyBriefMoment } from '@/src/types/briefing';
import type { ThermalProfile } from '@/src/types/recommendations';
import type { PlanType } from '@/src/types/planning';
import type {
  NotificationCategory,
  NotificationCategoryPreferences,
  NotificationPermissionStatus,
} from '@/src/types/notifications';

interface PreferencesState {
  sunscreenReminderEnabled: boolean;
  preferredHourlyWindow: number;
  thermalProfile: ThermalProfile;
  dailyBriefEnabled: boolean;
  dailyBriefMoment: DailyBriefMoment;
  dailyBriefHour: number;
  dailyBriefMinute: number;
  dailyBriefNotificationId: string | null;
  notificationPermissionStatus: NotificationPermissionStatus;
  notificationCategories: NotificationCategoryPreferences;
  planModeType: PlanType;
  setSunscreenReminderEnabled: (enabled: boolean) => void;
  setPreferredHourlyWindow: (hours: number) => void;
  setThermalProfile: (profile: ThermalProfile) => void;
  setDailyBriefEnabled: (enabled: boolean) => void;
  setDailyBriefMoment: (moment: DailyBriefMoment) => void;
  setDailyBriefTime: (hour: number, minute: number) => void;
  setDailyBriefNotificationId: (id: string | null) => void;
  setNotificationPermissionStatus: (status: NotificationPermissionStatus) => void;
  setNotificationCategoryEnabled: (category: NotificationCategory, enabled: boolean) => void;
  setPlanModeType: (planType: PlanType) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sunscreenReminderEnabled: true,
      preferredHourlyWindow: 4,
      thermalProfile: 'normal',
      dailyBriefEnabled: false,
      dailyBriefMoment: 'manana',
      dailyBriefHour: 7,
      dailyBriefMinute: 30,
      dailyBriefNotificationId: null,
      notificationPermissionStatus: 'unknown',
      notificationCategories: {
        daily_brief: true,
        weather_adaptive: true,
        routine: true,
        route_trip: true,
      },
      planModeType: 'caminar',
      setSunscreenReminderEnabled: (enabled) => set({ sunscreenReminderEnabled: enabled }),
      setPreferredHourlyWindow: (hours) => set({ preferredHourlyWindow: Math.max(3, Math.min(8, hours)) }),
      setThermalProfile: (profile) => set({ thermalProfile: profile }),
      setDailyBriefEnabled: (enabled) =>
        set((state) => ({
          dailyBriefEnabled: enabled,
          notificationCategories: {
            ...state.notificationCategories,
            daily_brief: enabled,
          },
        })),
      setDailyBriefMoment: (moment) => set({ dailyBriefMoment: moment }),
      setDailyBriefTime: (hour, minute) =>
        set({
          dailyBriefHour: Math.max(0, Math.min(23, Math.round(hour))),
          dailyBriefMinute: Math.max(0, Math.min(59, Math.round(minute))),
        }),
      setDailyBriefNotificationId: (id) => set({ dailyBriefNotificationId: id }),
      setNotificationPermissionStatus: (status) => set({ notificationPermissionStatus: status }),
      setNotificationCategoryEnabled: (category, enabled) =>
        set((state) => ({
          notificationCategories: {
            ...state.notificationCategories,
            [category]: enabled,
          },
          dailyBriefEnabled:
            category === 'daily_brief' ? enabled : state.dailyBriefEnabled,
        })),
      setPlanModeType: (planModeType) => set({ planModeType }),
    }),
    {
      name: 'solvia-preferences',
      storage: createJSONStorage(() => appStateStorage),
    },
  ),
);
