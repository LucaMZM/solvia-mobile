import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface RopaSummaryCardProps {
  cityName: string;
  thermalProfileLabel: string;
  title: string;
  support: string;
}

export function RopaSummaryCard({
  cityName,
  thermalProfileLabel,
  title,
  support,
}: RopaSummaryCardProps) {
  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['rgba(93,126,165,0.98)', 'rgba(35,58,91,0.98)', 'rgba(18,31,55,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.visualOrb}>
        <MaterialCommunityIcons color="rgba(248,251,255,0.72)" name="hanger" size={72} />
      </View>

      <Text style={styles.kicker}>Decisión de ropa</Text>

      <View style={styles.pillsRow}>
        <View style={styles.cityPill}>
          <MaterialCommunityIcons color={appTheme.colors.secondary} name="map-marker-outline" size={14} />
          <Text style={styles.cityText}>{cityName}</Text>
        </View>
        <View style={styles.profilePill}>
          <MaterialCommunityIcons color={appTheme.colors.warning} name="thermometer" size={14} />
          <Text style={styles.profileText}>{thermalProfileLabel}</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text numberOfLines={2} style={styles.support}>
        {support}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: 'rgba(198,210,232,0.22)',
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    minHeight: 194,
    overflow: 'hidden',
    padding: appTheme.spacing.cardPadding + 1,
    ...appTheme.elevation.card,
  },
  visualOrb: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,251,255,0.08)',
    borderColor: 'rgba(248,251,255,0.12)',
    borderRadius: 92,
    borderWidth: 1,
    height: 168,
    justifyContent: 'center',
    position: 'absolute',
    right: -42,
    top: -20,
    width: 168,
  },
  kicker: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.14,
    lineHeight: 15,
    marginBottom: appTheme.spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cityPill: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.secondary, 0.16),
    borderColor: withAlpha(appTheme.colors.secondary, 0.38),
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  cityText: {
    color: appTheme.colors.secondary,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  profilePill: {
    alignItems: 'center',
    backgroundColor: withAlpha(appTheme.colors.warning, 0.14),
    borderColor: withAlpha(appTheme.colors.warning, 0.36),
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  profileText: {
    color: appTheme.colors.warning,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.08,
    lineHeight: 14,
  },
  title: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 30,
    lineHeight: 35,
    marginTop: appTheme.spacing.md,
    maxWidth: '74%',
  },
  support: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12.4,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: '76%',
  },
});
