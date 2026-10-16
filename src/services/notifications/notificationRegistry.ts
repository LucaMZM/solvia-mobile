import { appStorage } from '@/src/services/storage/appStorage';
import type { NotificationCategory } from '@/src/types/notifications';

const REGISTRY_STORAGE_KEY = 'solvia-notification-registry-v1';

export interface StoredNotificationRegistry {
  items: Record<string, StoredNotificationEntry>;
}

export interface StoredNotificationEntry {
  dedupeKey: string;
  category: NotificationCategory;
  scheduledId: string;
  triggerAtISO: string;
  title: string;
  body: string;
}

function createEmptyRegistry(): StoredNotificationRegistry {
  return { items: {} };
}

function hasRegistryItemsValue(value: unknown): value is StoredNotificationRegistry {
  return typeof value === 'object' && value !== null && typeof (value as { items?: unknown }).items === 'object';
}

export async function readNotificationRegistry(): Promise<StoredNotificationRegistry> {
  try {
    const raw = await appStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      return createEmptyRegistry();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!hasRegistryItemsValue(parsed)) {
      return createEmptyRegistry();
    }
    return parsed;
  } catch {
    return createEmptyRegistry();
  }
}

export async function writeNotificationRegistry(registry: StoredNotificationRegistry): Promise<void> {
  try {
    await appStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore registry persistence errors to keep scheduling flows resilient.
  }
}
