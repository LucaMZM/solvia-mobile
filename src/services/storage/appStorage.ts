import AsyncStorage from '@react-native-async-storage/async-storage';

import { isExpoGoRuntime } from '@/src/services/platform/runtimeCapabilities';

export type PersistenceEngine = 'async-storage' | 'mmkv';
type PersistenceSelection = PersistenceEngine | 'auto';

export interface AppStorageAdapter {
  readonly engine: PersistenceEngine;
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
}

export interface StorageRuntimeInfo {
  requestedEngine: PersistenceSelection;
  activeEngine: PersistenceEngine;
  fallbackReason?: string;
}

const requestedEngine = (process.env.EXPO_PUBLIC_PERSISTENCE_ENGINE ?? 'auto') as PersistenceSelection;

const asyncStorageAdapter: AppStorageAdapter = {
  engine: 'async-storage',
  setItem: AsyncStorage.setItem,
  getItem: AsyncStorage.getItem,
  removeItem: AsyncStorage.removeItem,
};

function resolveStorageRuntime(selection: PersistenceSelection): StorageRuntimeInfo {
  if (selection === 'mmkv') {
    if (isExpoGoRuntime()) {
      return {
        requestedEngine: selection,
        activeEngine: 'async-storage',
        fallbackReason: 'MMKV requiere build de desarrollo o app nativa; Expo Go usa AsyncStorage.',
      };
    }
    return {
      requestedEngine: selection,
      activeEngine: 'async-storage',
      fallbackReason: 'MMKV aún no está conectado en este runtime; se mantiene AsyncStorage.',
    };
  }

  return {
    requestedEngine: selection,
    activeEngine: 'async-storage',
  };
}

const runtimeInfo = resolveStorageRuntime(requestedEngine);

export const appStorage: AppStorageAdapter = asyncStorageAdapter;
export const storageRuntimeInfo: StorageRuntimeInfo = runtimeInfo;
