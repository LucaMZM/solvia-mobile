import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';

import { AppScreen } from '@/src/components/ui/AppScreen';
import { AnimatedWeatherAsset } from '@/src/features/weatherVisuals/AnimatedWeatherAsset';
import { PremiumSkeleton } from '@/src/components/ui/PremiumSkeleton';
import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { appTheme } from '@/src/theme/tokens';

interface WeatherScreenSkeletonProps {
  cards?: number;
}

export function WeatherScreenSkeleton({ cards = 4 }: WeatherScreenSkeletonProps) {
  const reducedMotionEnabled = useReducedMotionPreference();

  return (
    <AppScreen withHeader={false}>
      <Animated.View
        entering={reducedMotionEnabled ? undefined : FadeInUp.duration(260).easing(Easing.out(Easing.cubic))}
        style={styles.loadingHero}>
        <Text accessibilityRole="header" style={styles.brand}>Solvía</Text>
        <Text style={styles.byline}>by Mazmi Systems</Text>
        <AnimatedWeatherAsset assetKey="partly-cloudy" size={142} />
        <Text style={styles.loadingText}>Actualizando tu clima…</Text>
        <Text style={styles.loadingSupport}>Preparando una lectura clara para salir mejor.</Text>
      </Animated.View>

      {Array.from({ length: Math.min(cards, 3) }).map((_, index) => (
        <Animated.View
          entering={
            reducedMotionEnabled
              ? undefined
              : FadeInUp.duration(260).delay(70 + (index * 45)).easing(Easing.out(Easing.cubic))
          }
          key={`skeleton-anim-${index}`}
          style={styles.skeletonCard}>
            <View style={styles.row}>
              <PremiumSkeleton borderRadius={appTheme.radii.full} height={28} width={28} />
              <PremiumSkeleton height={14} width="44%" />
            </View>
            <PremiumSkeleton height={16} style={styles.gapMd} width="100%" />
            <PremiumSkeleton height={16} style={styles.gapXs} width="86%" />
            <PremiumSkeleton height={16} style={styles.gapXs} width="62%" />
        </Animated.View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingHero: {
    alignItems: 'center',
    borderColor: 'rgba(198,210,232,0.18)',
    borderRadius: appTheme.radii.xl + 4,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: appTheme.spacing.lg,
    minHeight: 292,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.xl,
  },
  brand: {
    color: appTheme.colors.primary,
    ...appTheme.typography.title,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 28,
    letterSpacing: 0.24,
    lineHeight: 34,
  },
  byline: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.18,
    lineHeight: 15,
    marginBottom: appTheme.spacing.xs,
    marginTop: 2,
  },
  loadingText: {
    color: appTheme.colors.onSurface,
    ...appTheme.typography.bodyLg,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 16,
    lineHeight: 22,
    marginTop: appTheme.spacing.sm,
  },
  loadingSupport: {
    color: appTheme.colors.onSurfaceVariant,
    ...appTheme.typography.functional,
    fontSize: 12,
    lineHeight: 16,
    marginTop: appTheme.spacing.xs,
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: 'rgba(26,42,69,0.22)',
    borderColor: 'rgba(154,172,202,0.14)',
    borderRadius: appTheme.radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: appTheme.spacing.cardPadding,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
  gapMd: {
    marginTop: appTheme.spacing.md,
  },
  gapSm: {
    marginTop: appTheme.spacing.sm,
  },
  gapXs: {
    marginTop: appTheme.spacing.xs,
  },
});
