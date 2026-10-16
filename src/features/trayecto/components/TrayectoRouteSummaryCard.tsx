import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { withAlpha } from '@/src/theme/colorUtils';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { CarTrayectoAnalysis, RoutePlanResult } from '@/src/types/trayecto';

interface TrayectoRouteSummaryCardProps {
  analysis: CarTrayectoAnalysis;
  routePlan: RoutePlanResult;
}

function RiskBadge({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  const isHigh = value.toLowerCase() === 'alto';
  const isModerate = value.toLowerCase() === 'moderado';
  const accent = isHigh ? appTheme.colors.danger : isModerate ? appTheme.colors.warning : appTheme.colors.success;

  return (
    <View
      style={[
        styles.riskBadge,
        {
          borderColor: withAlpha(accent, 0.5),
          backgroundColor: withAlpha(accent, 0.13),
        },
      ]}>
      <Text style={styles.riskTitle}>{title}</Text>
      <Text style={[styles.riskValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

export function TrayectoRouteSummaryCard({ analysis, routePlan }: TrayectoRouteSummaryCardProps) {
  const [isDetailVisible, setDetailVisible] = useState(false);

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir detalle completo de la ruta"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setDetailVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading iconName={appIcons.modules.trayecto} title="Lectura de ruta" />

          <Text style={styles.title}>{analysis.leaveDecision}</Text>
          <Text numberOfLines={2} style={styles.support}>
            {analysis.summary}
          </Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>Distancia estimada</Text>
              <Text style={styles.kpiValue}>{Math.round(routePlan.totalDistanceKm)} km</Text>
            </View>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiLabel}>Duración estimada</Text>
              <Text style={styles.kpiValue}>{routePlan.totalDurationMin} min</Text>
            </View>
          </View>

          <View style={styles.riskRow}>
            <RiskBadge title="Lluvia en ruta" value={analysis.rainRiskLabel} />
            <RiskBadge title="Viento en ruta" value={analysis.windRiskLabel} />
          </View>

          <View style={styles.quickRow}>
            <MaterialCommunityIcons
              color={analysis.umbrellaRecommended ? appTheme.colors.warning : appTheme.colors.success}
              name="umbrella-outline"
              size={14}
            />
            <Text numberOfLines={1} style={styles.quickText}>
              {analysis.umbrellaRecommended ? 'Paraguas por si acaso' : 'Sin paraguas, en principio'}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.arrivalText}>
            {analysis.arrivalWeather}
          </Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.trayecto}
        mainValue={analysis.leaveDecision}
        onClose={() => setDetailVisible(false)}
        rows={[
          { label: 'Ruta', value: analysis.routeSummary },
          { label: 'Lluvia en ruta', value: analysis.rainRiskLabel },
          { label: 'Viento en ruta', value: analysis.windRiskLabel },
          { label: 'Paraguas', value: analysis.umbrellaRecommended ? 'Recomendado' : 'No necesario' },
          { label: 'Salida corta', value: analysis.shortenSuggestion },
          { label: 'Llegada', value: analysis.arrivalWeather },
        ]}
        summary={analysis.summary}
        title="Detalle de ruta"
        visible={isDetailVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    ...textStyles.cardTitle,
    fontSize: 23,
    lineHeight: 28,
  },
  support: {
    ...textStyles.subtle,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  kpiItem: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  kpiLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  kpiValue: {
    color: appTheme.colors.onSurface,
    marginTop: 5,
    ...appTheme.typography.bodyLg,
    fontSize: 19,
    lineHeight: 24,
  },
  riskRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  riskBadge: {
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  riskTitle: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  riskValue: {
    marginTop: 4,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.6,
    letterSpacing: 0.08,
    lineHeight: 15,
  },
  quickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: appTheme.spacing.sm,
  },
  quickText: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.8,
    lineHeight: 16,
  },
  arrivalText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 15,
    marginTop: 3,
  },
});
