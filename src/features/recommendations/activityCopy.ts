import type { ActivityReasonCode, RecommendationDerivation } from '@/src/features/recommendations/derivation';
import type { ActivityId, ActivityTone } from '@/src/types/recommendations';

export function toneFromScore(score: number): ActivityTone {
  if (score >= 78) {
    return 'recomendado';
  }
  if (score >= 62) {
    return 'recomendado';
  }
  if (score >= 46) {
    return 'posible';
  }
  if (score >= 32) {
    return 'desafiante';
  }
  if (score >= 20) {
    return 'evitar';
  }
  return 'no_recomendado';
}

function hasReason(reasonCodes: readonly ActivityReasonCode[], reason: ActivityReasonCode): boolean {
  return reasonCodes.includes(reason);
}

function detailForTomarSol(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'night') || !model.signals.snapshot.current.isDay) {
    return 'No aplica';
  }
  if (hasReason(reasonCodes, 'storm') || hasReason(reasonCodes, 'current_rain')) {
    return 'No ahora';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor esperar';
  }
  if (model.state === 'strong_sun' || hasReason(reasonCodes, 'high_uv')) {
    return 'Con protección';
  }
  if (model.state === 'golden_hour') {
    return 'Recomendado';
  }
  if (score >= 70) {
    return 'Recomendado';
  }
  if (score >= 45) {
    return 'Con protección';
  }
  return 'Posible';
}

function detailForCaminar(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm')) {
    return 'No recomendado';
  }
  if (hasReason(reasonCodes, 'current_rain')) {
    return 'Mejor corto';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Con paraguas';
  }
  if (hasReason(reasonCodes, 'strong_wind') || (model.state === 'windy' && score < 58)) {
    return 'Zonas protegidas';
  }
  if (hasReason(reasonCodes, 'cold_drop')) {
    return 'Con capa';
  }
  if (score >= 68) {
    return 'Recomendado';
  }
  if (score >= 40) {
    return 'Con capa';
  }
  return 'Exigente';
}

function detailForTerraza(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm') || hasReason(reasonCodes, 'current_rain')) {
    return 'Cubierta';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor cubierta';
  }
  if (hasReason(reasonCodes, 'strong_wind') || (model.state === 'windy' && score < 55)) {
    return 'Resguardada';
  }
  if (model.state === 'golden_hour') {
    return 'Recomendada';
  }
  if (score >= 70) {
    return 'Recomendada';
  }
  if (score >= 50) {
    return 'Con capa';
  }
  return 'Limitada';
}

function detailForRunning(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm')) {
    return 'Mejor no';
  }
  if (hasReason(reasonCodes, 'current_rain')) {
    return 'Mejor no';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor esperar';
  }
  if (model.state === 'strong_sun' || hasReason(reasonCodes, 'high_uv')) {
    return 'Con protección';
  }
  if (hasReason(reasonCodes, 'strong_wind') || model.state === 'windy') {
    return 'Ruta protegida';
  }
  if (score >= 68) {
    return 'Recomendado';
  }
  if (score >= 50) {
    return 'Posible';
  }
  return 'Mejor no';
}

export function buildActivityDetail(
  activityId: ActivityId,
  score: number,
  model: RecommendationDerivation,
  reasonCodes: readonly ActivityReasonCode[] = [],
): string {
  const detailById: Record<ActivityId, string> = {
    tomar_sol: detailForTomarSol(score, model, reasonCodes),
    caminar: detailForCaminar(score, model, reasonCodes),
    terraza: detailForTerraza(score, model, reasonCodes),
    running_suave: detailForRunning(score, model, reasonCodes),
  };

  return detailById[activityId];
}

function shortRecommendationForTomarSol(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'night') || !model.signals.snapshot.current.isDay) {
    return 'Sin sol directo.';
  }
  if (hasReason(reasonCodes, 'storm') || hasReason(reasonCodes, 'current_rain')) {
    return 'Con lluvia, mejor interior.';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Puede mojarse pronto.';
  }
  if (model.state === 'strong_sun' || hasReason(reasonCodes, 'high_uv')) {
    return 'Hazlo breve y con crema.';
  }
  if (model.state === 'golden_hour') {
    return 'Luz suave y agradable.';
  }
  if (score >= 70) {
    return 'Buena franja con protección.';
  }
  if (score >= 45) {
    return 'Posible con protección.';
  }
  return 'Mejor no alargarlo.';
}

function shortRecommendationForCaminar(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm')) {
    return 'Mejor plan interior.';
  }
  if (hasReason(reasonCodes, 'current_rain')) {
    return 'Corto y con paraguas.';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor corto o cubierto.';
  }
  if (hasReason(reasonCodes, 'strong_wind') || (model.state === 'windy' && score < 58)) {
    return 'Mejor por zonas resguardadas.';
  }
  if (hasReason(reasonCodes, 'cloudy_but_dry')) {
    return 'Día gris, pero cómodo.';
  }
  if (score >= 75) {
    return 'Confort estable.';
  }
  if (score >= 55) {
    return 'Buen momento para salir.';
  }
  if (score >= 40) {
    return 'Con capa ligera.';
  }
  return 'Mejor no alargarlo.';
}

function shortRecommendationForTerraza(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm') || hasReason(reasonCodes, 'current_rain')) {
    return 'Mejor terraza cubierta.';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor cubierta por si acaso.';
  }
  if (hasReason(reasonCodes, 'strong_wind') || (model.state === 'windy' && score < 55)) {
    return 'Solo en zona resguardada.';
  }
  if (hasReason(reasonCodes, 'cloudy_but_dry')) {
    return 'Posible si no llueve.';
  }
  if (model.state === 'golden_hour') {
    return 'Franja agradable para terraza.';
  }
  if (score >= 70) {
    return 'Buen momento para sentarte fuera.';
  }
  if (score >= 50) {
    return 'Posible con capa ligera.';
  }
  return 'Ahora compensa poco.';
}

function shortRecommendationForRunning(score: number, model: RecommendationDerivation, reasonCodes: readonly ActivityReasonCode[]): string {
  if (hasReason(reasonCodes, 'storm')) {
    return 'Mejor entreno interior.';
  }
  if (hasReason(reasonCodes, 'current_rain')) {
    return 'Solo si es corto y protegido.';
  }
  if (hasReason(reasonCodes, 'upcoming_rain')) {
    return 'Mejor esperar o acortar.';
  }
  if (model.state === 'strong_sun' || hasReason(reasonCodes, 'high_uv')) {
    return 'Con protección y ritmo suave.';
  }
  if (hasReason(reasonCodes, 'strong_wind') || model.state === 'windy') {
    return 'Ritmo suave y ruta protegida.';
  }
  if (score >= 68) {
    return 'Buen ritmo para salida corta.';
  }
  if (score >= 50) {
    return 'Posible con intensidad moderada.';
  }
  return 'Mejor no alargarlo.';
}

export function buildActivityShortRecommendation(
  activityId: ActivityId,
  score: number,
  model: RecommendationDerivation,
  reasonCodes: readonly ActivityReasonCode[] = [],
): string {
  const shortRecommendationById: Record<ActivityId, string> = {
    tomar_sol: shortRecommendationForTomarSol(score, model, reasonCodes),
    caminar: shortRecommendationForCaminar(score, model, reasonCodes),
    terraza: shortRecommendationForTerraza(score, model, reasonCodes),
    running_suave: shortRecommendationForRunning(score, model, reasonCodes),
  };

  return shortRecommendationById[activityId];
}
