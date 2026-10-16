import type { DailyBriefMoment } from '@/src/types/briefing';
import type { SelectedLocationRef } from '@/src/types/location';
import type { PlanType } from '@/src/types/planning';
import type { ActivityRecommendation, RecommendationBundle, WeatherState } from '@/src/types/recommendations';
import type { UserRoutine } from '@/src/types/routines';

function normalizeSentence(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function joinSentences(parts: string[]): string {
  return parts
    .map(normalizeSentence)
    .filter((part) => part.length > 0)
    .join(' ');
}

function trimToLength(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  const shortened = value.slice(0, maxLength - 1).trimEnd();
  return `${shortened}…`;
}

function compactOutfitText(value: string): string {
  const compact = value
    .split(/[,+/]/)[0]
    .trim()
    .toLowerCase();
  return compact.length > 0 ? compact : value.toLowerCase();
}

function leadByState(state: WeatherState): string {
  const leadMap: Record<WeatherState, string> = {
    pleasant_sunny: 'Día amable.',
    strong_sun: 'Sol intenso.',
    soft_cloudy: 'Nubes suaves.',
    rainy: 'Lluvia suave.',
    windy: 'Brisa con carácter.',
    cool_evening: 'Fresco en aumento.',
    golden_hour: 'Luz dorada.',
    night_clear: 'Noche limpia.',
  };
  return leadMap[state];
}

function buildOutfitSentence(recommendations: RecommendationBundle): string {
  if (recommendations.state === 'rainy') {
    return `Paraguas, ${compactOutfitText(recommendations.outfit.calzado)} y capa protectora.`;
  }
  if (recommendations.state === 'strong_sun') {
    return `${compactOutfitText(recommendations.outfit.superior)} y protección solar visible.`;
  }
  if (recommendations.state === 'windy') {
    return `${compactOutfitText(recommendations.outfit.capa)} para sostener confort.`;
  }
  if (recommendations.state === 'cool_evening' || recommendations.state === 'night_clear') {
    return `${compactOutfitText(recommendations.outfit.capa)} y calzado cerrado.`;
  }
  return `${compactOutfitText(recommendations.outfit.superior)} y ${compactOutfitText(recommendations.outfit.calzado)}.`;
}

function findActivity(
  recommendations: RecommendationBundle,
  id: ActivityRecommendation['id'],
): ActivityRecommendation | null {
  return recommendations.activities.find((activity) => activity.id === id) ?? null;
}

function buildActivitySentence(recommendations: RecommendationBundle, selectedPlanType: PlanType): string {
  if (recommendations.state === 'rainy') {
    return 'Mejor interior o salidas muy cortas.';
  }

  if (recommendations.state === 'strong_sun') {
    return 'Paseo mejor al atardecer.';
  }

  if (recommendations.state === 'windy') {
    return 'Evita la terraza abierta.';
  }

  const selectedPlan = recommendations.planning.plans[selectedPlanType];
  if (selectedPlan) {
    return `${selectedPlan.bestMoment}.`;
  }

  const walking = findActivity(recommendations, 'caminar');
  if (walking?.detail) {
    return `Caminar: ${walking.detail.toLowerCase()}.`;
  }

  const terrace = findActivity(recommendations, 'terraza');
  if (terrace?.tone === 'recomendado') {
    return 'Terraza posible en zona resguardada.';
  }

  return 'Buen momento para salir con ajustes ligeros.';
}

function routineMatchesLocation(routine: UserRoutine, selectedLocation: SelectedLocationRef): boolean {
  if (routine.locationContext.kind === 'sin_contexto') {
    return true;
  }
  if (routine.locationContext.kind === 'actual') {
    return selectedLocation.kind === 'current';
  }
  return selectedLocation.kind === 'saved' && selectedLocation.id === routine.locationContext.locationId;
}

function routineMomentForBriefMoment(moment: DailyBriefMoment): UserRoutine['preferredMoment'] {
  if (moment === 'manana') {
    return 'manana';
  }
  if (moment === 'tarde') {
    return 'tarde';
  }
  return 'noche';
}

function buildRoutineHint(params: {
  moment: DailyBriefMoment;
  routines: UserRoutine[];
  selectedLocation: SelectedLocationRef;
  recommendations: RecommendationBundle;
  selectedPlanType: PlanType;
}): string | undefined {
  const preferredMoment = routineMomentForBriefMoment(params.moment);
  const routine = params.routines.find(
    (item) =>
      item.enabled &&
      item.preferredMoment === preferredMoment &&
      routineMatchesLocation(item, params.selectedLocation),
  );

  if (!routine) {
    return undefined;
  }

  if (routine.type === 'paseo_perro') {
    return `Para ${routine.title.toLowerCase()}, ${buildActivitySentence(params.recommendations, params.selectedPlanType).toLowerCase()}`;
  }
  if (routine.type === 'caminar_tarde') {
    return `Para ${routine.title.toLowerCase()}, prioriza la franja ${params.recommendations.bestNextWindow.label}.`;
  }
  if (routine.type === 'ir_uni') {
    return `Para ${routine.title.toLowerCase()}, sal con ${compactOutfitText(params.recommendations.outfit.capa)} de respaldo.`;
  }
  return `Para ${routine.title.toLowerCase()}, lleva una capa ligera de apoyo.`;
}

export function buildDailyBriefLines(params: {
  moment: DailyBriefMoment;
  recommendations: RecommendationBundle;
  selectedPlanType: PlanType;
  selectedLocation: SelectedLocationRef;
  routines: UserRoutine[];
}): {
  shortLine: string;
  supportLine: string;
  routineHint?: string;
} {
  const lead = leadByState(params.recommendations.state);
  const outfitSentence = buildOutfitSentence(params.recommendations);
  const activitySentence = buildActivitySentence(params.recommendations, params.selectedPlanType);
  const routineHint = buildRoutineHint({
    moment: params.moment,
    routines: params.routines,
    selectedLocation: params.selectedLocation,
    recommendations: params.recommendations,
    selectedPlanType: params.selectedPlanType,
  });

  const shortLine = trimToLength(joinSentences([lead, outfitSentence, activitySentence]), 110);
  const supportLine = joinSentences([
    `Mejor ventana ${params.recommendations.bestNextWindow.label}.`,
    params.recommendations.mainHeadline,
    params.recommendations.forecastConfidence.rainStatement,
    params.recommendations.forecastConfidence.umbrellaAdvice.toLowerCase().includes('paraguas')
      ? params.recommendations.forecastConfidence.umbrellaAdvice
      : '',
    routineHint ?? '',
  ]);

  return {
    shortLine,
    supportLine,
    routineHint,
  };
}
