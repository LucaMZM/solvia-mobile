export type RoutineType = 'caminar_tarde' | 'ir_uni' | 'paseo_perro' | 'trayecto_coche';

export type RoutinePreferredMoment = 'manana' | 'tarde' | 'noche';

export type RoutineLocationContext =
  | { kind: 'sin_contexto' }
  | { kind: 'actual' }
  | { kind: 'guardada'; locationId: string; cityName: string };

export interface UserRoutine {
  id: string;
  title: string;
  type: RoutineType;
  preferredMoment: RoutinePreferredMoment;
  locationContext: RoutineLocationContext;
  enabled: boolean;
  createdAtISO: string;
}

export interface CreateRoutineInput {
  title: string;
  type: RoutineType;
  preferredMoment: RoutinePreferredMoment;
  locationContext: RoutineLocationContext;
  enabled?: boolean;
}
