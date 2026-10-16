import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createRoutine } from '@/src/domain/routines/routineDomain';
import { appStateStorage } from '@/src/services/storage/persistedStorage';
import type { CreateRoutineInput, UserRoutine } from '@/src/types/routines';

interface RoutinesState {
  routines: UserRoutine[];
  addRoutine: (input: CreateRoutineInput) => string;
  removeRoutine: (id: string) => void;
  setRoutineEnabled: (id: string, enabled: boolean) => void;
}

export const useRoutinesStore = create<RoutinesState>()(
  persist(
    (set, get) => ({
      routines: [],
      addRoutine: (input) => {
        const routine = createRoutine(input);
        set({
          routines: [...get().routines, routine],
        });
        return routine.id;
      },
      removeRoutine: (id) => {
        set((state) => ({
          routines: state.routines.filter((routine) => routine.id !== id),
        }));
      },
      setRoutineEnabled: (id, enabled) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id
              ? {
                  ...routine,
                  enabled,
                }
              : routine,
          ),
        }));
      },
    }),
    {
      name: 'solvia-routines',
      storage: createJSONStorage(() => appStateStorage),
    },
  ),
);
