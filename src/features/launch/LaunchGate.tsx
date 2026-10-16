import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import { SolviaFirstRunLoading } from '@/src/features/launch/components/SolviaFirstRunLoading';
import { SolviaLaunchSplash } from '@/src/features/launch/components/SolviaLaunchSplash';
import { SolviaLightweightOnboarding } from '@/src/features/launch/components/SolviaLightweightOnboarding';
import { resolveLaunchStateFromLocalTime, resolveLaunchVisual } from '@/src/features/launch/launchVisual';
import {
  ONBOARDING_VERSION,
  useAppLifecycleHydrated,
  useAppLifecycleStore,
} from '@/src/state/appLifecycleStore';
import { useLocationStore } from '@/src/state/locationStore';
import {
  getCurrentDeviceLocation,
  isLocationPermissionDeniedError,
} from '@/src/services/location/locationService';

const SPLASH_MIN_MS = 960;

export function LaunchGate({ children }: PropsWithChildren) {
  const hydrated = useAppLifecycleHydrated();
  const onboardingVersionCompleted = useAppLifecycleStore((state) => state.onboardingVersionCompleted);
  const hasCompletedFirstRunLoad = useAppLifecycleStore((state) => state.hasCompletedFirstRunLoad);
  const markOnboardingCompleted = useAppLifecycleStore((state) => state.markOnboardingCompleted);
  const markFirstRunLoadCompleted = useAppLifecycleStore((state) => state.markFirstRunLoadCompleted);
  const deferLocationPrompt = useAppLifecycleStore((state) => state.deferLocationPrompt);
  const clearLocationPromptDeferral = useAppLifecycleStore((state) => state.clearLocationPromptDeferral);
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);
  const [splashElapsed, setSplashElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashElapsed(true);
    }, SPLASH_MIN_MS);

    return () => clearTimeout(timeout);
  }, []);

  const launchState = resolveLaunchStateFromLocalTime();
  const launchVisual = resolveLaunchVisual(launchState);
  const needsOnboarding = onboardingVersionCompleted < ONBOARDING_VERSION;

  const requestLocationPermission = async (): Promise<'granted' | 'denied' | 'error'> => {
    try {
      clearLocationPromptDeferral();
      const location = await getCurrentDeviceLocation();
      setCurrentLocation(location);
      return 'granted';
    } catch (error) {
      if (isLocationPermissionDeniedError(error)) {
        clearLocationPromptDeferral();
        return 'denied';
      }
      return 'error';
    }
  };

  if (!hydrated || !splashElapsed) {
    return (
      <SolviaLaunchSplash
        accentColor={launchVisual.accentColor}
        gradient={launchVisual.gradient}
        weatherState={launchVisual.weatherState}
      />
    );
  }

  if (needsOnboarding) {
    return (
      <SolviaLightweightOnboarding
        accentColor={launchVisual.accentColor}
        gradient={launchVisual.gradient}
        onFinish={markOnboardingCompleted}
        onSkipLocation={deferLocationPrompt}
        onRequestLocationPermission={requestLocationPermission}
        weatherState={launchVisual.weatherState}
      />
    );
  }

  if (!hasCompletedFirstRunLoad) {
    return (
      <SolviaFirstRunLoading
        accentColor={launchVisual.accentColor}
        gradient={launchVisual.gradient}
        onCompleted={markFirstRunLoadCompleted}
        weatherState={launchVisual.weatherState}
      />
    );
  }

  return children;
}
