import type { ForecastConfidence, PlanningBundle } from '@/src/types/planning';

export type WeatherState =
  | 'pleasant_sunny'
  | 'strong_sun'
  | 'soft_cloudy'
  | 'rainy'
  | 'windy'
  | 'cool_evening'
  | 'golden_hour'
  | 'night_clear';

export type ActivityId = 'tomar_sol' | 'caminar' | 'terraza' | 'running_suave';

export type ThermalProfile = 'friolero' | 'normal' | 'caluroso';

export type ActivityTone =
  | 'recomendado'
  | 'posible'
  | 'evitar'
  | 'no_recomendado'
  | 'desafiante'
  | 'interior'
  | 'zonas_protegidas';

export interface HeroAtmosphere {
  badge: string;
  title: string;
  support: string;
  gradientColors: [string, string, string];
  accent: string;
}

export interface ActivityRecommendation {
  id: ActivityId;
  label: string;
  tone: ActivityTone;
  detail: string;
  shortRecommendation: string;
  bestMomentLabel?: string;
  muted?: boolean;
}

export interface SunUvRecommendation {
  uvIndex: number;
  levelLabel: string;
  support: string;
  maxSafeMinutesWithoutProtection: number;
}

export interface OutfitRecommendation {
  superior: string;
  capa: string;
  calzado: string;
  accesorios: string;
  note: string;
}

export interface WindRecommendation {
  speedKmh: number;
  support: string;
}

export interface BestNextWindowRecommendation {
  label: string;
  reason: string;
  startISO: string;
  endISO: string;
}

export type HighlightedModule = 'actividades' | 'sol_uv' | 'ropa' | 'viento' | 'proximas_horas';

export interface RecommendationBundle {
  state: WeatherState;
  atmosphere: HeroAtmosphere;
  mainHeadline: string;
  supportCopy: string;
  forecastConfidence: ForecastConfidence;
  planning: PlanningBundle;
  activities: ActivityRecommendation[];
  sunUv: SunUvRecommendation;
  outfit: OutfitRecommendation;
  wind: WindRecommendation;
  bestNextWindow: BestNextWindowRecommendation;
  highlightedModule: HighlightedModule;
}
