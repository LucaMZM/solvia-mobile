import { useEffect, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { resolveSelectedLocation } from '@/src/domain/location/locationDomain';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { getWeatherSnapshot, WEATHER_CURRENT_FRESHNESS_MAX_MINUTES } from '@/src/services/weather/weatherService';
import { isLocationPermissionDeniedError } from '@/src/services/location/locationService';
import { useLocationStore } from '@/src/state/locationStore';
import type { WeatherSnapshot } from '@/src/types/weather';

const WEATHER_QUERY_KEY = ['open-meteo-weather'] as const;

function toSnapshotAgeMinutes(snapshot: WeatherSnapshot | undefined): number {
  if (!snapshot) {
    return Number.POSITIVE_INFINITY;
  }

  if (snapshot.meta?.source === 'cache') {
    return snapshot.meta.cacheAgeMinutes;
  }

  const fetchedAtMs = new Date(snapshot.fetchedAtISO).getTime();
  if (!Number.isFinite(fetchedAtMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, Math.round((Date.now() - fetchedAtMs) / 60_000));
}

export function useLocationWeather() {
  const { currentLocation, locationQuery } = useCurrentLocation();
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const selectedLocation = useLocationStore((state) => state.selectedLocation);
  const selectCurrentLocation = useLocationStore((state) => state.selectCurrentLocation);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (selectedLocation.kind === 'saved') {
      const exists = savedLocations.some((location) => location.id === selectedLocation.id);
      if (!exists) {
        selectCurrentLocation();
      }
    }
  }, [savedLocations, selectCurrentLocation, selectedLocation]);

  const activeLocation = useMemo(
    () =>
      resolveSelectedLocation({
        currentLocation,
        savedLocations,
        selectedLocation,
      }),
    [currentLocation, savedLocations, selectedLocation],
  );

  const weatherQuery = useQuery<WeatherSnapshot, Error>({
    queryKey: [
      ...WEATHER_QUERY_KEY,
      activeLocation?.id,
      activeLocation?.coordinates.latitude,
      activeLocation?.coordinates.longitude,
    ],
    enabled: Boolean(activeLocation),
    queryFn: async () => {
      if (!activeLocation) {
        throw new Error('Ubicación no disponible');
      }
      return getWeatherSnapshot(activeLocation);
    },
    staleTime: WEATHER_CURRENT_FRESHNESS_MAX_MINUTES * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState !== 'active' && nextState === 'active') {
        const ageMinutes = toSnapshotAgeMinutes(weatherQuery.data);
        const shouldRefetch = !activeLocation || !weatherQuery.data || ageMinutes >= WEATHER_CURRENT_FRESHNESS_MAX_MINUTES;

        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.info('[weather] foreground-check', {
            previousState,
            nextState,
            shouldRefetch,
            ageMinutes,
            maxFreshMinutes: WEATHER_CURRENT_FRESHNESS_MAX_MINUTES,
            locationId: activeLocation?.id ?? 'sin-ubicacion',
            city: activeLocation?.cityName ?? 'sin-ciudad',
            source: weatherQuery.data?.meta?.source ?? 'none',
          });
        }

        if (shouldRefetch) {
          void locationQuery.refetch();
          void weatherQuery.refetch();
        }
      }
    });

    return () => subscription.remove();
  }, [activeLocation, locationQuery.refetch, weatherQuery.data, weatherQuery.refetch]);

  useEffect(() => {
    if (!activeLocation) {
      return;
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info('[weather] active-location', {
        locationId: activeLocation.id,
        city: activeLocation.cityName,
        latitude: activeLocation.coordinates.latitude,
        longitude: activeLocation.coordinates.longitude,
      });
    }
  }, [activeLocation]);

  const locationPermissionDenied =
    selectedLocation.kind === 'current' &&
    (currentLocation?.source === 'permission_fallback' || isLocationPermissionDeniedError(locationQuery.error));

  return {
    locationQuery,
    weatherQuery,
    activeLocation,
    selectedLocation,
    savedLocations,
    currentLocation,
    locationPermissionDenied,
  };
}
