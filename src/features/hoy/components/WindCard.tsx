import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { MotionPressable } from '@/src/components/ui/MotionPressable';
import { PremiumDetailSheet } from '@/src/components/ui/PremiumDetailSheet';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import type { WindRecommendation } from '@/src/types/recommendations';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

interface WindCardProps {
  wind: WindRecommendation;
}

export function WindCard({ wind }: WindCardProps) {
  const [isSheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <MotionPressable
        accessibilityLabel="Abrir detalle de viento"
        accessibilityRole="button"
        hapticType="selection"
        onPress={() => setSheetVisible(true)}
        pressedOpacity={0.93}
        pressedScale={0.992}
        reducedMotionPressedOpacity={0.88}>
        <SectionCard>
          <SectionHeading
            iconName={appIcons.modules.viento}
            title="Viento"
            trailing={<MaterialCommunityIcons color={appTheme.colors.secondary} name={appIcons.modules.viento} size={20} />}
          />

          <View style={styles.metricRow}>
            <Text style={styles.metric}>{wind.speedKmh}</Text>
            <Text style={styles.metricUnit}>km/h</Text>
          </View>

          <Text numberOfLines={1} style={styles.support}>
            {wind.support}
          </Text>
        </SectionCard>
      </MotionPressable>

      <PremiumDetailSheet
        iconName={appIcons.modules.viento}
        mainValue={`${wind.speedKmh} km/h`}
        onClose={() => setSheetVisible(false)}
        rows={[
          { label: 'Lectura principal', value: wind.support },
          { label: 'Confort', value: wind.speedKmh >= 30 ? 'Mejor zonas resguardadas' : 'Confort estable' },
        ]}
        summary="Impacto del viento sobre confort y planes exteriores."
        title="Viento"
        visible={isSheetVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
  metric: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 34,
    lineHeight: 40,
  },
  metricUnit: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.body,
    fontSize: 15,
    lineHeight: 20,
  },
  support: {
    color: appTheme.colors.onSurface,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.body,
    fontSize: 13.5,
    lineHeight: 18,
  },
});
