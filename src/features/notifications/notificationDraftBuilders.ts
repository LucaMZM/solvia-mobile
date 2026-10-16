import { planTypeLabels } from '@/src/features/planning/catalog';
import { getLocalHour, minutesBetweenLocalIso } from '@/src/services/weather/localTime';
import type { RecommendationBundle } from '@/src/types/recommendations';
import type { DecisionNotificationDraft } from '@/src/types/notifications';
import type { UserRoutine } from '@/src/types/routines';
import type { SelectedLocationRef } from '@/src/types/location';
import type { CarTrayectoAnalysis } from '@/src/types/trayecto';
import type { WeatherSnapshot } from '@/src/types/weather';

function leadTimeTriggerISO(targetISO: string, leadMinutes: number, fallbackMinutes = 2): string {
  const now = Date.now();
  const targetMs = new Date(targetISO).getTime();
  const suggested = targetMs - leadMinutes * 60_000;
  const minAllowed = now + fallbackMinutes * 60_000;
  return new Date(Math.max(suggested, minAllowed)).toISOString();
}

function minutesUntil(isoDate: string, referenceISO: string): number {
  return minutesBetweenLocalIso(referenceISO, isoDate);
}

function normalizeCategoryKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function preferredMomentMatchesISO(
  preferredMoment: UserRoutine['preferredMoment'],
  isoDate: string,
): boolean {
  const hour = getLocalHour(isoDate);
  if (preferredMoment === 'manana') {
    return hour >= 6 && hour < 13;
  }
  if (preferredMoment === 'tarde') {
    return hour >= 13 && hour < 20;
  }
  return hour >= 20 || hour < 6;
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

function planTypeFromRoutine(routine: UserRoutine): keyof RecommendationBundle['planning']['plans'] {
  if (routine.type === 'caminar_tarde') {
    return 'caminar';
  }
  if (routine.type === 'paseo_perro') {
    return 'paseo_perro';
  }
  return 'trayecto';
}

function isDecisionNotificationDraft(
  draft: DecisionNotificationDraft | null,
): draft is DecisionNotificationDraft {
  return draft !== null;
}

export function buildAdaptiveWeatherChangeDrafts(input: {
  snapshot: WeatherSnapshot;
  recommendations: RecommendationBundle;
}): DecisionNotificationDraft[] {
  const { snapshot, recommendations } = input;
  const horizon = snapshot.hourly.slice(0, 8);
  if (horizon.length === 0) {
    return [];
  }

  const nowISO = snapshot.current.timeISO;
  const nowUv = snapshot.current.uvIndex;
  const nowRain = snapshot.current.precipitationProbability;
  const nowWind = snapshot.current.windSpeedKmh;
  const drafts: DecisionNotificationDraft[] = [];

  const uvRise = horizon.find(
    (point) =>
      point.isDay &&
      point.uvIndex >= 6 &&
      point.uvIndex - nowUv >= 2.4 &&
      minutesUntil(point.timeISO, nowISO) >= 20 &&
      minutesUntil(point.timeISO, nowISO) <= 140,
  );
  if (uvRise) {
    const eta = minutesUntil(uvRise.timeISO, nowISO);
    drafts.push({
      dedupeKey: `adaptive-uv-rise-${snapshot.cityName}-${uvRise.timeISO}`,
      category: 'weather_adaptive',
      title: 'Sube el UV en breve',
      body: `Sube el UV en ${eta} min. Mejor crema si sales.`,
      triggerAtISO: leadTimeTriggerISO(uvRise.timeISO, 30),
    });
  }

  const cooling = horizon.find(
    (point) =>
      point.apparentTemperatureC <= snapshot.current.apparentTemperatureC - 3 &&
      minutesUntil(point.timeISO, nowISO) >= 45 &&
      minutesUntil(point.timeISO, nowISO) <= 240,
  );
  if (cooling) {
    drafts.push({
      dedupeKey: `adaptive-cooling-${snapshot.cityName}-${cooling.timeISO}`,
      category: 'weather_adaptive',
      title: 'Refresca al atardecer',
      body: 'Refresca al atardecer. Llévate una capa ligera.',
      triggerAtISO: leadTimeTriggerISO(cooling.timeISO, 35),
    });
  }

  const windRise = horizon.find(
    (point) =>
      point.windSpeedKmh >= Math.max(26, nowWind + 9) &&
      minutesUntil(point.timeISO, nowISO) >= 30 &&
      minutesUntil(point.timeISO, nowISO) <= 240,
  );
  if (windRise) {
    drafts.push({
      dedupeKey: `adaptive-wind-rise-${snapshot.cityName}-${windRise.timeISO}`,
      category: 'weather_adaptive',
      title: 'Viento en aumento',
      body: 'Viento más fuerte de lo normal esta tarde.',
      triggerAtISO: leadTimeTriggerISO(windRise.timeISO, 45),
    });
  }

  const rainStart = horizon.find(
    (point) =>
      (point.precipitationProbability >= 55 || point.precipitationMm >= 0.4) &&
      nowRain <= 35 &&
      minutesUntil(point.timeISO, nowISO) >= 20 &&
      minutesUntil(point.timeISO, nowISO) <= 180,
  );
  if (rainStart) {
    drafts.push({
      dedupeKey: `adaptive-rain-start-${snapshot.cityName}-${rainStart.timeISO}`,
      category: 'weather_adaptive',
      title: 'Lluvia en camino',
      body: recommendations.forecastConfidence.umbrellaAdvice.toLowerCase().includes('paraguas')
        ? 'Lluvia probable, pero no segura. Mejor llevar paraguas por si acaso.'
        : 'Puede entrar lluvia más tarde. Revisa tu hora de vuelta.',
      triggerAtISO: leadTimeTriggerISO(rainStart.timeISO, 40),
    });
  }

  const selectedPlan = recommendations.planning.plans.caminar;
  if (selectedPlan.status === 'recomendado' && selectedPlan.window.shouldDoNow) {
    drafts.push({
      dedupeKey: `adaptive-go-out-now-${snapshot.cityName}-${snapshot.current.timeISO.slice(0, 13)}`,
      category: 'weather_adaptive',
      title: 'Ahora sí apetece salir',
      body: `Tu mejor momento para caminar es entre ${selectedPlan.window.label}.`,
      triggerAtISO: leadTimeTriggerISO(snapshot.current.timeISO, 0, 3),
    });
  }

  return drafts.slice(0, 2);
}

export function buildRoutineNotificationDrafts(input: {
  snapshot: WeatherSnapshot;
  recommendations: RecommendationBundle;
  routines: UserRoutine[];
  selectedLocation: SelectedLocationRef;
}): DecisionNotificationDraft[] {
  const { snapshot, recommendations, routines, selectedLocation } = input;
  const nowISO = snapshot.current.timeISO;

  const drafts = routines
    .filter((routine) => routine.enabled && routineMatchesLocation(routine, selectedLocation))
    .map<DecisionNotificationDraft | null>((routine) => {
      const planType = planTypeFromRoutine(routine);
      const guidance = recommendations.planning.plans[planType];
      if (!guidance || guidance.status === 'evitar' || guidance.window.score < 44) {
        return null;
      }

      const bestStartISO = guidance.window.startISO;
      const minutesToWindow = minutesUntil(bestStartISO, nowISO);
      if (minutesToWindow > 12 * 60 || minutesToWindow < -20) {
        return null;
      }
      if (!preferredMomentMatchesISO(routine.preferredMoment, bestStartISO)) {
        return null;
      }

      return {
        dedupeKey: `routine-${normalizeCategoryKey(routine.id)}-${routine.preferredMoment}-${guidance.window.startISO}`,
        category: 'routine' as const,
        title: `Rutina: ${routine.title}`,
        body:
          planType === 'trayecto'
            ? `${guidance.doNowOrLater} ${guidance.weatherRiskSummary}`
            : `Tu mejor momento para ${planTypeLabels[planType].toLowerCase()} es entre ${guidance.window.label}.`,
        triggerAtISO: leadTimeTriggerISO(bestStartISO, 25),
      };
    })
    .filter(isDecisionNotificationDraft);

  return drafts.slice(0, 2);
}

export function buildRouteTripNotificationDraft(input: {
  analysis: CarTrayectoAnalysis;
  departureISO: string;
  originName: string;
  destinationName: string;
}): DecisionNotificationDraft | null {
  const { analysis, departureISO, originName, destinationName } = input;
  const summary = analysis.summary.toLowerCase();
  const leaveDecision = analysis.leaveDecision;
  const title = `Trayecto ${originName} → ${destinationName}`;

  let body = leaveDecision;
  if (analysis.umbrellaRecommended && summary.includes('lluvia')) {
    body = 'Si sales ahora, te lloverá en la vuelta. Mejor paraguas y salida con margen.';
  } else if (leaveDecision.toLowerCase().includes('salir')) {
    body = leaveDecision;
  } else if (summary.includes('viento')) {
    body = 'Viento más fuerte en ruta. Mejor salir con margen y evitar paradas largas.';
  }

  return {
    dedupeKey: `route-trip-${normalizeCategoryKey(originName)}-${normalizeCategoryKey(destinationName)}-${departureISO.slice(0, 16)}`,
    category: 'route_trip',
    title,
    body,
    triggerAtISO: leadTimeTriggerISO(departureISO, 20),
  };
}
