import type { HourlyForecastPoint } from '@/src/types/weather';
import type { TrayectoRiskTrend } from '@/src/types/trayecto';

export function findClosestHourlyPoint(
  points: readonly HourlyForecastPoint[],
  targetTimeMs: number,
): HourlyForecastPoint | null {
  if (points.length === 0) {
    return null;
  }

  let best = points[0];
  let bestDiff = Math.abs(new Date(best.timeISO).getTime() - targetTimeMs);

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const diff = Math.abs(new Date(point.timeISO).getTime() - targetTimeMs);
    if (diff < bestDiff) {
      best = point;
      bestDiff = diff;
    }
  }

  return best;
}

export function sliceHourlyWindow(
  points: readonly HourlyForecastPoint[],
  startTimeMs: number,
  endTimeMs: number,
): HourlyForecastPoint[] {
  if (points.length === 0) {
    return [];
  }

  const sorted = [...points].sort(
    (left, right) => new Date(left.timeISO).getTime() - new Date(right.timeISO).getTime(),
  );
  const selected = sorted.filter((point) => {
    const value = new Date(point.timeISO).getTime();
    return value >= startTimeMs && value <= endTimeMs;
  });

  if (selected.length > 0) {
    return selected;
  }

  const closest = findClosestHourlyPoint(points, startTimeMs);
  return closest ? [closest] : [];
}

export function toRiskTrend(delta: number, threshold: number): TrayectoRiskTrend {
  if (delta >= threshold) {
    return 'sube';
  }
  if (delta <= -threshold) {
    return 'baja';
  }
  return 'estable';
}

export function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function max(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => (value > acc ? value : acc), values[0]);
}

export function min(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => (value < acc ? value : acc), values[0]);
}
