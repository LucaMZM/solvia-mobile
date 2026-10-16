import type { StateStorage } from 'zustand/middleware';

import {
  appStorage,
  storageRuntimeInfo,
  type PersistenceEngine,
  type StorageRuntimeInfo,
} from '@/src/services/storage/appStorage';

const asyncStateStorage: StateStorage = {
  setItem: async (key: string, value: string) => {
    await appStorage.setItem(key, value);
  },
  getItem: async (key: string) => {
    return appStorage.getItem(key);
  },
  removeItem: async (key: string) => {
    await appStorage.removeItem(key);
  },
};

export const appStateStorage: StateStorage = asyncStateStorage;

export const persistenceEngine: PersistenceEngine = storageRuntimeInfo.activeEngine;
export const persistenceRuntimeInfo: StorageRuntimeInfo = storageRuntimeInfo;
