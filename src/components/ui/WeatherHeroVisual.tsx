import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { getWeatherHeroVisualConfig } from '@/src/components/ui/weatherHeroVisualConfig';
import { WeatherHeroAsset } from '@/src/features/weatherHeroAssets/WeatherHeroAsset';
import { withAlpha } from '@/src/theme/colorUtils';
import type { WeatherState } from '@/src/types/recommendations';

interface WeatherHeroVisualProps {
  weatherState: WeatherState;
  accentColor: string;
}

const RAIN_DROPS = [
  { left: '10%', top: '34%', height: 20 },
  { left: '18%', top: '41%', height: 16 },
  { left: '27%', top: '33%', height: 21 },
  { left: '35%', top: '45%', height: 17 },
  { left: '45%', top: '37%', height: 18 },
  { left: '53%', top: '43%', height: 20 },
  { left: '61%', top: '36%', height: 17 },
  { left: '69%', top: '45%', height: 19 },
  { left: '78%', top: '37%', height: 17 },
  { left: '87%', top: '43%', height: 18 },
] as const;

const WIND_STREAKS = [
  { left: '8%', top: '22%', width: 86, rotation: -8 },
  { left: '21%', top: '31%', width: 68, rotation: -5 },
  { left: '35%', top: '20%', width: 92, rotation: -9 },
  { left: '49%', top: '30%', width: 80, rotation: -6 },
  { left: '63%', top: '22%', width: 90, rotation: -8 },
  { left: '12%', top: '58%', width: 76, rotation: -7 },
  { left: '38%', top: '62%', width: 84, rotation: -9 },
  { left: '66%', top: '56%', width: 70, rotation: -5 },
] as const;

const STAR_POINTS = [
  { left: '12%', top: '16%', size: 3 },
  { left: '21%', top: '10%', size: 2 },
  { left: '30%', top: '22%', size: 3 },
  { left: '39%', top: '14%', size: 2 },
  { left: '49%', top: '18%', size: 2 },
  { left: '59%', top: '12%', size: 3 },
  { left: '68%', top: '24%', size: 2 },
  { left: '77%', top: '16%', size: 3 },
  { left: '86%', top: '10%', size: 2 },
] as const;

