import { useMemo } from 'react';

import { buildRopaViewModel } from '@/src/features/ropa/ropaModel';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { usePreferencesStore } from '@/src/state/preferencesStore';

export function useRopaScreenModel() {
  const briefing = useWeatherBriefing();
  const thermalProfile = usePreferencesStore((state) => state.thermalProfile);

  const model = useMemo(() => {
    if (!briefing.snapshot || !briefing.recommendations) {
      return null;
    }

    return buildRopaViewModel(briefing.snapshot, briefing.recommendations, thermalProfile);
  }, [briefing.recommendations, briefing.snapshot, thermalProfile]);

  return {
    ...briefing,
    model,
  };
}
