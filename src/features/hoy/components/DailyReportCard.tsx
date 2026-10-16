import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import type { DailyBriefMoment } from '@/src/types/briefing';
import type { RecommendationBundle } from '@/src/types/recommendations';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

interface DailyReportCardProps {
  cityName: string;
  dailyBriefByMoment: Record<DailyBriefMoment, { shortLine: string; supportLine: string }> | null;
  recommendations: RecommendationBundle;
}

interface ReportItem {
  title: string;
  summary: string;
}

function concise(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) {
    return 'Sin cambios relevantes.';
  }
  return cleaned.endsWith('.') ? cleaned : `${cleaned}.`;
}

export function DailyReportCard({ cityName, dailyBriefByMoment, recommendations }: DailyReportCardProps) {
  const [isDetailVisible, setDetailVisible] = useState(false);

  const items = useMemo<ReportItem[]>(() => {
    const manana = dailyBriefByMoment?.manana?.shortLine ?? 'Inicio estable.';
    const mediodia = dailyBriefByMoment?.manana?.supportLine ?? 'Revisa UV y agua.';
    const tarde = dailyBriefByMoment?.tarde?.shortLine ?? 'Tarde aprovechable.';
    const noche = dailyBriefByMoment?.noche_siguiente?.shortLine ?? 'Cierra con capa ligera.';

    return [
      { title: 'Resumen de hoy', summary: concise(recommendations.mainHeadline) },
      { title: 'Mañana', summary: concise(manana) },
      { title: 'Mediodía', summary: concise(mediodia) },
      { title: 'Tarde', summary: concise(tarde) },
      { title: 'Noche', summary: concise(noche) },
      { title: 'Qué ponerte', summary: concise(recommendations.outfit.note) },
      { title: 'Sol y UV', summary: concise(recommendations.sunUv.support) },
      { title: 'Viento y lluvia', summary: concise(recommendations.wind.support) },
    ];
  }, [dailyBriefByMoment, recommendations]);

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir reporte diario"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setDetailVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading iconName={appIcons.modules.resumenDiario} title="Reporte diario" />
          <Text numberOfLines={1} style={styles.headline}>
            {items[0]?.summary}
          </Text>
          <View style={styles.timelineRow}>
            {items.slice(1, 5).map((item) => (
              <View key={item.title} style={styles.timelinePill}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
              </View>
            ))}
          </View>
          <View style={styles.footerRow}>
            <MaterialCommunityIcons color={appTheme.colors.secondary} name="text-box-search-outline" size={14} />
            <Text style={styles.footerText}>Detalle breve, sin hora a hora</Text>
          </View>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.resumenDiario}
        mainValue={cityName}
        onClose={() => setDetailVisible(false)}
        rows={items.map((item) => ({ label: item.title, value: item.summary }))}
        summary="Lectura del día para decidir rápido qué hacer y qué llevar."
        title="Reporte diario"
        visible={isDetailVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headline: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  timelinePill: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timelineTitle: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: appTheme.spacing.sm,
  },
  footerText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.4,
    lineHeight: 15,
  },
});
