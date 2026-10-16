import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { areLocationsEquivalent } from '@/src/domain/location/locationDomain';
import {
  createLocationPermissionDeniedError,
  getCurrentDeviceLocation,
  isLocationPermissionDeniedError,
} from '@/src/services/location/locationService';
import { useAppLifecycleStore } from '@/src/state/appLifecycleStore';
import { useLocationStore } from '@/src/state/locationStore';
import type { CurrentLocation } from '@/src/types/location';

export const LOCATION_QUERY_KEY = ['device-location'] as const;

const LEGACY_MADRID_FALLBACK = { latitude: 40.4168, longitude: -3.7038 };

function isUsableCachedLocation(location: CurrentLocation | null): location is CurrentLocation {
  if (!location || location.source === 'fallback') {
    return false;
  }

  const isLegacyPermissionFallback =
    location.source === 'permission_fallback' &&
    Math.abs(location.coordinates.latitude - LEGACY_MADRID_FALLBACK.latitude) < 0.0001 &&
    Math.abs(location.coordinates.longitude - LEGACY_MADRID_FALLBACK.longitude) < 0.0001;
  return !isLegacyPermissionFallback;
}

async function resolveCurrentLocation(): Promise<CurrentLocation> {
  const appLifecycle = useAppLifecycleStore.getState();
  const storedLocation = useLocationStore.getState().currentLocation;
  const cachedLocation = isUsableCachedLocation(storedLocation) ? storedLocation : null;

  if (appLifecycle.locationPromptDeferred) {
    if (cachedLocation) {
      return {
        ...cachedLocation,
        source: cachedLocation.source === 'gps' ? 'cached' : cachedLocation.source,
      };
    }
    throw createLocationPermissionDeniedError();
  }

  try {
    return await getCurrentDeviceLocation();
  } catch (error) {
    const permissionDenied = isLocationPermissionDeniedError(error);
    if (cachedLocation) {
      return {
        ...cachedLocation,
        source: permissionDenied ? 'permission_fallback' : 'cached',
      };
    }

    throw error;
  }
}

export function useCurrentLocation() {
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);

  const locationQuery = useQuery<CurrentLocation, Error>({
    queryKey: LOCATION_QUERY_KEY,
    queryFn: resolveCurrentLocation,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (locationQuery.data) {
      if (
        !currentLocation ||
        !areLocationsEquivalent(currentLocation, locationQuery.data) ||
        currentLocation.source !== locationQuery.data.source ||
        currentLocation.region !== locationQuery.data.region ||
        currentLocation.country !== locationQuery.data.country
      ) {
        setCurrentLocation(locationQuery.data);
      }
    }
  }, [currentLocation, locationQuery.data, setCurrentLocation]);

  const resolvedCurrentLocation = useMemo(
    () => locationQuery.data ?? (isUsableCachedLocation(currentLocation) ? currentLocation : null),
    [locationQuery.data, currentLocation],
  );

  return {
    locationQuery,
    currentLocation: resolvedCurrentLocation,
  };
}