export function WeatherHeroVisual({ weatherState, accentColor }: WeatherHeroVisualProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const config = getWeatherHeroVisualConfig(weatherState);
  const drift = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const rainPhase = useSharedValue(0);
  const windPhase = useSharedValue(0);
  const twinkle = useSharedValue(0);

  const shouldAnimateRain = config.rainOpacity > 0.01;
  const shouldAnimateWind = config.windOpacity > 0.01;
  const shouldAnimateTwinkle = config.starOpacity > 0.01;

  useEffect(() => {
    if (reducedMotionEnabled) {
      drift.value = withTiming(0, { duration: 0 });
      shimmer.value = withTiming(0, { duration: 0 });
      rainPhase.value = withTiming(0, { duration: 0 });
      windPhase.value = withTiming(0, { duration: 0 });
      twinkle.value = withTiming(0, { duration: 0 });
      return;
    }

    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 5400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    rainPhase.value = shouldAnimateRain
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 1200, easing: Easing.linear }),
            withTiming(0, { duration: 0, easing: Easing.linear }),
          ),
          -1,
          false,
        )
      : withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });

    windPhase.value = shouldAnimateWind
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        )
      : withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });

    twinkle.value = shouldAnimateTwinkle
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          false,
        )
      : withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
  }, [
    drift,
    rainPhase,
    reducedMotionEnabled,
    shimmer,
    shouldAnimateRain,
    shouldAnimateTwinkle,
    shouldAnimateWind,
    twinkle,
    windPhase,
  ]);

  const backlightStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled
      ? config.horizonGlowOpacity * 0.68
      : interpolate(shimmer.value, [0, 1], [config.horizonGlowOpacity * 0.54, config.horizonGlowOpacity * 0.88]),
    transform: [
      { translateX: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [-10, 12]) },
      { translateY: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [8, -8]) },
      { scale: reducedMotionEnabled ? 1 : interpolate(shimmer.value, [0, 1], [0.95, 1.08]) },
    ],
  }));

  const ambientMistStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled
      ? config.ambientMistOpacity * 0.8
      : interpolate(drift.value, [0, 1], [config.ambientMistOpacity * 0.64, config.ambientMistOpacity * 1.08]),
    transform: [
      { translateX: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [-8, 10]) },
      { translateY: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [2, -7]) },
      { scale: reducedMotionEnabled ? 1 : interpolate(shimmer.value, [0, 1], [0.96, 1.08]) },
    ],
  }));

  const rainStyle = useAnimatedStyle(() => ({
    opacity: config.rainOpacity,
    transform: [{ translateY: reducedMotionEnabled ? 0 : interpolate(rainPhase.value, [0, 1], [-6, 16]) }],
  }));

  const windStyle = useAnimatedStyle(() => ({
    opacity: config.windOpacity,
    transform: [{ translateX: reducedMotionEnabled ? 0 : interpolate(windPhase.value, [0, 1], [-14, 14]) }],
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled
      ? config.starOpacity * 0.8
      : interpolate(twinkle.value, [0, 1], [config.starOpacity * 0.62, config.starOpacity]),
    transform: [
      { translateX: reducedMotionEnabled ? 0 : interpolate(twinkle.value, [0, 1], [0, 3]) },
      { translateY: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [-1, 2]) },
    ],
  }));

  const lightBloomStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled
      ? config.orbHaloOpacity * 0.5
      : interpolate(shimmer.value, [0, 1], [config.orbHaloOpacity * 0.34, config.orbHaloOpacity * 0.7]),
    transform: [
      { translateX: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [-6, 9]) },
      { translateY: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [5, -6]) },
      { scale: reducedMotionEnabled ? 1 : interpolate(shimmer.value, [0, 1], [0.96, 1.1]) },
    ],
  }));

  const cloudDepthStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled
      ? config.cloudOpacity * 0.16
      : interpolate(drift.value, [0, 1], [config.cloudOpacity * 0.12, config.cloudOpacity * 0.22]),
    transform: [
      { translateX: reducedMotionEnabled ? 0 : interpolate(drift.value, [0, 1], [-7, 8]) },
      { translateY: reducedMotionEnabled ? 0 : interpolate(shimmer.value, [0, 1], [3, -4]) },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.backLight, backlightStyle]}>
        <LinearGradient
          colors={[
            withAlpha(accentColor, 0),
            withAlpha(accentColor, 0.22),
            withAlpha(accentColor, 0),
          ]}
          end={{ x: 0.95, y: 0.98 }}
          start={{ x: 0.08, y: 0.08 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[styles.lightBloom, lightBloomStyle]}>
        <LinearGradient
          colors={[
            withAlpha(accentColor, 0),
            withAlpha(accentColor, 0.28 * config.orbIntensity),
            withAlpha(accentColor, 0),
          ]}
          end={{ x: 0.9, y: 0.9 }}
          start={{ x: 0.1, y: 0.1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <WeatherHeroAsset
        accentColor={accentColor}
        artworkKey={config.replaceableArtworkKey}
        weatherState={weatherState}
      />

      <Animated.View style={[styles.cloudDepth, cloudDepthStyle]}>
        <LinearGradient
          colors={[
            withAlpha('#f5f9ff', 0),
            withAlpha('#f5f9ff', 0.28),
            withAlpha('#f5f9ff', 0),
          ]}
          end={{ x: 0.95, y: 0.92 }}
          start={{ x: 0.1, y: 0.08 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <Animated.View style={[styles.ambientMist, ambientMistStyle]}>
        <LinearGradient
          colors={[
            withAlpha(config.ambientMistColor, 0),
            withAlpha(config.ambientMistColor, 0.45),
            withAlpha(config.ambientMistColor, 0),
          ]}
          end={{ x: 0.95, y: 0.98 }}
          start={{ x: 0.12, y: 0.08 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.horizonWrap}>
        <LinearGradient
          colors={[
            withAlpha(config.horizonGlowColor, 0),
            withAlpha(config.horizonGlowColor, config.horizonGlowOpacity),
            withAlpha(config.horizonGlowColor, 0),
          ]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={styles.horizonGlow}
        />
      </View>

      <LinearGradient
        colors={[withAlpha('#08101f', 0.06), withAlpha('#08101f', 0.24)]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.depthVeil}
      />

      {config.starOpacity > 0.01 ? (
        <Animated.View style={[styles.starLayer, starsStyle]}>
          {STAR_POINTS.slice(0, Math.max(2, config.starDensity)).map((star, index) => (
            <View
              key={`${star.left}-${star.top}-${index}`}
              style={[
                styles.starPoint,
                {
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  opacity: 0.4 + ((index % 3) * 0.14),
                },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}

      {config.rainOpacity > 0.01 ? (
        <Animated.View style={[styles.rainLayer, rainStyle]}>
          {RAIN_DROPS.slice(0, Math.max(2, config.rainDensity)).map((drop, index) => (
            <View
              key={`${drop.left}-${drop.top}-${index}`}
              style={[
                styles.rainDrop,
                {
                  left: drop.left,
                  top: drop.top,
                  height: drop.height,
                  opacity: 0.36 + ((index % 4) * 0.12),
                },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}

      {config.windOpacity > 0.01 ? (
        <Animated.View style={[styles.windLayer, windStyle]}>
          {WIND_STREAKS.slice(0, Math.max(2, config.windDensity)).map((streak, index) => (
            <LinearGradient
              colors={[
                withAlpha('#d5e3f4', 0),
                withAlpha('#d5e3f4', 0.52 - ((index % 3) * 0.1)),
                withAlpha('#d5e3f4', 0),
              ]}
              end={{ x: 1, y: 0.5 }}
              key={`${streak.left}-${streak.top}-${index}`}
              start={{ x: 0, y: 0.5 }}
              style={[
                styles.windStreak,
                {
                  left: streak.left,
                  top: streak.top,
                  width: streak.width,
                  transform: [{ rotate: `${streak.rotation}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  backLight: {
    borderRadius: 240,
    height: 280,
    overflow: 'hidden',
    position: 'absolute',
    right: -34,
    top: -24,
    width: 280,
  },
  lightBloom: {
    borderRadius: 220,
    height: 240,
    overflow: 'hidden',
    position: 'absolute',
    right: -8,
    top: 22,
    width: 240,
  },
  cloudDepth: {
    borderRadius: 260,
    height: 210,
    left: -34,
    overflow: 'hidden',
    position: 'absolute',
    top: 118,
    width: 268,
  },
  ambientMist: {
    borderRadius: 280,
    height: 320,
    left: -74,
    overflow: 'hidden',
    position: 'absolute',
    top: 96,
    width: 320,
  },
  horizonWrap: {
    bottom: -54,
    left: -30,
    position: 'absolute',
    right: -30,
  },
  horizonGlow: {
    borderRadius: 170,
    height: 186,
    width: '100%',
  },
  depthVeil: {
    ...StyleSheet.absoluteFillObject,
  },
  rainLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  rainDrop: {
    backgroundColor: withAlpha('#d4e2f4', 0.78),
    borderRadius: 999,
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    width: 2.2,
  },
  windLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  windStreak: {
    borderRadius: 999,
    height: 8,
    position: 'absolute',
  },
  starLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  starPoint: {
    backgroundColor: withAlpha('#f7faff', 0.88),
    borderRadius: 999,
    position: 'absolute',
  },
});
