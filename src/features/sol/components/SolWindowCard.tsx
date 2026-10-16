import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ReadMoreText } from '@/src/components/ui/ReadMoreText';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface SolWindowCardProps {
  windowLabel: string;
  windowSupport: string;
  partOfDayLabel: string;
  sunriseLabel: string;
  sunsetLabel: string;
}

export function SolWindowCard({
  windowLabel,
  windowSupport,
  partOfDayLabel,
  sunriseLabel,
  sunsetLabel,
}: SolWindowCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="weather-sunset" title="Mejor ventana" />

      <View style={styles.windowPill}>
        <MaterialCommunityIcons color={appTheme.colors.warning} name="sun-clock-outline" size={15} />
        <Text style={styles.windowLabel}>{windowLabel}</Text>
      </View>
      <Text numberOfLines={1} style={styles.partOfDay}>
        {partOfDayLabel === 'sin ventana clara'
          ? 'Hoy no hay franja clara.'
          : `Mejor ${partOfDayLabel}.`}
      </Text>
      <ReadMoreText
        detailSummary="Detalle de la mejor ventana solar"
        iconName="weather-sunset"
        numberOfLines={2}
        style={styles.support}
        text={windowSupport}
        title="Mejor ventana"
      />

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Salida</Text>
          <Text style={styles.metricValue}>{sunriseLabel}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Puesta</Text>
          <Text style={styles.metricValue}>{sunsetLabel}</Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  windowPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(appTheme.colors.warning, 0.12),
    borderColor: withAlpha(appTheme.colors.warning, 0.42),
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 5,
  },
  windowLabel: {
    color: appTheme.colors.warning,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  partOfDay: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 15.2,
    letterSpacing: 0.08,
    lineHeight: 20,
    marginTop: 7,
  },
  support: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.9,
    lineHeight: 16,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
    marginTop: appTheme.spacing.sm + 1,
  },
  metricCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.28)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
  },
  metricLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  metricValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.headline,
    fontSize: 25,
    lineHeight: 31,
    marginTop: appTheme.spacing.xs,
  },
});
