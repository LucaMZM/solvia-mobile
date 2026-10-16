import { deriveRecommendationModel } from '@/src/features/recommendations/derivation';
import { formatRecommendationBundle } from '@/src/features/recommendations/formatter';
import type { RecommendationBundle, ThermalProfile } from '@/src/types/recommendations';
import type { WeatherSnapshot } from '@/src/types/weather';

interface RecommendationOptions {
  thermalProfile?: ThermalProfile;
}

export function buildRecommendations(
  snapshot: WeatherSnapshot,
  options: RecommendationOptions = {},
): RecommendationBundle {
  const thermalProfile = options.thermalProfile ?? 'normal';
  const model = deriveRecommendationModel(snapshot, thermalProfile);
  return formatRecommendationBundle(model);
}
