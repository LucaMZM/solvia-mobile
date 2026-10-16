import type { RecommendationDerivation } from '@/src/features/recommendations/derivation';

export function uvLevelLabel(uvIndex: number): string {
  if (uvIndex < 3) {
    return 'Bajo';
  }
  if (uvIndex < 6) {
    return 'Moderado';
  }
  if (uvIndex < 8) {
    return 'Alto';
  }
  if (uvIndex < 11) {
    return 'Muy alto';
  }
  return 'Extremo';
}

export function estimateSafeMinutes(uvIndex: number, cloudCover: number): number {
  const base =
    uvIndex <= 2 ? 120 : uvIndex <= 4 ? 70 : uvIndex <= 6 ? 45 : uvIndex <= 8 ? 25 : 15;
  const cloudCompensation = cloudCover >= 70 ? 10 : cloudCover >= 50 ? 5 : 0;
  return Math.max(10, Math.round(base + cloudCompensation));
}

export function buildUvSupport(model: RecommendationDerivation): string {
  const uv = model.signals.snapshot.current.uvIndex;
  if (!model.signals.snapshot.current.isDay) {
    return 'Sin radiación UV relevante. Prioriza viento y sensación térmica.';
  }
  if (uv >= 9) {
    return 'Exposición corta y siempre con protección alta; busca sombra entre desplazamientos.';
  }
  if (uv >= 7) {
    return 'La radiación es alta: protector, gafas UV y pausas en sombra mejoran mucho el confort.';
  }
  if (uv >= 4) {
    return 'Nivel moderado: protección ligera si vas a estar fuera de forma continuada.';
  }
  return 'Radiación baja: puedes priorizar comodidad térmica sobre protección solar intensa.';
}

export function buildWindSupport(model: RecommendationDerivation): string {
  const speed = model.signals.snapshot.current.windSpeedKmh;
  const gust = model.signals.snapshot.current.windGustKmh;

  if (gust >= 55 || speed >= 34) {
    return 'Rachas marcadas: prioriza calles protegidas y capas con cierre frontal.';
  }
  if (gust >= 40 || speed >= 24) {
    return 'Viento presente: un cortavientos ligero estabiliza claramente la sensación térmica.';
  }
  if (speed >= 15) {
    return 'Brisa moderada, sin comprometer demasiado la movilidad exterior.';
  }
  return 'Viento suave y estable para desplazamientos cómodos.';
}
