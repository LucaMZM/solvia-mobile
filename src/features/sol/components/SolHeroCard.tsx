import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { MetricChip } from '@/src/components/ui/MetricChip';
import { AnimatedWeatherAsset } from '@/src/features/weatherVisuals/AnimatedWeatherAsset';
import { getWeatherVisualKeyFromState } from '@/src/features/weatherVisuals/weatherAssets';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

type ConfidenceTone = 'alta' | 'media' | 'baja';

interface SolHeroCardProps {
  cityName: string;
  weatherState: WeatherState;
  isDay: boolean;
  uvCurrent: number;
  uvAvailable: boolean;
  uvMaxForecast: number;
  sunStateLabel: string;
  intensityHeadline: string;
  intensitySupport: string;
  confidenceTone: ConfidenceTone;
  confidenceLabel: string;
}

const confidenceColorMap: Record<ConfidenceTone, string> = {
  alta: appTheme.colors.success,
  media: appTheme.colors.warning,
  baja: appTheme.colors.danger,
};

export function SolHeroCard({
  cityName,
  weatherState,
  isDay,
  uvCurrent,
  uvAvailable,
  uvMaxForecast,
  sunStateLabel,
  intensityHeadline,
  intensitySupport,
  confidenceTone,
  confidenceLabel,
}: SolHeroCardProps) {
  const confidenceColor = confidenceColorMap[confidenceTone];
  const visualAccent = isDay ? appTheme.colors.warning : appTheme.colors.secondary;
  const uvLabel = !isDay ? '0' : uvAvailable ? String(uvCurrent) : '—';
  const uvSubLabel = !isDay ? 'UV inactivo' : uvAvailable ? 'UV actual' : 'Sin datos UV';
  const gradientColors: [string, string, string] = isDay
    ? ['#5f89ae', '#395b81', '#162542']
    : ['#243c69', '#18284a', '#0e1930'];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glow, { backgroundColor: withAlpha(visualAccent, isDay ? 0.18 : 0.13) }]} />
      <View style={styles.assetStage}>
        <AnimatedWeatherAsset
          accentColor={visualAccent}
          assetKey={getWeatherVisualKeyFromState(weatherState)}
          size={166}
        />
      </View>
      <LinearGradient
        colors={['rgba(8,13,25,0.02)', 'rgba(8,13,25,0.14)', 'rgba(8,13,25,0.22)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.topRow}>
        <View style={styles.cityBadge}>
          <MaterialCommunityIcons color={appTheme.colors.secondary} name="map-marker-outline" size={14} />
          <Text style={styles.cityText}>{cityName}</Text>
        </View>
        <View
          style={[
            styles.confidenceBadge,
            {
              backgroundColor: withAlpha(confidenceColor, 0.11),
              borderColor: withAlpha(confidenceColor, 0.45),
            },
          ]}>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>{confidenceLabel}</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={[styles.uvOrb, { borderColor: withAlpha(visualAccent, 0.45), backgroundColor: withAlpha(visualAccent, 0.17) }]}>
          <Text style={styles.uvMetric}>{uvLabel}</Text>
          <Text style={styles.uvLabel}>{uvSubLabel}</Text>
        </View>
        <View style={styles.stateBlock}>
          <Text style={styles.stateCaps}>Estado solar</Text>
          <Text style={styles.stateValue}>{sunStateLabel}</Text>
          <MetricChip
            accentColor={visualAccent}
            iconName="weather-sunny-alert"
            label={`Máximo previsto UV ${uvMaxForecast}`}
            style={styles.maxPill}
          />
        </View>
      </View>

      <View style={styles.separator} />
      <Text style={styles.headline}>{intensityHeadline}</Text>
      <Text numberOfLines={1} style={styles.support}>
        {intensitySupport}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: 'rgba(198,210,232,0.24)',
    borderRadius: appTheme.radii.xl,
    borderWidth: 1,
    minHeight: 234,
    overflow: 'hidden',
    padding: appTheme.spacing.cardPadding + 1,
    ...appTheme.elevation.card,
  },
  glow: {
    borderRadius: 130,
    height: 260,
    position: 'absolute',
    right: -82,
    top: -72,
    width: 260,
  },
  assetStage: {
    opacity: 0.32,
    position: 'absolute',
    right: -20,
    top: 34,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cityBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(24,36,59,0.42)',
    borderColor: 'rgba(198,210,232,0.24)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cityText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  confidenceBadge: {
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
  },
  confidenceText: {
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10.8,
    letterSpacing: 0.08,
    lineHeight: 13,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.md,
    marginTop: appTheme.spacing.sm + 1,
  },
  uvOrb: {
    alignItems: 'center',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    height: 92,
    justifyContent: 'center',
    width: 92,
  },
  uvMetric: {
    color: appTheme.colors.primary,
    ...appTheme.typography.headline,
    fontSize: 30,
    lineHeight: 34,
  },
  uvLabel: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 10.5,
    lineHeight: 15,
  },
  stateBlock: {
    flex: 1,
  },
  stateCaps: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.1,
    lineHeight: 15,
  },
  stateValue: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontSize: 23,
    lineHeight: 28,
    marginTop: 2,
  },
  maxPill: {
    alignSelf: 'flex-start',
    marginTop: appTheme.spacing.xs,
  },
  separator: {
    backgroundColor: 'rgba(198,210,232,0.28)',
    height: StyleSheet.hairlineWidth,
    marginTop: appTheme.spacing.md,
    width: '100%',
  },
  headline: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 19.5,
    letterSpacing: 0.1,
    lineHeight: 24,
    marginTop: appTheme.spacing.sm,
  },
  support: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 11.8,
    lineHeight: 16,
    marginTop: 5,
  },
});
