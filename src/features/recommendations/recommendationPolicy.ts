import type { ActivityId } from '@/src/types/recommendations';
import type { PlanStatus, PlanType } from '@/src/types/planning';
import type { TrayectoActivityType } from '@/src/types/trayecto';
import type { WeatherRiskProfile } from '@/src/features/recommendations/weatherRisk';

export type RecommendationSubject = ActivityId | PlanType | TrayectoActivityType | 'paraguas' | 'capa' | 'ruta';

export type SafeRecommendationLabel =
  | 'Recomendado'
  | 'Viable'
  | 'Posible'
  | 'Con ajustes'
  | 'Mejor corto'
  | 'Mejor esperar'
  | 'No recomendado'
  | 'Solo cubierto'
  | 'Con protección'
  | 'Con paraguas'
  | 'Con capa';

function isSunSubject(subject: RecommendationSubject): boolean {
  return subject === 'tomar_sol' || subject === 'playa' || subject === 'piscina';
}

function isRunSubject(subject: RecommendationSubject): boolean {
  return subject === 'running_suave' || subject === 'correr_suave';
}

function isTerraceSubject(subject: RecommendationSubject): boolean {
  return subject === 'terraza';
}

function isWalkingSubject(subject: RecommendationSubject): boolean {
  return subject === 'caminar' || subject === 'paseo' || subject === 'paseo_perro';
}

export function canUseStrongPositiveLanguage(risk: WeatherRiskProfile): boolean {
  return (
    risk.severity === 'clear' &&
    !risk.flags.stormNow &&
    !risk.flags.stormSoon &&
    !risk.flags.dataUncertain &&
    !risk.flags.night &&
    !risk.flags.highUv &&
    !risk.flags.rainNow &&
    !risk.flags.rainSoon &&
    !risk.flags.strongWind &&
    !risk.flags.strongGusts
  );
}

export function capScoreForRisk(
  subject: RecommendationSubject,
  score: number,
  risk: WeatherRiskProfile,
): number {
  if (risk.flags.stormNow || risk.severity === 'severe') {
    if (isTerraceSubject(subject)) return Math.min(score, 26);
    if (subject === 'ruta' || subject === 'trayecto') return Math.min(score, 38);
    return Math.min(score, 18);
  }

  if (risk.flags.stormSoon) {
    if (isTerraceSubject(subject)) return Math.min(score, 30);
    if (subject === 'ruta' || subject === 'trayecto') return Math.min(score, 48);
    return Math.min(score, 34);
  }

  if (risk.flags.rainNow) {
    if (isSunSubject(subject)) return Math.min(score, 8);
    if (isTerraceSubject(subject)) return Math.min(score, 34);
    if (isRunSubject(subject)) return Math.min(score, risk.rainPeakMm <= 0.2 ? 42 : 28);
    if (isWalkingSubject(subject)) return Math.min(score, 54);
    return Math.min(score, 58);
  }

  if (risk.flags.rainSoon) {
    if (isSunSubject(subject)) return Math.min(score, 18);
    if (isTerraceSubject(subject)) return Math.min(score, 46);
    if (isRunSubject(subject)) return Math.min(score, 48);
    if (isWalkingSubject(subject)) return Math.min(score, 56);
    return Math.min(score, 62);
  }

  if (risk.flags.strongWind || risk.flags.strongGusts) {
    if (isTerraceSubject(subject) || subject === 'playa') return Math.min(score, 48);
    if (isRunSubject(subject)) return Math.min(score, 54);
    if (isWalkingSubject(subject)) return Math.min(score, 62);
  }

  if (risk.flags.highUv) {
    if (isSunSubject(subject)) return Math.min(score, 64);
    if (isRunSubject(subject)) return Math.min(score, 62);
  }

  if (risk.flags.dataUncertain) {
    return Math.min(score, 68);
  }

  return score;
}

export function getSafeRecommendationLabel(
  subject: RecommendationSubject,
  risk: WeatherRiskProfile,
  score = 60,
): SafeRecommendationLabel {
  if (risk.flags.stormNow || risk.severity === 'severe') {
    return isTerraceSubject(subject) ? 'Solo cubierto' : 'No recomendado';
  }
  if (risk.flags.stormSoon) {
    if (isTerraceSubject(subject)) return 'Solo cubierto';
    if (subject === 'ruta' || subject === 'trayecto') return 'Con ajustes';
    return 'Mejor esperar';
  }
  if (risk.flags.night && isSunSubject(subject)) {
    return 'No recomendado';
  }
  if (risk.flags.rainNow) {
    if (subject === 'paraguas') return 'Con paraguas';
    if (isTerraceSubject(subject)) return 'Solo cubierto';
    if (isSunSubject(subject) || isRunSubject(subject)) return 'No recomendado';
    if (isWalkingSubject(subject)) return 'Con paraguas';
    return 'Con ajustes';
  }
  if (risk.flags.rainSoon) {
    if (subject === 'paraguas') return 'Con paraguas';
    if (isTerraceSubject(subject)) return 'Solo cubierto';
    if (isSunSubject(subject)) return 'Mejor esperar';
    if (isRunSubject(subject)) return 'Mejor esperar';
    if (isWalkingSubject(subject)) return 'Mejor corto';
    return 'Con ajustes';
  }
  if (risk.flags.strongWind || risk.flags.strongGusts) {
    if (isTerraceSubject(subject) || subject === 'playa') return 'Con ajustes';
    if (isWalkingSubject(subject) || isRunSubject(subject)) return 'Mejor corto';
    return 'Con ajustes';
  }
  if (risk.flags.highUv && isSunSubject(subject)) {
    return 'Con protección';
  }
  if ((risk.flags.coldNow || risk.flags.coldSoon) && (isWalkingSubject(subject) || isTerraceSubject(subject) || subject === 'capa')) {
    return 'Con capa';
  }
  if (risk.flags.dataUncertain && score >= 68) {
    return 'Viable';
  }

  if (score >= 74 && canUseStrongPositiveLanguage(risk)) return 'Recomendado';
  if (score >= 58) return 'Viable';
  if (score >= 42) return 'Posible';
  return 'Mejor esperar';
}

export function statusFromPolicyScore(score: number, risk: WeatherRiskProfile): PlanStatus {
  if (score < 42 || risk.severity === 'severe') return 'evitar';
  if (score < 60 || risk.severity === 'high') return 'regular';
  if (score >= 76 && canUseStrongPositiveLanguage(risk)) return 'recomendado';
  return 'okay';
}

export function safeCopy(text: string, risk: WeatherRiskProfile): string {
  if (canUseStrongPositiveLanguage(risk)) {
    return text;
  }

  return text
    .replace(/\b[Ii]deal\b/g, 'viable')
    .replace(/\b[Pp]erfect[oa]\b/g, 'buena')
    .replace(/\b[Ee]xcelente\b/g, 'viable')
    .replace(/Buen momento para salir\./g, 'Salida viable con lectura prudente.')
    .replace(/Buen momento para moverte\./g, 'Puedes moverte con prudencia.');
}
