import { useMemo } from 'react';

import { buildSolViewModel } from '@/src/features/sol/solModel';
import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';

export function useSolScreenModel() {
  const briefing = useWeatherBriefing();

  const model = useMemo(() => {
    if (!briefing.snapshot || !briefing.recommendations) {
      return null;
    }

    return buildSolViewModel(briefing.snapshot, briefing.recommendations);
  }, [briefing.recommendations, briefing.snapshot]);

  return {
    ...briefing,
    model,
  };
}
