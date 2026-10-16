import { useMemo } from 'react';

import { resolveSelectedLocation } from '@/src/domain/location/locationDomain';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import { useLocationStore } from '@/src/state/locationStore';

export function useLocationSelectionModel() {
  const { currentLocation, locationQuery } = useCurrentLocation();
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const selectedLocation = useLocationStore((state) => state.selectedLocation);
  const selectCurrentLocation = useLocationStore((state) => state.selectCurrentLocation);
  const selectSavedLocation = useLocationStore((state) => state.selectSavedLocation);
  const addSavedLocation = useLocationStore((state) => state.addSavedLocation);
  const removeSavedLocation = useLocationStore((state) => state.removeSavedLocation);
  const moveSavedLocation = useLocationStore((state) => state.moveSavedLocation);
  const setFavoriteTag = useLocationStore((state) => state.setFavoriteTag);

  const activeLocation = useMemo(
    () =>
      resolveSelectedLocation({
        currentLocation,
        savedLocations,
        selectedLocation,
      }),
    [currentLocation, savedLocations, selectedLocation],
  );

  return {
    locationQuery,
    currentLocation,
    savedLocations,
    selectedLocation,
    activeLocation,
    selectCurrentLocation,
    selectSavedLocation,
    addSavedLocation,
    removeSavedLocation,
    moveSavedLocation,
    setFavoriteTag,
  };
}
