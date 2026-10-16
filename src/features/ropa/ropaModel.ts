import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { resolveTimeframeHourlyIndex, snapshotFromHourlyPoint, type DayTimeframe } from '@/src/domain/forecast/forecastTimeframes';
import { buildRecommendations } from '@/src/features/recommendations/engine';
import { getWeatherStateLabel } from '@/src/features/recommendations/recommendationCatalog';
import type {
  OutfitRecommendation,
  RecommendationBundle,
  ThermalProfile,
  WeatherState,
} from '@/src/types/recommendations';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const thermalProfileLabels: Record<ThermalProfile, string> = {
  friolero: 'Friolero',
  normal: 'Normal',
  caluroso: 'Caluroso',
};

const momentLabels: Record<DayTimeframe, string> = {
  ahora: 'Ahora',
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
};

const momentIcons: Record<DayTimeframe, IconName> = {
  ahora: 'clock-time-four-outline',
  manana: 'weather-sunset-up',
  tarde: 'weather-sunset',
  noche: 'weather-night',
};

const outfitFieldLabels: Record<keyof Pick<OutfitRecommendation, 'superior' | 'capa' | 'calzado' | 'accesorios'>, string> = {
  superior: 'superior',
  capa: 'capa',
  calzado: 'calzado',
  accesorios: 'accesorios',
};

export interface RopaMomentComparison {
  id: DayTimeframe;
  label: string;
  iconName: IconName;
  timeLabel: string;
  stateLabel: string;
  outfit: OutfitRecommendation;
  changeSummary: string;
  subtleReason: string;
}

interface RopaReasoningItem {
  id: string;
  iconName: IconName;
  title: string;
  detail: string;
}

interface RopaSummary {
  title: string;
  support: string;
}

export interface RopaViewModel {
  cityName: string;
  thermalProfileLabel: string;
  summary: RopaSummary;
  currentOutfit: OutfitRecommendation;
  moments: RopaMomentComparison[];
  reasoning: RopaReasoningItem[];
}

function summaryByState(state: WeatherState): RopaSummary {
  const summaryMap: Record<WeatherState, RopaSummary> = {
    pleasant_sunny: {
      title: 'Ligero y cómodo',
      support: 'Mantén una capa fina a mano.',
    },
    strong_sun: {
      title: 'Ligero con protección',
      support: 'Tejido fresco y accesorios solares.',
    },
    soft_cloudy: {
      title: 'Equilibrio versátil',
      support: 'Pocos cambios durante el día.',
    },
    rainy: {
      title: 'Protección frente a lluvia',
      support: 'Impermeable y calzado cerrado.',
    },
    windy: {
      title: 'Capa contra rachas',
      support: 'Viento con impacto en confort.',
    },
    cool_evening: {
      title: 'Refresca más tarde',
      support: 'Conviene capa extra al final del día.',
    },
    golden_hour: {
      title: 'Franja agradable y ligera',
      support: 'Añade capa fina para la vuelta.',
    },
    night_clear: {
      title: 'Noche limpia con fresco',
      support: 'Ajusta capa según viento.',
    },
  };

  return summaryMap[state];
}

function compareOutfit(base: OutfitRecommendation, next: OutfitRecommendation): string {
  const changedFields = (Object.keys(outfitFieldLabels) as Array<keyof typeof outfitFieldLabels>).filter(
    (field) => base[field] !== next[field],
  );

  if (changedFields.length === 0) {
    return 'Sin cambios.';
  }

  if (changedFields.length === 1) {
    return `Ajusta ${outfitFieldLabels[changedFields[0]]}.`;
  }

  if (changedFields.length === 2) {
    return `Ajusta ${outfitFieldLabels[changedFields[0]]} y ${outfitFieldLabels[changedFields[1]]}.`;
  }

  return 'Conviene ajustar varias piezas.';
}

function subtleReasonForMoment(
  basePoint: HourlyForecastPoint,
  targetPoint: HourlyForecastPoint,
  moment: DayTimeframe,
): string {
  if (targetPoint.precipitationProbability >= 45 || targetPoint.precipitationMm >= 0.3) {
    return 'Sube lluvia: mejor capa protectora.';
  }

  if (targetPoint.windSpeedKmh >= 24 || targetPoint.windGustKmh >= 38) {
    return 'Sube viento: conviene cerrar la capa.';
  }

  const apparentDelta = targetPoint.apparentTemperatureC - basePoint.apparentTemperatureC;
  if (apparentDelta <= -3) {
    return 'Baja la sensación: añade capa.';
  }
  if (apparentDelta >= 3) {
    return 'Sube la sensación: puedes aligerar.';
  }

  if (moment === 'noche' && targetPoint.humidityPct >= 80) {
    return 'Humedad alta: puede sentirse más fresco.';
  }

  if (moment === 'manana' && !targetPoint.isDay) {
    return 'Aún sin franja clara de mañana: lectura aproximada.';
  }

  return 'Condición estable.';
}

