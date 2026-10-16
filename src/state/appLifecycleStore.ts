import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appStateStorage } from '@/src/services/storage/persistedStorage';

export const ONBOARDING_VERSION = 1;

interface AppLifecycleState {
  onboardingVersionCompleted: number;
  onboardingCompletedAtIso: string | null;
  hasCompletedFirstRunLoad: boolean;
  locationPromptDeferred: boolean;
  markOnboardingCompleted: () => void;
  markFirstRunLoadCompleted: () => void;
  deferLocationPrompt: () => void;
  clearLocationPromptDeferral: () => void;
}

export const useAppLifecycleStore = create<AppLifecycleState>()(
  persist(
    (set) => ({
      onboardingVersionCompleted: 0,
      onboardingCompletedAtIso: null,
      hasCompletedFirstRunLoad: false,
      locationPromptDeferred: false,
      markOnboardingCompleted: () =>
        set({
          onboardingVersionCompleted: ONBOARDING_VERSION,
          onboardingCompletedAtIso: new Date().toISOString(),
        }),
      markFirstRunLoadCompleted: () =>
        set({
          hasCompletedFirstRunLoad: true,
        }),
      deferLocationPrompt: () =>
        set({
          locationPromptDeferred: true,
        }),
      clearLocationPromptDeferral: () =>
        set({
          locationPromptDeferred: false,
        }),
    }),
    {
      name: 'solvia-app-lifecycle',
      storage: createJSONStorage(() => appStateStorage),
    },
  ),
);

export function useAppLifecycleHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useAppLifecycleStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useAppLifecycleStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  return hydrated;
}
