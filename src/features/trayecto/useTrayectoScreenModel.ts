import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  buildRoutePointSubtitle,
  resolveDepartureDate,
  toRoutePointFromLocation,
} from '@/src/domain/trayecto/trayectoDomain';
import { analyzeCarRoute } from '@/src/features/trayecto/analysis/carRouteAnalyzer';
import { analyzeLocalOuting } from '@/src/features/trayecto/analysis/localOutingAnalyzer';
import {
  buildQuickRoutePoints,
  buildRouteNotificationSyncKey,
  mapSearchResultsToRoutePoints,
  normalizeRouteSearchQuery,
  toFriendlyRouteError,
} from '@/src/features/trayecto/trayectoScreenHelpers';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { useLocationSelectionModel } from '@/src/features/location/useLocationSelectionModel';
import { searchCityLocations } from '@/src/services/location/locationService';
import {
  cancelDecisionNotificationsByCategory,
  syncRouteTripNotification,
} from '@/src/services/notifications/notificationService';
import { planRoute } from '@/src/services/routing/routingService';
import { getWeatherSnapshot } from '@/src/services/weather/weatherService';
import { usePreferencesStore } from '@/src/state/preferencesStore';
import {
  ensureTrayectoDestinationFromSavedLocations,
  ensureTrayectoOriginFromActiveLocation,
  useTrayectoStore,
} from '@/src/state/trayectoStore';
import type { WeatherSnapshot } from '@/src/types/weather';

