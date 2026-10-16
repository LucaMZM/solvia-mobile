import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { areLocationsEquivalent } from '@/src/domain/location/locationDomain';
import { appStateStorage } from '@/src/services/storage/persistedStorage';
import type { CurrentLocation, FavoriteLocationTag, SavedLocation, SelectedLocationRef } from '@/src/types/location';

interface LocationState {
  currentLocation: CurrentLocation | null;
  savedLocations: SavedLocation[];
  selectedLocation: SelectedLocationRef;
  setCurrentLocation: (location: CurrentLocation) => void;
  selectCurrentLocation: () => void;
  selectSavedLocation: (id: string) => void;
  addSavedLocation: (location: SavedLocation) => string;
  removeSavedLocation: (id: string) => void;
  moveSavedLocation: (id: string, direction: 'up' | 'down') => void;
  setFavoriteTag: (id: string, tag: FavoriteLocationTag | null) => void;
}

function reorderByDirection<T extends { id: string }>(items: T[], id: string, direction: 'up' | 'down'): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return items;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moving] = next.splice(index, 1);
  next.splice(targetIndex, 0, moving);
  return next;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      savedLocations: [],
      selectedLocation: { kind: 'current' },
      setCurrentLocation: (location) => {
        set((state) => {
          const keepSelectedCurrent = state.selectedLocation.kind === 'current';
          return {
            currentLocation: location,
            selectedLocation: keepSelectedCurrent ? { kind: 'current' } : state.selectedLocation,
          };
        });
      },
      selectCurrentLocation: () => {
        set({ selectedLocation: { kind: 'current' } });
      },
      selectSavedLocation: (id) => {
        const hasSaved = get().savedLocations.some((location) => location.id === id);
        if (!hasSaved) {
          return;
        }
        set({ selectedLocation: { kind: 'saved', id } });
      },
      addSavedLocation: (location) => {
        const state = get();
        const duplicate = state.savedLocations.find((item) => areLocationsEquivalent(item, location));

        if (duplicate) {
          set({ selectedLocation: { kind: 'saved', id: duplicate.id } });
          return duplicate.id;
        }

        set({
          savedLocations: [...state.savedLocations, location],
          selectedLocation: { kind: 'saved', id: location.id },
        });
        return location.id;
      },
      removeSavedLocation: (id) => {
        set((state) => {
          const nextSavedLocations = state.savedLocations.filter((location) => location.id !== id);
          const selectedLocation =
            state.selectedLocation.kind === 'saved' && state.selectedLocation.id === id
              ? { kind: 'current' as const }
              : state.selectedLocation;

          return {
            savedLocations: nextSavedLocations,
            selectedLocation,
          };
        });
      },
      moveSavedLocation: (id, direction) => {
        set((state) => ({
          savedLocations: reorderByDirection(state.savedLocations, id, direction),
        }));
      },
      setFavoriteTag: (id, tag) => {
        set((state) => ({
          savedLocations: state.savedLocations.map((location) =>
            location.id === id
              ? {
                  ...location,
                  favoriteTag: tag ?? undefined,
                }
              : location,
          ),
        }));
      },
    }),
    {
      name: 'solvia-location',
      storage: createJSONStorage(() => appStateStorage),
    },
  ),
);
