import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { formatTrendLabel } from '@/src/domain/trayecto/trayectoDomain';
import { withAlpha } from '@/src/theme/colorUtils';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { LocalTrayectoAnalysis, TrayectoRiskTrend } from '@/src/types/trayecto';

interface TrayectoLocalAnalysisCardProps {
  analysis: LocalTrayectoAnalysis;
}

const trendIconByValue: Record<TrayectoRiskTrend, keyof typeof MaterialCommunityIcons.glyphMap> = {
  sube: 'trending-up',
  estable: 'trending-neutral',
  baja: 'trending-down',
};

const trendAccentByValue: Record<TrayectoRiskTrend, string> = {
  sube: appTheme.colors.warning,
  estable: appTheme.colors.secondary,
  baja: appTheme.colors.success,
};

function TrendRow({
  title,
  trend,
  support,
}: {
  title: string;
  trend: TrayectoRiskTrend;
  support: string;
}) {
  const accent = trendAccentByValue[trend];
  return (
    <View style={styles.trendRow}>
      <View style={styles.trendHeader}>
        <Text style={styles.trendTitle}>{title}</Text>
        <View
          style={[
            styles.trendBadge,
            {
              borderColor: withAlpha(accent, 0.5),
              backgroundColor: withAlpha(accent, 0.14),
            },
          ]}>
          <MaterialCommunityIcons color={accent} name={trendIconByValue[trend]} size={13} />
          <Text style={[styles.trendBadgeText, { color: accent }]}>{formatTrendLabel(trend)}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.trendSupport}>
        {support}
      </Text>
    </View>
  );
}

function DecisionRow({
  title,
  value,
  positive,
  iconName,
}: {
  title: string;
  value: string;
  positive: boolean;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <View style={styles.decisionRow}>
      <View style={styles.decisionLabelRow}>
        <MaterialCommunityIcons
          color={positive ? appTheme.colors.success : appTheme.colors.warning}
          name={iconName}
          size={14}
        />
        <Text style={styles.decisionTitle}>{title}</Text>
      </View>
      <Text style={[styles.decisionValue, positive ? styles.positive : styles.warning]}>{value}</Text>
    </View>
  );
}

export function TrayectoLocalAnalysisCard({ analysis }: TrayectoLocalAnalysisCardProps) {
  const [isDetailVisible, setDetailVisible] = useState(false);

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir detalle del trayecto local"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setDetailVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading iconName={appIcons.modules.trayecto} title="Decisión de salida" />
          <View style={styles.keyMetrics}>
            <DecisionRow
              iconName="clock-check-outline"
              positive={
                analysis.bestDepartureLabel.toLowerCase().includes('viable') ||
                analysis.bestDepartureLabel.toLowerCase().includes('no hace falta')
              }
              title="Salir"
              value={analysis.bestDepartureLabel}
            />
            <DecisionRow
              iconName="clock-end"
              positive
              title="Volver"
              value={`Antes de ${analysis.latestReturnLabel}`}
            />
            <DecisionRow
              iconName="umbrella-outline"
              positive={!analysis.umbrellaRecommended}
              title="Paraguas"
              value={analysis.umbrellaRecommended ? 'Recomendado' : 'No necesario'}
            />
            <DecisionRow
              iconName="resize"
              positive={!analysis.shorterOutingRecommended}
              title="Salida corta"
              value={analysis.shorterOutingRecommended ? 'Sí, mejor corto' : 'No hace falta'}
            />
          </View>

          <Text numberOfLines={2} style={styles.summary}>
            {analysis.summary}
          </Text>
          <Text numberOfLines={2} style={styles.decisionCopy}>
            {analysis.leaveDecision}
          </Text>

          <View style={styles.trendList}>
            <TrendRow support={analysis.rainSupport} title="Lluvia durante el trayecto" trend={analysis.rainTrend} />
            <TrendRow support={analysis.windSupport} title="Viento durante el trayecto" trend={analysis.windTrend} />
            <TrendRow support={analysis.coolingSupport} title="Enfriamiento percibido" trend={analysis.coolingTrend} />
          </View>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.trayecto}
        mainValue={analysis.bestDepartureLabel}
        onClose={() => setDetailVisible(false)}
        rows={[
          { label: 'Decisión principal', value: analysis.leaveDecision },
          { label: 'Vuelta sugerida', value: `Antes de ${analysis.latestReturnLabel}` },
          { label: 'Lluvia', value: analysis.rainSupport },
          { label: 'Viento', value: analysis.windSupport },
          { label: 'Enfriamiento', value: analysis.coolingSupport },
        ]}
        summary={analysis.summary}
        title="Detalle del trayecto local"
        visible={isDetailVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12.2,
    lineHeight: 17,
    marginTop: appTheme.spacing.sm,
  },
  decisionCopy: {
    ...textStyles.subtle,
    marginTop: 1,
  },
  keyMetrics: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  decisionRow: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 8,
  },
  decisionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  decisionTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 17,
  },
  decisionValue: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.08,
  },
  positive: {
    color: appTheme.colors.success,
  },
  warning: {
    color: appTheme.colors.warning,
  },
  trendList: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  trendRow: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  trendHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendTitle: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontSize: 12.4,
    lineHeight: 18,
  },
  trendBadge: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 4,
  },
  trendBadgeText: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.08,
  },
  trendSupport: {
    ...textStyles.subtle,
    marginTop: 4,
  },
});
