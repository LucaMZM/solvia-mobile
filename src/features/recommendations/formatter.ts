import {
  getActivityLabel,
  getAtmosphereForState,
  getNarrativeForState,
} from '@/src/features/recommendations/recommendationCatalog';
import type { ActivityReasonCode, RecommendationDerivation } from '@/src/features/recommendations/derivation';
import {
  getSafeRecommendationLabel,
  safeCopy,
  type SafeRecommendationLabel,
} from '@/src/features/recommendations/recommendationPolicy';
import { buildPlanningBundle } from '@/src/features/planning/modePlanEngine';
import {
  buildActivityShortRecommendation,
  toneFromScore,
} from '@/src/features/recommendations/activityCopy';
import {
  buildUvSupport,
  buildWindSupport,
  estimateSafeMinutes,
  uvLevelLabel,
} from '@/src/features/recommendations/recommendationInsights';
import { formatOutfitRecommendation } from '@/src/features/recommendations/outfitFormatter';
import type {
  ActivityId,
  ActivityRecommendation,
  BestNextWindowRecommendation,
  RecommendationBundle,
} from '@/src/types/recommendations';
import type { PlanWindowResult, PlanningBundle } from '@/src/types/planning';
import { toHourLabel } from '@/src/utils/date';

function toneFromSafeLabel(label: SafeRecommendationLabel, fallbackTone: ActivityRecommendation['tone']): ActivityRecommendation['tone'] {
  if (label === 'No recomendado' || label === 'Mejor esperar') return 'no_recomendado';
  if (label === 'Solo cubierto') return 'interior';
  if (label === 'Con ajustes' || label === 'Mejor corto' || label === 'Con paraguas' || label === 'Con capa') return 'desafiante';
  if (label === 'Con protección' || label === 'Posible') return 'posible';
  if (label === 'Viable') return 'posible';
  return fallbackTone;
}

function mapActivityRecommendations(
  model: RecommendationDerivation,
  _planning: PlanningBundle | null,
): ActivityRecommendation[] {
  return model.activities.map((assessment) => {
    let tone = toneFromScore(assessment.score);
    const safeLabel = getSafeRecommendationLabel(assessment.id, model.riskProfile, assessment.score);
    const hasReason = (reason: ActivityReasonCode) => assessment.reasonCodes.includes(reason);

    if (hasReason('storm')) {
      tone = assessment.id === 'terraza' ? 'interior' : 'no_recomendado';
    } else if (assessment.id === 'tomar_sol' && (!model.signals.snapshot.current.isDay || hasReason('current_rain') || hasReason('upcoming_rain'))) {
      tone = 'no_recomendado';
    } else if (assessment.id === 'caminar' && hasReason('current_rain')) {
      tone = 'posible';
    } else if (assessment.id === 'caminar' && hasReason('upcoming_rain')) {
      tone = 'desafiante';
    } else if (assessment.id === 'terraza' && (hasReason('current_rain') || hasReason('upcoming_rain'))) {
      tone = 'interior';
    } else if (assessment.id === 'running_suave' && (hasReason('current_rain') || hasReason('upcoming_rain'))) {
      tone = hasReason('current_rain') ? 'no_recomendado' : 'desafiante';
    } else if (assessment.id === 'caminar' && model.state === 'windy' && assessment.score < 58) {
      tone = 'zonas_protegidas';
    } else if (assessment.id === 'terraza' && model.state === 'rainy') {
      tone = 'interior';
    }
    tone = toneFromSafeLabel(safeLabel, tone);

    return {
      id: assessment.id,
      label: getActivityLabel(assessment.id),
      tone,
      detail: safeLabel,
      shortRecommendation: safeCopy(
        buildActivityShortRecommendation(assessment.id, assessment.score, model, assessment.reasonCodes),
        model.riskProfile,
      ),
      muted: tone === 'evitar' || tone === 'no_recomendado' || tone === 'interior',
    };
  });
}

function formatBestWindow(window: PlanWindowResult): BestNextWindowRecommendation {
  return {
    label: `${toHourLabel(window.startISO)}–${toHourLabel(window.endISO)}`,
    reason: window.reason,
    startISO: window.startISO,
    endISO: window.endISO,
  };
}

export function formatRecommendationBundle(model: RecommendationDerivation): RecommendationBundle {
  const narrativeSeed = Math.round(
    model.stateScores[model.state] + model.signals.nowHour + model.signals.snapshot.current.humidityPct,
  );
  const narrative = getNarrativeForState(model.state, narrativeSeed);
  const outfit = formatOutfitRecommendation(model);
  const planning = buildPlanningBundle({
    snapshot: model.signals.snapshot,
    thermalProfile: model.signals.thermalProfile,
    outfit,
  });
  const isDay = model.signals.snapshot.current.isDay;
  const uvAvailable = isDay && model.signals.snapshot.current.uvStatus === 'available';

  return {
    state: model.state,
    atmosphere: getAtmosphereForState(model.state),
    mainHeadline: safeCopy(narrative.headline, model.riskProfile),
    supportCopy: safeCopy(narrative.support, model.riskProfile),
    forecastConfidence: planning.confidence,
    planning,
    activities: mapActivityRecommendations(model, planning),
    sunUv: {
      uvIndex: isDay ? Number(model.signals.snapshot.current.uvIndex.toFixed(1)) : 0,
      levelLabel: !isDay ? 'Inactivo' : uvAvailable ? uvLevelLabel(model.signals.snapshot.current.uvIndex) : 'Sin datos',
      support: !isDay
        ? 'Sin exposición UV a esta hora.'
        : uvAvailable
          ? buildUvSupport(model)
          : 'No hay una lectura UV fiable ahora.',
      maxSafeMinutesWithoutProtection: uvAvailable
        ? estimateSafeMinutes(
            model.signals.snapshot.current.uvIndex,
            model.signals.snapshot.current.cloudCoverPct,
          )
        : 0,
    },
    outfit,
    wind: {
      speedKmh: Number(model.signals.snapshot.current.windSpeedKmh.toFixed(0)),
      support: buildWindSupport(model),
    },
    bestNextWindow: formatBestWindow(planning.windows.caminar),
    highlightedModule: model.highlightedModule,
  };
}
