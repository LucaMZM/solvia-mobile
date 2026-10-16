import type {
  CreateRoutineInput,
  RoutinePreferredMoment,
  RoutineType,
  UserRoutine,
} from '@/src/types/routines';

export const routineTypes: readonly RoutineType[] = [
  'caminar_tarde',
  'ir_uni',
  'paseo_perro',
  'trayecto_coche',
];

export const routineTypeLabels: Record<RoutineType, string> = {
  caminar_tarde: 'Caminar por la tarde',
  ir_uni: 'Ir a la uni',
  paseo_perro: 'Paseo del perro',
  trayecto_coche: 'Trayecto habitual en coche',
};

export const routineMomentOptions: readonly RoutinePreferredMoment[] = ['manana', 'tarde', 'noche'];

export const routineMomentLabels: Record<RoutinePreferredMoment, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
};

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function slugify(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized.length > 0 ? normalized : 'rutina';
}

export function buildRoutineId(input: CreateRoutineInput): string {
  const base = `${slugify(input.title)}-${input.type}-${Date.now().toString(36)}`;
  return `routine-${base}`;
}

export function createRoutine(input: CreateRoutineInput): UserRoutine {
  const safeTitle = normalizeTitle(input.title);
  const fallbackTitle = routineTypeLabels[input.type];

  return {
    id: buildRoutineId(input),
    title: safeTitle.length > 0 ? safeTitle : fallbackTitle,
    type: input.type,
    preferredMoment: input.preferredMoment,
    locationContext: input.locationContext,
    enabled: input.enabled ?? true,
    createdAtISO: new Date().toISOString(),
  };
}
