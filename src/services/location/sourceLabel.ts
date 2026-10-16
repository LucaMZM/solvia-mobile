import type { CurrentLocationSource } from '@/src/types/location';

const sourceLabels: Record<CurrentLocationSource, string> = {
  gps: 'GPS',
  cached: 'Última ubicación guardada',
  fallback: 'Ubicación de respaldo',
  permission_fallback: 'Ubicación limitada (sin permiso)',
};

export function getLocationSourceLabel(source: CurrentLocationSource): string {
  return sourceLabels[source];
}
