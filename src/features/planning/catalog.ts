import { appIcons, type AppIconName } from '@/src/theme/iconography';
import type { PlanStatus, PlanType } from '@/src/types/planning';

export const planTypes: readonly PlanType[] = [
  'caminar',
  'correr_suave',
  'terraza',
  'piscina',
  'playa',
  'tomar_sol',
  'paseo_perro',
  'trayecto',
];

export const planTypeLabels: Record<PlanType, string> = {
  caminar: 'Caminar',
  correr_suave: 'Correr suave',
  terraza: 'Terraza',
  piscina: 'Piscina',
  playa: 'Playa',
  tomar_sol: 'Tomar el sol',
  paseo_perro: 'Paseo del perro',
  trayecto: 'Trayecto',
};

export const planTypeIcons: Record<PlanType, AppIconName> = appIcons.planTypes;

export const planStatusLabels: Record<PlanStatus, string> = {
  recomendado: 'Recomendado',
  okay: 'Viable',
  regular: 'Con ajustes',
  evitar: 'Mejor evitar',
};
