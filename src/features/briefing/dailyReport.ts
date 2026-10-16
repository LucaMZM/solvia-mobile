import type { DailyBrief, DailyBriefMoment } from '@/src/types/briefing';

export interface DailyReportSection {
  id: 'manana' | 'mediodia' | 'tarde' | 'noche';
  title: 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche';
  summary: string;
}

function normalizeSummary(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }
  return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
}

function briefLine(brief: DailyBrief | undefined): string {
  return normalizeSummary(brief?.shortLine);
}

function middaySummary(byMoment: Record<DailyBriefMoment, DailyBrief> | null): string {
  const morning = byMoment?.manana?.supportLine ?? '';
  const afternoon = byMoment?.tarde?.shortLine ?? '';
  const base = `${morning} ${afternoon}`.trim();

  if (base.toLowerCase().includes('uv')) {
    return 'Mediodía: sube el UV, mejor protección si sales.';
  }
  if (base.toLowerCase().includes('lluv')) {
    return 'Mediodía: posible lluvia, mejor plan corto o interior.';
  }
  if (base.toLowerCase().includes('viento')) {
    return 'Mediodía: viento moderado, mejor zonas resguardadas.';
  }
  return 'Mediodía: tramo estable, revisa protección solar y agua.';
}

export function buildDailyReportSections(
  byMoment: Record<DailyBriefMoment, DailyBrief> | null,
): DailyReportSection[] {
  return [
    {
      id: 'manana',
      title: 'Mañana',
      summary: briefLine(byMoment?.manana) || 'Mañana: arranca con lectura suave y ajustes ligeros.',
    },
    {
      id: 'mediodia',
      title: 'Mediodía',
      summary: middaySummary(byMoment),
    },
    {
      id: 'tarde',
      title: 'Tarde',
      summary: briefLine(byMoment?.tarde) || 'Tarde: posible mejor franja para caminar.',
    },
    {
      id: 'noche',
      title: 'Noche',
      summary:
        briefLine(byMoment?.noche_siguiente) || 'Noche: refresca, conviene capa ligera.',
    },
  ];
}