function buildReasoning(
  snapshot: WeatherSnapshot,
  recommendations: RecommendationBundle,
  thermalProfile: ThermalProfile,
  moments: readonly RopaMomentComparison[],
): RopaReasoningItem[] {
  const profileReasonMap: Record<ThermalProfile, string> = {
    friolero: 'Perfil friolero: capa antes y más tiempo.',
    normal: 'Perfil normal: equilibrio entre abrigo y ventilación.',
    caluroso: 'Perfil caluroso: tejidos ligeros por más tiempo.',
  };

  const windAndRainDetail =
    snapshot.current.precipitationProbability >= 45
      ? 'La lluvia manda capa y calzado.'
      : snapshot.current.windSpeedKmh >= 20
        ? 'El viento pesa más que la temperatura nominal.'
        : 'Temperatura y humedad permiten un ajuste ligero.';

  const finalMoment = moments[moments.length - 1];
  const transitionDetail = finalMoment
    ? `${momentLabels[finalMoment.id]}: ${finalMoment.changeSummary.toLowerCase()} ${finalMoment.subtleReason}`
    : 'Sin datos para transición de vestuario.';

  return [
    {
      id: 'perfil',
      iconName: 'account-cog-outline',
      title: `Perfil térmico: ${thermalProfileLabels[thermalProfile]}`,
      detail: profileReasonMap[thermalProfile],
    },
    {
      id: 'clima',
      iconName: 'weather-partly-rainy',
      title: `Contexto actual: ${getWeatherStateLabel(recommendations.state)}`,
      detail: windAndRainDetail,
    },
    {
      id: 'transicion',
      iconName: 'timeline-clock-outline',
      title: 'Evolución del día',
      detail: transitionDetail,
    },
  ];
}

function fallbackHourlyPointFromCurrent(snapshot: WeatherSnapshot): HourlyForecastPoint {
  return {
    timeISO: snapshot.current.timeISO,
    temperatureC: snapshot.current.temperatureC,
    apparentTemperatureC: snapshot.current.apparentTemperatureC,
    weatherCode: snapshot.current.weatherCode,
    isDay: snapshot.current.isDay,
    windSpeedKmh: snapshot.current.windSpeedKmh,
    windGustKmh: snapshot.current.windGustKmh,
    uvIndex: snapshot.current.uvIndex,
    precipitationProbability: snapshot.current.precipitationProbability,
    precipitationMm: snapshot.current.precipitationMm,
    cloudCoverPct: snapshot.current.cloudCoverPct,
    humidityPct: snapshot.current.humidityPct,
  };
}

function buildMomentComparison(
  snapshot: WeatherSnapshot,
  thermalProfile: ThermalProfile,
  nowOutfit: OutfitRecommendation,
  timeframe: DayTimeframe,
): RopaMomentComparison {
  const basePoint = snapshot.hourly[0] ?? fallbackHourlyPointFromCurrent(snapshot);

  if (timeframe === 'ahora') {
    return {
      id: 'ahora',
      label: momentLabels.ahora,
      iconName: momentIcons.ahora,
      timeLabel: 'Ahora',
      stateLabel: 'Condición actual',
      outfit: nowOutfit,
      changeSummary: 'Base de referencia',
      subtleReason: `Sensación ${Math.round(basePoint.apparentTemperatureC)}° y viento ${Math.round(basePoint.windSpeedKmh)} km/h.`,
    };
  }

  const hourlyIndex = resolveTimeframeHourlyIndex(snapshot.hourly, timeframe);
  const point = snapshot.hourly[hourlyIndex] ?? basePoint;
  const shiftedSnapshot = snapshotFromHourlyPoint(snapshot, hourlyIndex);
  const derived = buildRecommendations(shiftedSnapshot, { thermalProfile });

  return {
    id: timeframe,
    label: momentLabels[timeframe],
    iconName: momentIcons[timeframe],
    timeLabel: formatClock(point.timeISO),
    stateLabel: getWeatherStateLabel(derived.state),
    outfit: derived.outfit,
    changeSummary: compareOutfit(nowOutfit, derived.outfit),
    subtleReason: subtleReasonForMoment(basePoint, point, timeframe),
  };
}

export function buildRopaViewModel(
  snapshot: WeatherSnapshot,
  recommendations: RecommendationBundle,
  thermalProfile: ThermalProfile,
): RopaViewModel {
  const nowOutfit = recommendations.outfit;
  const moments: RopaMomentComparison[] = [
    buildMomentComparison(snapshot, thermalProfile, nowOutfit, 'ahora'),
    buildMomentComparison(snapshot, thermalProfile, nowOutfit, 'manana'),
    buildMomentComparison(snapshot, thermalProfile, nowOutfit, 'tarde'),
    buildMomentComparison(snapshot, thermalProfile, nowOutfit, 'noche'),
  ];

  return {
    cityName: snapshot.cityName,
    thermalProfileLabel: thermalProfileLabels[thermalProfile],
    summary: summaryByState(recommendations.state),
    currentOutfit: nowOutfit,
    moments,
    reasoning: buildReasoning(snapshot, recommendations, thermalProfile, moments),
  };
}
