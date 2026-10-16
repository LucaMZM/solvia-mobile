import type { PlanType, PlanWindowMetrics } from '@/src/types/planning';
import { compareLocalIso } from '@/src/services/weather/localTime';
import type { WeatherSnapshot } from '@/src/types/weather';
import { formatClock } from '@/src/utils/date';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function formatWindowLabel(startISO: string, endISO: string): string {
  return `${formatClock(startISO)}–${formatClock(endISO)}`;
}

export function isNearSunset(snapshot: WeatherSnapshot, startISO: string): boolean {
  const diffMs = Math.abs(compareLocalIso(snapshot.daily.sunsetISO, startISO));
  return diffMs <= 75 * 60_000;
}

export function reasonForWindow(params: {
  planType: PlanType;
  metrics: PlanWindowMetrics;
  nearSunset: boolean;
}): string {
  const { planType, metrics, nearSunset } = params;

  if (metrics.rainPeakProbability >= 60 || metrics.rainPeakMm >= 0.8) {
    return 'Hay riesgo de lluvia durante esta franja: mejor mantener plan corto y protegido.';
  }
  if (metrics.windPeakKmh >= 36) {
    return 'El viento sube en esta franja; conviene priorizar zonas resguardadas.';
  }
  if (planType === 'tomar_sol' || planType === 'piscina' || planType === 'playa') {
    if (nearSunset) {
      return 'Franja amable de luz y confort para estar fuera con más calma.';
    }
    if (metrics.uvAverage >= 8.5) {
      return 'Luz potente: funciona mejor con protección solar estricta y pausas de sombra.';
    }
    return 'Buen equilibrio de luz para disfrutar el exterior sin forzar exposición.';
  }
  if (planType === 'trayecto') {
    return 'Franja con mejor balance de lluvia y viento para desplazarte con menos fricción.';
  }
  return 'Franja equilibrada para sostener confort y ritmo en tu plan.';
}

export function nowOrLaterLabel(params: {
  score: number;
  startISO: string;
  endISO: string;
  snapshot: WeatherSnapshot;
  planType: PlanType;
}): { shouldDoNow: boolean; label: string; bestMoment: string } {
  const nowISO = params.snapshot.current.timeISO;
  const shouldDoNow = Math.abs(compareLocalIso(params.startISO, nowISO)) <= 20 * 60_000;

  if (params.score < 38) {
    return {
      shouldDoNow: false,
      label: 'Mejor evitar por ahora',
      bestMoment: 'Evítalo por ahora',
    };
  }

  if (shouldDoNow) {
    return {
      shouldDoNow: true,
      label: params.score >= 60 ? 'Ahora es viable' : 'Ahora con ajustes',
      bestMoment: params.score >= 60 ? 'Ahora es viable' : 'Ahora con ajustes',
    };
  }

  if (params.score >= 72) {
    return {
      shouldDoNow: false,
      label: 'No hace falta cambiar la hora',
      bestMoment: 'No hace falta cambiar la hora',
    };
  }

  if (params.score >= 50) {
    return {
      shouldDoNow: false,
      label: 'Ahora es viable con ajustes',
      bestMoment: 'Ahora es viable con ajustes',
    };
  }

  return {
    shouldDoNow: false,
    label: 'Ahora con ajustes',
    bestMoment: 'Ahora con ajustes',
  };
}
