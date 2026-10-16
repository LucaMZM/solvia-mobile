import type {
  DecisionNotificationDraft,
  NotificationCategory,
} from '@/src/types/notifications';
import type { StoredNotificationEntry } from '@/src/services/notifications/notificationRegistry';

const MAX_DRAFTS_PER_CATEGORY = 2;
const MAX_FUTURE_HOURS = 24;
const MIN_LEAD_MS = 90 * 1000;

function isWithinSchedulingWindow(triggerAtISO: string): boolean {
  const triggerMs = new Date(triggerAtISO).getTime();
  if (!Number.isFinite(triggerMs)) {
    return false;
  }

  const now = Date.now();
  const latestAllowedMs = now + MAX_FUTURE_HOURS * 60 * 60_000;
  return triggerMs >= now + MIN_LEAD_MS && triggerMs <= latestAllowedMs;
}

export function normalizeDecisionDrafts(drafts: DecisionNotificationDraft[]): DecisionNotificationDraft[] {
  const grouped: Record<NotificationCategory, DecisionNotificationDraft[]> = {
    daily_brief: [],
    weather_adaptive: [],
    routine: [],
    route_trip: [],
  };

  drafts
    .filter((draft) => isWithinSchedulingWindow(draft.triggerAtISO))
    .forEach((draft) => {
      grouped[draft.category].push(draft);
    });

  (Object.keys(grouped) as NotificationCategory[]).forEach((category) => {
    grouped[category] = grouped[category]
      .sort((left, right) => new Date(left.triggerAtISO).getTime() - new Date(right.triggerAtISO).getTime())
      .slice(0, MAX_DRAFTS_PER_CATEGORY);
  });

  return (Object.keys(grouped) as NotificationCategory[]).flatMap((category) => grouped[category]);
}

export function hasSameScheduledContent(
  existing: StoredNotificationEntry,
  next: DecisionNotificationDraft,
): boolean {
  const existingMs = new Date(existing.triggerAtISO).getTime();
  const nextMs = new Date(next.triggerAtISO).getTime();
  const timeDiffMs = Math.abs(existingMs - nextMs);

  return timeDiffMs <= 5 * 60_000 && existing.title === next.title && existing.body === next.body;
}
