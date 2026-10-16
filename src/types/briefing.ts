import type { WeatherState } from '@/src/types/recommendations';

export type DailyBriefMoment = 'manana' | 'tarde' | 'noche_siguiente';

export type DailyBriefConfidence = 'alta' | 'media' | 'baja';

export interface DailyBrief {
  id: string;
  cityName: string;
  moment: DailyBriefMoment;
  targetTimeLabel: string;
  weatherState: WeatherState;
  shortLine: string;
  supportLine: string;
  confidence: DailyBriefConfidence;
  confidenceLabel: string;
  routineHint?: string;
  generatedAtISO: string;
}

export interface DailyBriefBundle {
  current: DailyBrief;
  byMoment: Record<DailyBriefMoment, DailyBrief>;
}