export function useTrayectoScreenModel() {
  const briefing = useWeatherBriefing();
  const locationModel = useLocationSelectionModel();
  const thermalProfile = usePreferencesStore((state) => state.thermalProfile);
  const notificationCategories = usePreferencesStore((state) => state.notificationCategories);
  const mode = useTrayectoStore((state) => state.mode);
  const localConfig = useTrayectoStore((state) => state.localConfig);
  const carConfig = useTrayectoStore((state) => state.carConfig);
  const setMode = useTrayectoStore((state) => state.setMode);
  const setLocalDuration = useTrayectoStore((state) => state.setLocalDuration);
  const setLocalDepartureMode = useTrayectoStore((state) => state.setLocalDepartureMode);
  const setLocalDepartureTime = useTrayectoStore((state) => state.setLocalDepartureTime);
  const setLocalActivityType = useTrayectoStore((state) => state.setLocalActivityType);
  const setCarDepartureMode = useTrayectoStore((state) => state.setCarDepartureMode);
  const setCarDepartureTime = useTrayectoStore((state) => state.setCarDepartureTime);
  const setCarOrigin = useTrayectoStore((state) => state.setCarOrigin);
  const setCarDestination = useTrayectoStore((state) => state.setCarDestination);
  const swapCarEndpoints = useTrayectoStore((state) => state.swapCarEndpoints);
  const addCarStop = useTrayectoStore((state) => state.addCarStop);
  const removeCarStop = useTrayectoStore((state) => state.removeCarStop);
  const clearCarStops = useTrayectoStore((state) => state.clearCarStops);

  const [originSearchText, setOriginSearchText] = useState('');
  const [destinationSearchText, setDestinationSearchText] = useState('');
  const [stopSearchText, setStopSearchText] = useState('');
  const routeNotificationSyncKeyRef = useRef<string | null>(null);
  const debouncedOrigin = useDebouncedValue(originSearchText, 260);
  const debouncedDestination = useDebouncedValue(destinationSearchText, 260);
  const debouncedStop = useDebouncedValue(stopSearchText, 260);
  const normalizedOriginQuery = useMemo(() => normalizeRouteSearchQuery(debouncedOrigin), [debouncedOrigin]);
  const normalizedDestinationQuery = useMemo(
    () => normalizeRouteSearchQuery(debouncedDestination),
    [debouncedDestination],
  );
  const normalizedStopQuery = useMemo(() => normalizeRouteSearchQuery(debouncedStop), [debouncedStop]);

  const originSearchQuery = useQuery({
    queryKey: ['trayecto-origin-search', normalizedOriginQuery],
    enabled: normalizedOriginQuery.length >= 2,
    queryFn: async () => mapSearchResultsToRoutePoints(await searchCityLocations(normalizedOriginQuery)),
    staleTime: 60_000,
  });

  const destinationSearchQuery = useQuery({
    queryKey: ['trayecto-destination-search', normalizedDestinationQuery],
    enabled: normalizedDestinationQuery.length >= 2,
    queryFn: async () => mapSearchResultsToRoutePoints(await searchCityLocations(normalizedDestinationQuery)),
    staleTime: 60_000,
  });

  const stopSearchQuery = useQuery({
    queryKey: ['trayecto-stop-search', normalizedStopQuery],
    enabled: normalizedStopQuery.length >= 2,
    queryFn: async () => mapSearchResultsToRoutePoints(await searchCityLocations(normalizedStopQuery)),
    staleTime: 60_000,
  });

  const quickPoints = useMemo(
    () =>
      buildQuickRoutePoints({
        activeLocation: locationModel.activeLocation,
        savedLocations: locationModel.savedLocations,
      }),
    [locationModel.activeLocation, locationModel.savedLocations],
  );

  useEffect(() => {
    const activePoint = locationModel.activeLocation ? toRoutePointFromLocation(locationModel.activeLocation) : null;
    ensureTrayectoOriginFromActiveLocation(activePoint);
    ensureTrayectoDestinationFromSavedLocations(quickPoints);
  }, [locationModel.activeLocation, quickPoints]);

  const localAnalysis = useMemo(() => {
    if (!briefing.snapshot) {
      return null;
    }
    return analyzeLocalOuting({
      snapshot: briefing.snapshot,
      config: localConfig,
      thermalProfile,
    });
  }, [briefing.snapshot, localConfig, thermalProfile]);

  const routePlanQuery = useQuery({
    queryKey: [
      'trayecto-route-plan',
      carConfig.origin?.id ?? 'sin-origen',
      carConfig.destination?.id ?? 'sin-destino',
      ...carConfig.optionalStops.map((stop) => stop.id),
    ],
    enabled: Boolean(carConfig.origin && carConfig.destination),
    queryFn: async () => {
      if (!carConfig.origin || !carConfig.destination) {
        throw new Error('Faltan origen y destino.');
      }
      return planRoute({
        origin: carConfig.origin,
        destination: carConfig.destination,
        stops: carConfig.optionalStops,
      });
    },
    staleTime: 5 * 60_000,
  });

  const routeWeatherQuery = useQuery<Record<string, WeatherSnapshot>>({
    queryKey: [
      'trayecto-route-weather',
      routePlanQuery.data?.providerId ?? 'sin-plan',
      ...(routePlanQuery.data?.segments.map((segment) => `${segment.id}-${segment.midpointCoordinates.latitude.toFixed(2)}-${segment.midpointCoordinates.longitude.toFixed(2)}`) ?? []),
    ],
    enabled: Boolean(routePlanQuery.data && routePlanQuery.data.segments.length > 0),
    queryFn: async () => {
      const plan = routePlanQuery.data;
      if (!plan) {
        throw new Error('No hay plan de ruta.');
      }

      const entries = await Promise.all(
        plan.segments.map(async (segment) => {
          const snapshot = await getWeatherSnapshot({
            id: `trayecto-segmento-${segment.id}`,
            cityName: segment.label,
            coordinates: segment.midpointCoordinates,
          });

          return [segment.id, snapshot] as const;
        }),
      );

      return Object.fromEntries(entries);
    },
    staleTime: 5 * 60_000,
  });

  const carDepartureDate = useMemo(() => {
    const referenceISO = briefing.snapshot?.current.timeISO ?? new Date().toISOString();
    return resolveDepartureDate({
      departureMode: carConfig.departureMode,
      customHour: carConfig.departureCustomHour,
      customMinute: carConfig.departureCustomMinute,
      referenceISO,
    });
  }, [
    briefing.snapshot?.current.timeISO,
    carConfig.departureCustomHour,
    carConfig.departureCustomMinute,
    carConfig.departureMode,
  ]);

  const carAnalysis = useMemo(() => {
    if (!routePlanQuery.data || !routeWeatherQuery.data) {
      return null;
    }
    return analyzeCarRoute({
      routePlan: routePlanQuery.data,
      segmentSnapshots: routeWeatherQuery.data,
      departureDate: carDepartureDate,
      departureMode: carConfig.departureMode,
      thermalProfile,
    });
  }, [
    routePlanQuery.data,
    routeWeatherQuery.data,
    carDepartureDate,
    carConfig.departureMode,
    thermalProfile,
  ]);

  const routeErrorMessage = toFriendlyRouteError(routePlanQuery.error ?? routeWeatherQuery.error ?? null);
  const canAnalyzeRoute = Boolean(carConfig.origin && carConfig.destination);
  const routeLoading = routePlanQuery.isLoading || routeWeatherQuery.isLoading;
  const routeReady = Boolean(canAnalyzeRoute && routePlanQuery.data && carAnalysis);
  const routeFallbackActive = routePlanQuery.data?.confidence === 'fallback';
  const routeUsingCachedWeather = Boolean(
    routeWeatherQuery.data &&
      Object.values(routeWeatherQuery.data).some((snapshot) => snapshot.meta?.source === 'cache'),
  );

  useEffect(() => {
    if (!notificationCategories.route_trip) {
      routeNotificationSyncKeyRef.current = null;
      void cancelDecisionNotificationsByCategory('route_trip');
      return;
    }
    if (mode !== 'coche_ruta') {
      return;
    }

    if (!canAnalyzeRoute || !carAnalysis || !carConfig.origin || !carConfig.destination) {
      routeNotificationSyncKeyRef.current = null;
      void cancelDecisionNotificationsByCategory('route_trip');
      return;
    }

    const departureISO = carDepartureDate.toISOString();
    const syncKey = buildRouteNotificationSyncKey({
      originId: carConfig.origin.id,
      destinationId: carConfig.destination.id,
      departureISO,
      analysis: carAnalysis,
    });

    if (routeNotificationSyncKeyRef.current === syncKey) {
      return;
    }

    routeNotificationSyncKeyRef.current = syncKey;
    void syncRouteTripNotification({
      analysis: carAnalysis,
      departureISO,
      originName: carConfig.origin.cityName,
      destinationName: carConfig.destination.cityName,
      enabledCategories: notificationCategories,
    });
  }, [
    canAnalyzeRoute,
    carAnalysis,
    carConfig.destination,
    carConfig.origin,
    carDepartureDate,
    mode,
    notificationCategories,
  ]);

  const locationSubtitle = useMemo(() => {
    if (!locationModel.activeLocation) {
      return null;
    }
    return buildRoutePointSubtitle(toRoutePointFromLocation(locationModel.activeLocation));
  }, [locationModel.activeLocation]);

  return {
    briefing,
    mode,
    localConfig,
    carConfig,
    localAnalysis,
    carAnalysis,
    setMode,
    setLocalDuration,
    setLocalDepartureMode,
    setLocalDepartureTime,
    setLocalActivityType,
    setCarDepartureMode,
    setCarDepartureTime,
    setCarOrigin,
    setCarDestination,
    swapCarEndpoints,
    addCarStop,
    removeCarStop,
    clearCarStops,
    quickPoints,
    canAnalyzeRoute,
    routeLoading,
    routeReady,
    routeFallbackActive,
    routeUsingCachedWeather,
    routeErrorMessage,
    refetchRoute: async () => {
      await routePlanQuery.refetch();
      await routeWeatherQuery.refetch();
    },
    routePlan: routePlanQuery.data ?? null,
    originSearchText,
    destinationSearchText,
    stopSearchText,
    setOriginSearchText,
    setDestinationSearchText,
    setStopSearchText,
    originSearchResults: originSearchQuery.data ?? [],
    destinationSearchResults: destinationSearchQuery.data ?? [],
    stopSearchResults: stopSearchQuery.data ?? [],
    originSearchLoading: originSearchQuery.isFetching,
    destinationSearchLoading: destinationSearchQuery.isFetching,
    stopSearchLoading: stopSearchQuery.isFetching,
    originSearchError: originSearchQuery.isError,
    destinationSearchError: destinationSearchQuery.isError,
    stopSearchError: stopSearchQuery.isError,
    locationSubtitle,
  };
}
