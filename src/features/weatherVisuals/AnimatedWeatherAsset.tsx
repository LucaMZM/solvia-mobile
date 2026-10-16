import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import {
  getWeatherAsset,
  getWeatherVisualAsset,
  type WeatherAssetInput,
  type WeatherAssetKey,
} from '@/src/features/weatherVisuals/weatherAssets';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface AnimatedWeatherAssetProps {
  assetKey?: WeatherAssetKey;
  weather?: WeatherAssetInput;
  accentColor?: string;
  size?: number;
  showDebugLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface MotionProfile {
  durationMs: number;
  driftX: number;
  driftY: number;
  minScale: number;
  maxScale: number;
  tiltDeg: number;
  glowOpacity: number;
  glowColor: string;
}

const profileByAsset: Record<WeatherAssetKey, MotionProfile> = {
  sunny: {
    durationMs: 6400,
    driftX: 3,
    driftY: 8,
    minScale: 0.985,
    maxScale: 1.025,
    tiltDeg: 2,
    glowOpacity: 0.3,
    glowColor: appTheme.colors.warning,
  },
  'partly-cloudy': {
    durationMs: 7600,
    driftX: 7,
    driftY: 6,
    minScale: 0.99,
    maxScale: 1.018,
    tiltDeg: 1.2,
    glowOpacity: 0.22,
    glowColor: appTheme.colors.secondary,
  },
  cloudy: {
    durationMs: 7800,
    driftX: 8,
    driftY: 5,
    minScale: 0.992,
    maxScale: 1.014,
    tiltDeg: 0.8,
    glowOpacity: 0.18,
    glowColor: appTheme.colors.rainy,
  },
  rain: {
    durationMs: 7000,
    driftX: 5,
    driftY: 6,
    minScale: 0.99,
    maxScale: 1.018,
    tiltDeg: 0.6,
    glowOpacity: 0.18,
    glowColor: appTheme.colors.rainy,
  },
  storm: {
    durationMs: 6400,
    driftX: 5,
    driftY: 5,
    minScale: 0.99,
    maxScale: 1.016,
    tiltDeg: 0.6,
    glowOpacity: 0.24,
    glowColor: appTheme.colors.warning,
  },
  wind: {
    durationMs: 5600,
    driftX: 14,
    driftY: 4,
    minScale: 0.992,
    maxScale: 1.015,
    tiltDeg: 1.2,
    glowOpacity: 0.18,
    glowColor: appTheme.colors.secondary,
  },
  'night-clear': {
    durationMs: 9400,
    driftX: 4,
    driftY: 6,
    minScale: 0.99,
    maxScale: 1.015,
    tiltDeg: 0.8,
    glowOpacity: 0.24,
    glowColor: appTheme.colors.secondary,
  },
  'night-cloudy': {
    durationMs: 9000,
    driftX: 7,
    driftY: 5,
    minScale: 0.992,
    maxScale: 1.014,
    tiltDeg: 0.8,
    glowOpacity: 0.2,
    glowColor: appTheme.colors.secondary,
  },
  fog: {
    durationMs: 9800,
    driftX: 12,
    driftY: 3,
    minScale: 0.995,
    maxScale: 1.01,
    tiltDeg: 0,
    glowOpacity: 0.14,
    glowColor: appTheme.colors.rainy,
  },
  snow: {
    durationMs: 9400,
    driftX: 5,
    driftY: 5,
    minScale: 0.992,
    maxScale: 1.016,
    tiltDeg: 0.6,
    glowOpacity: 0.22,
    glowColor: appTheme.colors.secondary,
  },
};

function getResolvedMotionKey(assetKey: WeatherAssetKey): WeatherAssetKey {
  return profileByAsset[assetKey] ? assetKey : 'partly-cloudy';
}

export function AnimatedWeatherAsset({
  assetKey,
  weather,
  accentColor,
  size = 214,
  showDebugLabel = false,
  style,
}: AnimatedWeatherAssetProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const resolved = useMemo(() => {
    return assetKey
      ? getWeatherVisualAsset(assetKey)
      : weather
        ? getWeatherAsset(weather)
        : getWeatherVisualAsset('partly-cloudy');
  }, [
    assetKey,
    weather?.cloudCoverPct,
    weather?.isDay,
    weather?.precipitationMm,
    weather?.precipitationProbability,
    weather?.weatherCode,
    weather?.windGustKmh,
    weather?.windSpeedKmh,
  ]);

  const motionKey = getResolvedMotionKey(resolved.key);
  const profile = profileByAsset[motionKey];
  const ambientAccent = accentColor ?? profile.glowColor;

  useEffect(() => {
    if (__DEV__) {
      console.info('[weather-asset]', {
        assetKey: resolved.key,
        weatherCode: weather?.weatherCode ?? null,
        isDay: weather?.isDay ?? null,
        source: resolved.sourceRoot,
      });
    }
  }, [resolved.key, resolved.sourceRoot, weather?.isDay, weather?.weatherCode]);

  useEffect(() => {
    if (reducedMotionEnabled) {
      drift.stopAnimation();
      pulse.stopAnimation();
      drift.setValue(0);
      pulse.setValue(0);
      return;
    }

    const driftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          duration: profile.durationMs,
          easing: Easing.inOut(Easing.sin),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          duration: profile.durationMs,
          easing: Easing.inOut(Easing.sin),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: Math.round(profile.durationMs * 0.72),
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: Math.round(profile.durationMs * 0.72),
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    driftAnimation.start();
    pulseAnimation.start();

    return () => {
      driftAnimation.stop();
      pulseAnimation.stop();
    };
  }, [drift, profile.durationMs, pulse, reducedMotionEnabled]);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-profile.driftX, profile.driftX],
  });
  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.driftY, -profile.driftY],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.minScale, profile.maxScale],
  });
  const rotate = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${profile.tiltDeg}deg`, `${profile.tiltDeg}deg`],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.glowOpacity * 0.58, profile.glowOpacity],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  const imageTransform = reducedMotionEnabled
    ? [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }]
    : [{ translateX }, { translateY }, { scale }, { rotate }];
  const glowTransform = reducedMotionEnabled ? [{ scale: 1 }] : [{ scale: glowScale }];

  return (
    <View pointerEvents="none" style={[styles.wrapper, { height: size, width: size }, style]}>
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: withAlpha(ambientAccent, 0.92),
            opacity: reducedMotionEnabled ? profile.glowOpacity : glowOpacity,
            transform: glowTransform,
          },
        ]}
      />
      <AnimatedImage
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={resolved.source}
        style={[styles.image, { transform: imageTransform }]}
      />
      {__DEV__ && showDebugLabel ? <Text style={styles.debugLabel}>asset: {resolved.key}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    borderRadius: 999,
    height: '72%',
    position: 'absolute',
    shadowColor: '#ffffff',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    width: '72%',
  },
  image: {
    height: '98%',
    width: '98%',
  },
  debugLabel: {
    backgroundColor: withAlpha(appTheme.colors.surface, 0.64),
    borderRadius: appTheme.radii.sm,
    bottom: 0,
    color: appTheme.colors.onSurface,
    fontFamily: appTheme.fontFamilies.sansMedium,
    fontSize: 10,
    letterSpacing: 0.2,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
  },
});
