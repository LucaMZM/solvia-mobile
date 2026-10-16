import type { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedWeatherAsset } from '@/src/features/weatherVisuals/AnimatedWeatherAsset';
import { getWeatherVisualKeyFromState } from '@/src/features/weatherVisuals/weatherAssets';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import type { WeatherState } from '@/src/types/recommendations';

interface LaunchFrameProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  weatherState: WeatherState;
  accentColor: string;
  gradient: [string, string, string];
}

export function LaunchFrame({
  title,
  subtitle,
  weatherState,
  accentColor,
  gradient,
  children,
}: LaunchFrameProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFillObject} />
        <View style={styles.assetStage}>
          <AnimatedWeatherAsset
            accentColor={accentColor}
            assetKey={getWeatherVisualKeyFromState(weatherState)}
            size={230}
          />
        </View>
        <LinearGradient
          colors={[
            withAlpha('#0d1018', 0.08),
            withAlpha('#0d1018', 0.24),
            appTheme.colors.background,
          ]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.inner}>
          <View>
            <Text style={styles.brand}>SOLVÍA</Text>
            <Text style={styles.byline}>by Mazmi Systems</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: appTheme.colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
  },
  assetStage: {
    opacity: 0.38,
    position: 'absolute',
    right: -36,
    top: 70,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  brand: {
    color: appTheme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    ...appTheme.typography.labelCaps,
    fontSize: 9.8,
    letterSpacing: 1,
    lineHeight: 14,
  },
  byline: {
    color: withAlpha(appTheme.colors.primary, 0.74),
    ...appTheme.typography.functional,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 11,
    letterSpacing: 0.22,
    lineHeight: 15,
    marginTop: 2,
  },
  title: {
    color: appTheme.colors.primary,
    marginTop: appTheme.spacing.sm,
    ...appTheme.typography.title,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    color: appTheme.colors.onSurfaceVariant,
    marginTop: appTheme.spacing.xs,
    ...appTheme.typography.functional,
    fontSize: 13.2,
    lineHeight: 18,
  },
});
