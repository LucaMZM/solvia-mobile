import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  compareRoutePoints,
  createDefaultCarTrayectoConfig,
  createDefaultLocalTrayectoConfig,
  normalizeDepartureTime,
} from '@/src/domain/trayecto/trayectoDomain';
import { appStateStorage } from '@/src/services/storage/persistedStorage';
import type {
  CarTrayectoConfig,
  LocalTrayectoConfig,
  RouteCityPoint,
  TrayectoActivityType,
  TrayectoDepartureMode,
  TrayectoMode,
} from '@/src/types/trayecto';

interface TrayectoState {
  mode: TrayectoMode;
  localConfig: LocalTrayectoConfig;
  carConfig: CarTrayectoConfig;
  setMode: (mode: TrayectoMode) => void;
  setLocalDuration: (durationMin: LocalTrayectoConfig['durationMin']) => void;
  setLocalDepartureMode: (mode: TrayectoDepartureMode) => void;
  setLocalDepartureTime: (hour: number, minute: number) => void;
  setLocalActivityType: (activityType: TrayectoActivityType) => void;
  setCarDepartureMode: (mode: TrayectoDepartureMode) => void;
  setCarDepartureTime: (hour: number, minute: number) => void;
  setCarOrigin: (origin: RouteCityPoint | null) => void;
  setCarDestination: (destination: RouteCityPoint | null) => void;
  swapCarEndpoints: () => void;
  addCarStop: (stop: RouteCityPoint) => void;
  removeCarStop: (stopId: string) => void;
  clearCarStops: () => void;
}

function withUniqueStops(stops: RouteCityPoint[], candidate: RouteCityPoint): RouteCityPoint[] {
  if (stops.some((item) => compareRoutePoints(item, candidate))) {
    return stops;
  }

  return [...stops, candidate];
}

export const useTrayectoStore = create<TrayectoState>()(
  persist(
    (set) => ({
      mode: 'paseo_local',
      localConfig: createDefaultLocalTrayectoConfig(),
      carConfig: createDefaultCarTrayectoConfig(),
      setMode: (mode) => set({ mode }),
      setLocalDuration: (durationMin) =>
        set((state) => ({
          localConfig: {
            ...state.localConfig,
            durationMin,
          },
        })),
      setLocalDepartureMode: (mode) =>
        set((state) => ({
          localConfig: {
            ...state.localConfig,
            departureMode: mode,
          },
        })),
      setLocalDepartureTime: (hour, minute) =>
        set((state) => {
          const normalized = normalizeDepartureTime(hour, minute);
          return {
            localConfig: {
              ...state.localConfig,
              departureCustomHour: normalized.hour,
              departureCustomMinute: normalized.minute,
            },
          };
        }),
      setLocalActivityType: (activityType) =>
        set((state) => ({
          localConfig: {
            ...state.localConfig,
            activityType,
          },
        })),
      setCarDepartureMode: (mode) =>
        set((state) => ({
          carConfig: {
            ...state.carConfig,
            departureMode: mode,
          },
        })),
      setCarDepartureTime: (hour, minute) =>
        set((state) => {
          const normalized = normalizeDepartureTime(hour, minute);
          return {
            carConfig: {
              ...state.carConfig,
              departureCustomHour: normalized.hour,
              departureCustomMinute: normalized.minute,
            },
          };
        }),
      setCarOrigin: (origin) =>
        set((state) => ({
          carConfig: {
            ...state.carConfig,
            origin,
            optionalStops: origin
              ? state.carConfig.optionalStops.filter((stop) => !compareRoutePoints(stop, origin))
              : state.carConfig.optionalStops,
          },
        })),
      setCarDestination: (destination) =>
        set((state) => ({
          carConfig: {
            ...state.carConfig,
            destination,
            optionalStops: destination
              ? state.carConfig.optionalStops.filter((stop) => !compareRoutePoints(stop, destination))
              : state.carConfig.optionalStops,
          },
        })),
      swapCarEndpoints: () =>
        set((state) => {
          const origin = state.carConfig.origin;
          const destination = state.carConfig.destination;
          if (!origin && !destination) {
            return state;
          }

          return {
            carConfig: {
              ...state.carConfig,
              origin: destination,
              destination: origin,
            },
          };
        }),
      addCarStop: (stop) =>
        set((state) => {
          const origin = state.carConfig.origin;
          const destination = state.carConfig.destination;
          if ((origin && compareRoutePoints(origin, stop)) || (destination && compareRoutePoints(destination, stop))) {
            return state;
          }

          return {
            carConfig: {
              ...state.carConfig,
              optionalStops: withUniqueStops(state.carConfig.optionalStops, stop),
            },
          };
        }),
      removeCarStop: (stopId) =>
        set((state) => ({
          carConfig: {
            ...state.carConfig,
            optionalStops: state.carConfig.optionalStops.filter((stop) => stop.id !== stopId),
          },
        })),
      clearCarStops: () =>
        set((state) => ({
          carConfig: {
            ...state.carConfig,
            optionalStops: [],
          },
        })),
    }),
    {
      name: 'solvia-trayecto',
      storage: createJSONStorage(() => appStateStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const currentLocal = state.localConfig ?? createDefaultLocalTrayectoConfig();
        const localTime = normalizeDepartureTime(currentLocal.departureCustomHour, currentLocal.departureCustomMinute);
        state.localConfig = {
          ...currentLocal,
          departureCustomHour: localTime.hour,
          departureCustomMinute: localTime.minute,
        };

        const currentCar = state.carConfig ?? createDefaultCarTrayectoConfig();
        const carTime = normalizeDepartureTime(currentCar.departureCustomHour, currentCar.departureCustomMinute);
        state.carConfig = {
          ...currentCar,
          departureCustomHour: carTime.hour,
          departureCustomMinute: carTime.minute,
          optionalStops: currentCar.optionalStops ?? [],
        };
      },
    },
  ),
);

export function ensureTrayectoOriginFromActiveLocation(activeLocation: RouteCityPoint | null): void {
  if (!activeLocation) {
    return;
  }

  const state = useTrayectoStore.getState();
  if (!state.carConfig.origin) {
    state.setCarOrigin(activeLocation);
  }
}

export function ensureTrayectoDestinationFromSavedLocations(
  locations: RouteCityPoint[],
): void {
  const state = useTrayectoStore.getState();
  if (state.carConfig.destination || locations.length === 0) {
    return;
  }

  const firstDistinct = locations.find(
    (location) => !state.carConfig.origin || !compareRoutePoints(location, state.carConfig.origin),
  );

  if (firstDistinct) {
    state.setCarDestination(firstDistinct);
  }
}
