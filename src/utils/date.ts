import { getLocalClock, getLocalHour } from '@/src/services/weather/localTime';

export function formatHour(isoDate: string): string {
  return String(getLocalHour(isoDate)).padStart(2, '0');
}

export function formatClock(isoDate: string): string {
  return getLocalClock(isoDate);
}

export function toHourLabel(isoDate: string): string {
  return `${formatHour(isoDate)}:00`;
}
