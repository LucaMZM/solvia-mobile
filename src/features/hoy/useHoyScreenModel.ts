import { useWeatherBriefing } from '@/src/hooks/useWeatherBriefing';
import { usePreferencesStore } from '@/src/state/preferencesStore';

export function useHoyScreenModel() {
  const briefing = useWeatherBriefing();
  const selectedPlanType = usePreferencesStore((state) => state.planModeType);
  const setSelectedPlanType = usePreferencesStore((state) => state.setPlanModeType);

  return {
    ...briefing,
    selectedPlanType,
    setSelectedPlanType,
  };
}
