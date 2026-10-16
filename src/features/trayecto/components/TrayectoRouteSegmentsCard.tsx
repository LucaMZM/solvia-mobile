import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ReadMoreText } from '@/src/components/ui/ReadMoreText';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { appTheme } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/textStyles';
import type { CarRouteSegmentAnalysis } from '@/src/types/trayecto';

interface TrayectoRouteSegmentsCardProps {
  segments: CarRouteSegmentAnalysis[];
}

function SegmentRiskPill({
  iconName,
  label,
  value,
}: {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.riskPill}>
      <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name={iconName} size={12} />
      <Text style={styles.riskPillText}>
        {label}: {value}
      </Text>
    </View>
  );
}

export function TrayectoRouteSegmentsCard({ segments }: TrayectoRouteSegmentsCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="vector-link" title="Tramos" />

      {segments.length === 0 ? (
        <Text style={textStyles.support}>Aún no hay tramos para analizar.</Text>
      ) : (
        <View style={styles.list}>
          {segments.map((segment) => (
            <View key={segment.id} style={styles.segmentCard}>
              <View style={styles.headerRow}>
                <Text style={styles.segmentTitle}>{segment.label}</Text>
                <Text style={styles.segmentEta}>{segment.etaLabel}</Text>
              </View>

              <View style={styles.pillsRow}>
                <SegmentRiskPill iconName="weather-rainy" label="Lluvia" value={segment.rainRiskLabel} />
                <SegmentRiskPill iconName="weather-windy" label="Viento" value={segment.windRiskLabel} />
              </View>

              <ReadMoreText
                detailSummary={segment.label}
                iconName="vector-link"
                numberOfLines={2}
                style={styles.segmentSupport}
                text={segment.support}
                title={`Detalle ${segment.label}`}
              />
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: appTheme.spacing.xs,
  },
  segmentCard: {
    backgroundColor: appTheme.colors.surfaceContainerLowest,
    borderColor: 'rgba(154,172,202,0.26)',
    borderRadius: appTheme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  segmentTitle: {
    color: appTheme.colors.onSurface,
    flex: 1,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    paddingRight: appTheme.spacing.sm,
  },
  segmentEta: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 0.08,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: appTheme.spacing.xs,
  },
  riskPill: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.surfaceContainer,
    borderColor: 'rgba(154,172,202,0.24)',
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 5,
  },
  riskPillText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.4,
    lineHeight: 13,
    letterSpacing: 0.08,
  },
  segmentSupport: {
    ...textStyles.subtle,
    marginTop: appTheme.spacing.xs,
  },
});
