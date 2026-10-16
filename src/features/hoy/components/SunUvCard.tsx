import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import type { SunUvRecommendation } from '@/src/types/recommendations';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

interface SunUvCardProps {
  sunUv: SunUvRecommendation;
  isDay: boolean;
  uvStatus?: 'available' | 'unavailable';
}

export function SunUvCard({ sunUv, isDay, uvStatus = 'available' }: SunUvCardProps) {
  const [isSheetVisible, setSheetVisible] = useState(false);
  const uvAvailable = isDay && uvStatus === 'available';
  const uvMainValue = !isDay ? 'UV 0' : uvAvailable ? `UV ${sunUv.uvIndex}` : 'Sin datos';
  const uvLevelValue = !isDay ? 'Inactivo' : uvAvailable ? sunUv.levelLabel : 'Sin lectura fiable';
  const uvSupportValue =
    !isDay
      ? 'Sin exposición UV a esta hora.'
      : uvAvailable
      ? sunUv.support
      : 'No tenemos una lectura UV consistente para este momento.';
  const uvMinutesValue =
    !isDay
      ? 'La protección solar no es prioritaria ahora.'
      : uvAvailable
      ? `Sin protección: ${sunUv.maxSafeMinutesWithoutProtection} min`
      : 'Consulta de nuevo cuando haya una lectura fiable.';

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir detalle de Sol y UV"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setSheetVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading
            iconName={appIcons.modules.solUv}
            title="Sol y UV"
            trailing={<MaterialCommunityIcons color={appTheme.colors.warning} name={appIcons.modules.solUv} size={20} />}
          />

          <View style={styles.metricRow}>
            <Text style={styles.uvMetric}>{uvMainValue}</Text>
            <Text style={styles.uvLevel}>{uvLevelValue}</Text>
          </View>

          <Text numberOfLines={1} style={styles.support}>
            {uvSupportValue}
          </Text>
          <Text numberOfLines={1} style={styles.minutes}>
            {uvMinutesValue}
          </Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.solUv}
        mainValue={uvMainValue}
        onClose={() => setSheetVisible(false)}
        rows={[
          { label: 'Intensidad', value: uvLevelValue },
          {
            label: 'Exposición orientativa sin protección',
            value: !isDay ? 'No aplica ahora' : uvAvailable ? `${sunUv.maxSafeMinutesWithoutProtection} min` : 'Sin datos',
          },
        ]}
        summary={uvSupportValue}
        title="Sol y UV"
        visible={isSheetVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: appTheme.spacing.md,
  },
  uvMetric: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 30,
    lineHeight: 36,
  },
  uvLevel: {
    color: appTheme.colors.warning,
    ...appTheme.typography.bodyLg,
    fontSize: 18,
    lineHeight: 23,
  },
  support: {
    color: appTheme.colors.onSurface,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.body,
    fontSize: 13.5,
    lineHeight: 18,
  },
  minutes: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 6,
    ...appTheme.typography.functional,
    fontSize: 12.2,
    lineHeight: 17,
  },
});
