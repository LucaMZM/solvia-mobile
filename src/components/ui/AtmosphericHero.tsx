import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { MetricChip } from '@/src/components/ui/MetricChip';
import type { HeroAtmosphere, WeatherState } from '@/src/types/recommendations';
import { AnimatedWeatherAsset } from '@/src/features/weatherVisuals/AnimatedWeatherAsset';
import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface AtmosphericHeroProps {
  cityName: string;
  temperatureC: number;
  feelsLikeC: number;
  uvIndex: number;
  uvStatus?: 'available' | 'unavailable';
  windSpeedKmh: number;
  windGustKmh: number;
  precipitationProbability: number;
  precipitationMm: number;
  cloudCoverPct: number;
  weatherCode: number;
  isDay: boolean;
  atmosphere: HeroAtmosphere;
  mainHeadline: string;
  supportCopy: string;
  weatherState: WeatherState;
  dailyBriefLine?: string;
}

const stateIconByWeather: Record<WeatherState, keyof typeof MaterialCommunityIcons.glyphMap> = {
  pleasant_sunny: 'white-balance-sunny',
  strong_sun: 'sun-thermometer-outline',
  soft_cloudy: 'weather-cloudy',
  rainy: 'weather-rainy',
  windy: 'weather-windy',
  cool_evening: 'weather-sunset-down',
  golden_hour: 'weather-sunset',
  night_clear: 'weather-night',
};

export function AtmosphericHero({
  cityName,
  temperatureC,
  feelsLikeC,
  uvIndex,
  uvStatus = 'available',
  windSpeedKmh,
  windGustKmh,
  precipitationProbability,
  precipitationMm,
  cloudCoverPct,
  weatherCode,
  isDay,
  atmosphere,
  mainHeadline,
  supportCopy,
  weatherState,
  dailyBriefLine,
}: AtmosphericHeroProps) {
  const stateIcon = stateIconByWeather[weatherState];
  const reducedMotionEnabled = useReducedMotionPreference();

  const uvAvailable = isDay && uvStatus === 'available';
  const uvMetricLabel = !isDay ? 'UV inactivo' : uvAvailable ? `UV ${Math.round(uvIndex)}` : 'UV sin datos';
  const accessibilityUv = !isDay ? 'UV inactivo' : uvAvailable ? `UV ${Math.round(uvIndex)}` : 'UV sin datos';
  const rainMetricLabel = precipitationProbability >= 8 ? `Lluvia ${Math.round(precipitationProbability)}%` : 'Lluvia baja';

  return (
    <Animated.View
      accessibilityLabel={`${cityName}. ${atmosphere.title}. ${Math.round(temperatureC)} grados, sensación ${Math.round(feelsLikeC)}. ${accessibilityUv} y viento ${Math.round(windSpeedKmh)} kilómetros por hora.`}
      accessibilityRole="image"
      entering={reducedMotionEnabled ? undefined : FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}
      style={styles.wrapper}>
      <LinearGradient colors={atmosphere.gradientColors} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.radialGlow, { backgroundColor: withAlpha(atmosphere.accent, 0.16) }]} />
      <LinearGradient
        colors={[
          'rgba(8,13,25,0.02)',
          'rgba(8,13,25,0.1)',
          'rgba(8,13,25,0.42)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(10,16,31,0.32)', 'rgba(10,16,31,0.02)']}
        end={{ x: 0.46, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.heroScene}>
        <View style={styles.visualStage}>
          <AnimatedWeatherAsset
            accentColor={atmosphere.accent}
            size={230}
            weather={{
              weatherCode,
              isDay,
              precipitationProbability,
              precipitationMm,
              windSpeedKmh,
              windGustKmh,
              cloudCoverPct,
            }}
          />
        </View>

        <View style={styles.locationBlock}>
          <View style={styles.cityBadge}>
            <MaterialCommunityIcons color={appTheme.colors.onSurfaceVariant} name="map-marker-outline" size={14} />
            <Text style={styles.city}>{cityName}</Text>
          </View>
          <View style={styles.badge}>
            <MaterialCommunityIcons color={atmosphere.accent} name={stateIcon} size={14} />
            <Text style={[styles.badgeText, { color: atmosphere.accent }]}>{atmosphere.badge}</Text>
          </View>
        </View>

        <View style={styles.midRow}>
          <View style={styles.temperatureBlock}>
            <Text style={styles.temperatureText}>{Math.round(temperatureC)}°</Text>
            <Text style={styles.feelsLikeText}>Sensación {Math.round(feelsLikeC)}°</Text>
          </View>
          <View style={styles.heroSpacer} />
        </View>

        <Text style={styles.headline}>{mainHeadline}</Text>
        <Text numberOfLines={1} style={styles.supportCopy}>
          {dailyBriefLine ?? supportCopy}
        </Text>

        <View style={styles.metricsRow}>
          <MetricChip accentColor={appTheme.colors.warning} iconName="white-balance-sunny" label={uvMetricLabel} />
          <MetricChip accentColor={appTheme.colors.secondary} iconName="weather-windy" label={`${Math.round(windSpeedKmh)} km/h`} />
          <MetricChip accentColor={appTheme.colors.rainy} iconName="weather-pouring" label={rainMetricLabel} />
          <MetricChip accentColor={atmosphere.accent} iconName="thermometer" label={`Sensación ${Math.round(feelsLikeC)}°`} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: 'rgba(198,210,232,0.22)',
    borderWidth: 1,
    borderRadius: 34,
    minHeight: 392,
    overflow: 'hidden',
    paddingHorizontal: appTheme.spacing.heroPadding + 2,
    paddingBottom: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    ...appTheme.elevation.card,
  },
  radialGlow: {
    borderRadius: 180,
    height: 360,
    position: 'absolute',
    right: -96,
    top: -70,
    width: 360,
  },
  heroScene: {
    flex: 1,
    position: 'relative',
  },
  visualStage: {
    alignItems: 'center',
    bottom: 12,
    justifyContent: 'center',
    opacity: 0.98,
    position: 'absolute',
    right: -30,
    top: 18,
    width: '68%',
  },
  locationBlock: {
    gap: appTheme.spacing.xs,
    paddingRight: appTheme.spacing.sm,
  },
  cityBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(24,36,59,0.44)',
    borderColor: 'rgba(198,210,232,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(24,36,59,0.44)',
    borderColor: 'rgba(198,210,232,0.26)',
    borderRadius: appTheme.radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    textTransform: 'uppercase',
    ...appTheme.typography.labelCaps,
    fontSize: 9.2,
    lineHeight: 12,
    letterSpacing: 0.85,
  },
  midRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: appTheme.spacing.lg,
  },
  temperatureBlock: {
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  temperatureText: {
    color: appTheme.colors.primary,
    ...appTheme.typography.headline,
    fontSize: 82,
    letterSpacing: -1.2,
    lineHeight: 86,
  },
  heroSpacer: {
    width: 112,
  },
  feelsLikeText: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
  },
  city: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.08,
  },
  headline: {
    color: appTheme.colors.primary,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 29,
    lineHeight: 34,
    maxWidth: '86%',
  },
  supportCopy: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: 4,
    ...appTheme.typography.body,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '82%',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.md,
  },
});
