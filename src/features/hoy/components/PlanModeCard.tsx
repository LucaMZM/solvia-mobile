import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { ChoicePills } from '@/src/features/trayecto/components/ChoicePills';
import { planStatusLabels, planTypeIcons, planTypeLabels, planTypes } from '@/src/features/planning/catalog';
import { withAlpha } from '@/src/theme/colorUtils';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { PlanType, PlanningBundle } from '@/src/types/planning';

interface PlanModeCardProps {
  selectedPlanType: PlanType;
  planning: PlanningBundle;
  onSelectPlanType: (planType: PlanType) => void;
}

const statusColorMap: Record<keyof typeof planStatusLabels, string> = {
  recomendado: appTheme.colors.success,
  okay: appTheme.colors.secondary,
  regular: appTheme.colors.warning,
  evitar: appTheme.colors.danger,
};

export function PlanModeCard({ selectedPlanType, planning, onSelectPlanType }: PlanModeCardProps) {
  const [isDetailVisible, setDetailVisible] = useState(false);
  const guidance = planning.plans[selectedPlanType];
  const statusColor = statusColorMap[guidance.status];
  const confidenceSummary = `${planning.confidence.rainStatement}`;

  return (
    <>
      <SectionCard>
        <SectionHeading iconName={appIcons.modules.modoPlan} title="Modo plan" />
        <ChoicePills
          accessibilityPrefix="Seleccionar plan"
          onChange={onSelectPlanType}
          options={planTypes.map((planType) => ({
            value: planType,
            label: planTypeLabels[planType],
            iconName: planTypeIcons[planType],
          }))}
          value={selectedPlanType}
        />

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: withAlpha(statusColor, 0.5),
                backgroundColor: withAlpha(statusColor, 0.15),
              },
            ]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{planStatusLabels[guidance.status]}</Text>
          </View>
          <Text style={styles.planName}>{planTypeLabels[selectedPlanType]}</Text>
        </View>
        <Text numberOfLines={1} style={styles.bestMomentLine}>
          {guidance.bestMoment}
        </Text>

        <Text numberOfLines={1} style={styles.decisionLine}>
          {guidance.doNowOrLater}
        </Text>

        <View style={styles.pillsRow}>
          <View style={styles.compactPill}>
            <MaterialCommunityIcons color={appTheme.colors.warning} name="weather-partly-rainy" size={13} />
            <Text numberOfLines={1} style={styles.compactPillText}>
              {guidance.weatherRiskSummary}
            </Text>
          </View>
          <View style={styles.compactPill}>
            <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name={appIcons.modules.ropa} size={13} />
            <Text numberOfLines={1} style={styles.compactPillText}>
              {guidance.outfitGuidance}
            </Text>
          </View>
        </View>

        <View style={styles.confidenceCard}>
          <Text style={styles.confidenceTitle}>{planning.confidence.label}</Text>
          <Text numberOfLines={1} style={styles.confidenceSupport}>
            {planning.confidence.support}
          </Text>
          {confidenceSummary ? (
            <Text numberOfLines={1} style={styles.confidenceSupport}>
              {confidenceSummary}
            </Text>
          ) : null}
        </View>

        <MotionPressable
          accessibilityLabel="Abrir detalle del plan"
          accessibilityRole="button"
          hapticType="selection"
          onPress={() => setDetailVisible(true)}
          pressedOpacity={0.92}
          pressedScale={0.988}
          reducedMotionPressedOpacity={0.88}
          style={styles.detailButton}>
          <MaterialCommunityIcons color={appTheme.colors.secondary} name="information-outline" size={15} />
          <Text style={styles.detailButtonText}>Ver detalle</Text>
        </MotionPressable>
      </SectionCard>

      <PremiumDetailSheet
        iconName={appIcons.modules.modoPlan}
        mainValue={planTypeLabels[selectedPlanType]}
        onClose={() => setDetailVisible(false)}
        rows={[
          { label: 'Estado', value: planStatusLabels[guidance.status] },
          { label: 'Decisión', value: guidance.doNowOrLater },
          { label: 'Riesgo', value: guidance.weatherRiskSummary },
          { label: 'Ropa', value: guidance.outfitGuidance },
          { label: 'Ventana', value: guidance.window.label },
          { label: 'Confianza', value: planning.confidence.label },
        ]}
        summary={guidance.window.reason}
        title="Modo plan"
        visible={isDetailVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm + 1,
  },
  statusBadge: {
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 5,
  },
  statusText: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  planName: {
    color: appTheme.colors.primary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  bestMomentLine: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.8,
    lineHeight: 15,
    marginTop: 4,
  },
  decisionLine: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12.2,
    lineHeight: 17,
    marginTop: appTheme.spacing.sm,
  },
  pillsRow: {
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.xs + 1,
  },
  compactPill: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: appTheme.spacing.sm,
  },
  compactPillText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
  },
  confidenceCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    marginTop: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 10,
  },
  confidenceTitle: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  confidenceSupport: {
    ...textStyles.subtle,
    marginTop: 3,
  },
  detailButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: appTheme.spacing.sm,
    minHeight: 36,
    paddingHorizontal: 2,
  },
  detailButtonText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11.8,
    lineHeight: 15,
  },
});
