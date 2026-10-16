import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { RopaMomentComparison } from '@/src/features/ropa/ropaModel';

interface RopaTimelineCardProps {
  moments: RopaMomentComparison[];
}

interface OutfitLineProps {
  label: string;
  value: string;
}

function OutfitLine({ label, value }: OutfitLineProps) {
  return (
    <View style={styles.lineRow}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.lineValue}>
        {value}
      </Text>
    </View>
  );
}

export function RopaTimelineCard({ moments }: RopaTimelineCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="timeline-clock-outline" title="Ahora · mañana · tarde · noche" />

      <View style={styles.list}>
        {moments.map((moment, index) => (
          <View key={moment.id} style={[styles.momentCard, index === moments.length - 1 ? styles.lastMomentCard : null]}>
            <View style={styles.headerRow}>
              <View style={styles.labelRow}>
                <MaterialCommunityIcons color={appTheme.colors.secondary} name={moment.iconName} size={15} />
                <Text style={styles.momentLabel}>
                  {moment.label} · {moment.timeLabel}
                </Text>
              </View>
              <View style={styles.statePill}>
                <Text style={styles.stateText}>{moment.stateLabel}</Text>
              </View>
            </View>

            <Text numberOfLines={2} style={styles.changeSummary}>
              {moment.changeSummary}
            </Text>

            <View style={styles.linesBlock}>
              <OutfitLine label="Superior" value={moment.outfit.superior} />
              <OutfitLine label="Capa" value={moment.outfit.capa} />
              <OutfitLine label="Calzado" value={moment.outfit.calzado} />
              <OutfitLine label="Accesorios" value={moment.outfit.accesorios} />
            </View>
            <Text numberOfLines={2} style={styles.reason}>
              {moment.subtleReason}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  momentCard: {
    borderBottomColor: 'rgba(154,172,202,0.24)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
  },
  lastMomentCard: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  momentLabel: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    letterSpacing: 0.08,
    lineHeight: 16,
  },
  statePill: {
    backgroundColor: withAlpha(appTheme.colors.secondary, 0.1),
    borderColor: withAlpha(appTheme.colors.secondary, 0.42),
    borderRadius: appTheme.radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 4,
  },
  stateText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontSize: 10.4,
    lineHeight: 14,
  },
  linesBlock: {
    gap: 4,
    marginTop: 7,
  },
  lineRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.6,
    lineHeight: 15,
    marginRight: appTheme.spacing.sm,
  },
  lineValue: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.functional,
    flex: 1,
    fontSize: 12.2,
    lineHeight: 16,
    textAlign: 'right',
  },
  changeSummary: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12.2,
    letterSpacing: 0.05,
    lineHeight: 16,
    marginTop: 6,
  },
  reason: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.2,
    lineHeight: 14,
    marginTop: 1,
  },
});
