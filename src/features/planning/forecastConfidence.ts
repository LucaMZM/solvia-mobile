import type { ForecastConfidence, ForecastConfidenceTone } from '@/src/types/planning';
import type { HourlyForecastPoint, WeatherSnapshot } from '@/src/types/weather';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function toneLabels(tone: ForecastConfidenceTone): string {
  if (tone === 'alta_confianza') {
    return 'Alta confianza';
  }
  if (tone === 'confianza_media') {
    return 'Confianza media';
  }
  return 'Puede cambiar';
}

function confidenceSupport(tone: ForecastConfidenceTone): string {
  if (tone === 'alta_confianza') {
    return 'La previsión mantiene una línea estable para próximas horas.';
  }
  if (tone === 'confianza_media') {
    return 'La previsión es fiable, con margen para ajustes puntuales.';
  }
  return 'El escenario puede moverse durante el día; conviene revisar antes de salir.';
}

function rainNarrative(avgProbability: number, peakProbability: number): string {
  if (avgProbability >= 72 || peakProbability >= 82) {
    return 'Lluvia bastante probable.';
  }
  if (avgProbability >= 42 || peakProbability >= 58) {
    return 'Lluvia probable, pero no segura.';
  }
  if (peakProbability >= 35) {
    return 'Puede aparecer lluvia puntual.';
  }
  return 'Riesgo de lluvia bajo.';
}

function umbrellaNarrative(avgProbability: number, peakProbability: number): string {
  if (avgProbability >= 60 || peakProbability >= 75) {
    return 'Paraguas recomendable para ir tranquilo.';
  }
  if (avgProbability >= 35 || peakProbability >= 50) {
    return 'Mejor llevar paraguas por si acaso.';
  }
  return 'Paraguas no prioritario por ahora.';
}

function evaluateVolatility(points: readonly HourlyForecastPoint[]): number {
  if (points.length < 2) {
    return 0.45;
  }

  const rainValues = points.map((point) => point.precipitationProbability);
  const windValues = points.map((point) => point.windSpeedKmh);
  const cloudValues = points.map((point) => point.cloudCoverPct);

  const rainSwing = Math.max(...rainValues) - Math.min(...rainValues);
  const windSwing = Math.max(...windValues) - Math.min(...windValues);
  const cloudSwing = Math.max(...cloudValues) - Math.min(...cloudValues);
  const transitionCount = points.reduce((acc, point, index) => {
    if (index === 0) {
      return acc;
    }
    const previous = points[index - 1];
    const currentBand = point.precipitationProbability >= 45 ? 'wet' : point.cloudCoverPct >= 68 ? 'cloudy' : 'clear';
    const previousBand =
      previous.precipitationProbability >= 45 ? 'wet' : previous.cloudCoverPct >= 68 ? 'cloudy' : 'clear';
    return currentBand === previousBand ? acc : acc + 1;
  }, 0);

  const transitionRatio = transitionCount / Math.max(1, points.length - 1);
  return clamp((rainSwing / 100) * 0.42 + (windSwing / 60) * 0.26 + (cloudSwing / 100) * 0.2 + transitionRatio * 0.12, 0, 1);
}

export function evaluateForecastConfidence(snapshot: WeatherSnapshot): ForecastConfidence {
  const horizon = snapshot.hourly.slice(0, 10);
  const volatility = evaluateVolatility(horizon);
  const certainty = clamp(1 - volatility, 0, 1);
  const probabilities = horizon.map((point) => point.precipitationProbability);
  const averageProbability = average(probabilities);
  const peakProbability = probabilities.length > 0 ? Math.max(...probabilities) : snapshot.current.precipitationProbability;

  let tone: ForecastConfidenceTone;
  if (certainty >= 0.72) {
    tone = 'alta_confianza';
  } else if (certainty >= 0.46) {
    tone = 'confianza_media';
  } else {
    tone = 'puede_cambiar';
  }

  return {
    tone,
    label: toneLabels(tone),
    support: confidenceSupport(tone),
    rainStatement: rainNarrative(averageProbability, peakProbability),
    umbrellaAdvice: umbrellaNarrative(averageProbability, peakProbability),
  };
}
