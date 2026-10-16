import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { getWeatherStateLabel } from '@/src/features/recommendations/recommendationCatalog';
import { compareLocalIso, getLocalHour } from '@/src/services/weather/localTime';
import type { RecommendationBundle, WeatherState } from '@/src/types/recommendations';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type ConfidenceTone = 'alta' | 'media' | 'baja';

interface ConfidenceIndicator {
  tone: ConfidenceTone;
  label: string;
  support: string;
}

interface SolBestWindow {
  label: string;
  support: string;
  startISO: string | null;
  endISO: string | null;
  partOfDayLabel: string;
}

export interface SolUvChartPoint {
  id: string;
  timeISO: string;
  hourLabel: string;
  uvIndex: number;
  isDay: boolean;
  isInBestWindow: boolean;
}

export interface SolReminder {
  id: string;
  iconName: IconName;
  title: string;
  detail: string;
}

export interface SolViewModel {
  cityName: string;
  weatherState: WeatherState;
  isDay: boolean;
  uvCurrent: number;
  uvAvailable: boolean;
  uvMaxForecast: number;
  sunStateLabel: string;
  intensityHeadline: string;
  intensitySupport: string;
  confidence: ConfidenceIndicator;
  bestWindow: SolBestWindow;
  sunriseLabel: string;
  sunsetLabel: string;
  chartPoints: SolUvChartPoint[];
  reminders: SolReminder[];
}

interface BestWindowAssessment {
  startISO: string | null;
  endISO: string | null;
  score: number;
  support: string;
}

function partOfDayLabelFromIso(isoDate: string | null): string {
  if (!isoDate) {
    return 'sin ventana clara';
  }

  const hour = getLocalHour(isoDate);
  if (hour < 12) {
    return 'por la mañana';
  }
  if (hour < 18) {
    return 'por la tarde';
  }
  return 'al final del día';
}

function confidenceFromRecommendations(recommendations: RecommendationBundle): ConfidenceIndicator {
  const toneMap: Record<RecommendationBundle['forecastConfidence']['tone'], ConfidenceTone> = {
    alta_confianza: 'alta',
    confianza_media: 'media',
    puede_cambiar: 'baja',
  };

  return {
    tone: toneMap[recommendations.forecastConfidence.tone],
    label: recommendations.forecastConfidence.label,
    support: recommendations.forecastConfidence.rainStatement,
  };
}

function intensityNarrative(recommendations: RecommendationBundle, snapshot: WeatherSnapshot): {
  headline: string;
  support: string;
} {
  const uv = recommendations.sunUv.uvIndex;
  const rainRisk = snapshot.current.precipitationProbability;

  if (!snapshot.current.isDay) {
    return {
      headline: 'UV inactivo ahora',
      support: 'Sin exposición UV a esta hora.',
    };
  }

  if (rainRisk >= 55) {
    return {
      headline: 'Sol inestable por lluvia',
      support: 'Aprovecha solo ventanas cortas.',
    };
  }

  if (uv >= 8) {
    return {
      headline: 'UV alto: exposición breve',
      support: 'Protección alta y pausas en sombra.',
    };
  }

  if (uv >= 5) {
    return {
      headline: 'Intensidad media-alta',
      support: 'Buena franja con protección ligera.',
    };
  }

  if (uv >= 2) {
    return {
      headline: 'Intensidad suave',
      support: 'Contexto cómodo para exposición moderada.',
    };
  }

  return {
    headline: 'Intensidad baja',
    support: 'Mejor esperar más luz directa.',
  };
}

function buildReminders(snapshot: WeatherSnapshot, recommendations: RecommendationBundle): SolReminder[] {
  const uv = recommendations.sunUv.uvIndex;
  const apparent = snapshot.current.apparentTemperatureC;
  const rainRisk = snapshot.current.precipitationProbability;

  const sunscreenDetail =
    uv >= 8
      ? 'SPF alto y reaplicación frecuente.'
      : uv >= 5
        ? 'Protección media recomendada.'
        : uv >= 2
          ? 'Protección básica si te quedas fuera.'
          : 'Protección solar no prioritaria ahora.';

  const waterDetail =
    apparent >= 29
      ? 'Hidratación frecuente.'
      : apparent >= 23
        ? 'Hidratación regular.'
        : 'Hidratación ligera suficiente.';

  const shadeDetail =
    rainRisk >= 55
      ? 'Mejor zonas cubiertas.'
      : uv >= 7
        ? 'Alterna sol y sombra.'
        : uv >= 4
          ? 'Busca sombra en pausas.'
          : 'Sol suave con pausas naturales.';

  return [
    {
      id: 'protector',
      iconName: 'shield-sun-outline',
      title: 'Protección solar',
      detail: sunscreenDetail,
    },
    {
      id: 'agua',
      iconName: 'cup-water',
      title: 'Hidratación',
      detail: waterDetail,
    },
    {
      id: 'sombra',
      iconName: 'beach',
      title: 'Sombra y confort',
      detail: shadeDetail,
    },
  ];
}

function buildChartPoints(
  points: readonly HourlyForecastPoint[],
  bestWindow: BestWindowAssessment,
): SolUvChartPoint[] {
  const bestStartTime = bestWindow.startISO;
  const bestEndTime = bestWindow.endISO;

  return points.slice(0, 8).map((point) => {
    const isInBestWindow =
      bestStartTime != null &&
      bestEndTime != null &&
      compareLocalIso(point.timeISO, bestStartTime) >= 0 &&
      compareLocalIso(point.timeISO, bestEndTime) <= 0;

    return {
      id: point.timeISO,
      timeISO: point.timeISO,
      hourLabel: formatClock(point.timeISO),
      uvIndex: point.uvIndex,
      isDay: point.isDay,
      isInBestWindow,
    };
  });
}

export function buildSolViewModel(snapshot: WeatherSnapshot, recommendations: RecommendationBundle): SolViewModel {
  const sunWindow = recommendations.planning.windows.tomar_sol;
  const bestWindow: BestWindowAssessment = {
    startISO: sunWindow.startISO,
    endISO: sunWindow.endISO,
    score: sunWindow.score,
    support: sunWindow.reason,
  };
  const intensity = intensityNarrative(recommendations, snapshot);
  const confidence = confidenceFromRecommendations(recommendations);

  return {
    cityName: snapshot.cityName,
    weatherState: recommendations.state,
    isDay: snapshot.current.isDay,
    uvCurrent: Number(recommendations.sunUv.uvIndex.toFixed(1)),
    uvAvailable: snapshot.current.uvStatus === 'available',
    uvMaxForecast: Number(snapshot.daily.uvIndexMax.toFixed(1)),
    sunStateLabel: getWeatherStateLabel(recommendations.state),
    intensityHeadline: intensity.headline,
    intensitySupport: intensity.support,
    confidence,
    bestWindow: {
      label: bestWindow.score >= 40 ? sunWindow.label : 'Sin franja clara hoy',
      support: bestWindow.support,
      startISO: bestWindow.startISO,
      endISO: bestWindow.endISO,
      partOfDayLabel: partOfDayLabelFromIso(bestWindow.startISO),
    },
    sunriseLabel: formatClock(snapshot.daily.sunriseISO),
    sunsetLabel: formatClock(snapshot.daily.sunsetISO),
    chartPoints: buildChartPoints(snapshot.hourly, bestWindow),
    reminders: buildReminders(snapshot, recommendations),
  };
}
