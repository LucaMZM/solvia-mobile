import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
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
import {
  getWeatherHeroAssetForArtworkKey,
  getWeatherHeroAssetForState,
} from '@/src/features/weatherHeroAssets/weatherHeroAssetCatalog';
import { getHeroAssetProfile } from '@/src/features/weatherHeroAssets/heroAssetProfiles';
import type { WeatherHeroArtworkKey } from '@/src/components/ui/weatherHeroVisualConfig';
import { ProceduralHeroScene } from '@/src/features/weatherHeroAssets/ProceduralHeroScene';
import type { WeatherState } from '@/src/types/recommendations';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface WeatherHeroAssetProps {
  weatherState: WeatherState;
  accentColor: string;
  artworkKey?: WeatherHeroArtworkKey;
}

export function WeatherHeroAsset({ weatherState, accentColor, artworkKey }: WeatherHeroAssetProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const [loadFailed, setLoadFailed] = useState(false);
  const assetEntry = artworkKey
    ? getWeatherHeroAssetForArtworkKey(artworkKey)
    : getWeatherHeroAssetForState(weatherState);
  const profile = getHeroAssetProfile(weatherState);
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0);
  const imageReveal = useSharedValue(0);

  const imageSource = assetEntry.imageSource ?? undefined;
  const isImageAsset = assetEntry.metadata.kind === 'image';
  const shouldUseImage = Boolean(imageSource) && !loadFailed;

  useEffect(() => {
    setLoadFailed(false);
    imageReveal.value = withTiming(0, { duration: 0 });
  }, [imageReveal, imageSource, weatherState]);

  const containerStyle = useAnimatedStyle(() => {
    if (reducedMotionEnabled) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }],
      };
    }

    return {
      opacity: interpolate(pulse.value, [0, 1], [0.93, 1]),
      transform: [
        { translateX: interpolate(drift.value, [0, 1], [-profile.motion.driftX, profile.motion.driftX]) },
        { translateY: interpolate(drift.value, [0, 1], [profile.motion.driftY, -profile.motion.driftY]) },
        { scale: interpolate(pulse.value, [0, 1], [profile.motion.pulseMin, profile.motion.pulseMax]) },
        { rotate: `${interpolate(drift.value, [0, 1], [-profile.motion.tiltDeg, profile.motion.tiltDeg])}deg` },
      ],
    };
  });

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageReveal.value,
  }));

  const fallbackStyle = useAnimatedStyle(() => ({
    opacity: 1 - imageReveal.value,
  }));

  useEffect(() => {
    if (reducedMotionEnabled) {
      drift.value = withTiming(0, { duration: 0 });
      pulse.value = withTiming(0, { duration: 0 });
      return;
    }

    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: profile.motion.driftDurationMs, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: profile.motion.driftDurationMs, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: profile.motion.pulseDurationMs, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: profile.motion.pulseDurationMs, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [drift, profile.motion, pulse, reducedMotionEnabled]);

  const fallbackScene = useMemo(
    () => <ProceduralHeroScene accentColor={accentColor} sceneKind={profile.sceneKind} />,
    [accentColor, profile.sceneKind],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: profile.placement.top,
          right: profile.placement.right,
          width: profile.placement.width,
          height: profile.placement.height,
        },
        containerStyle,
      ]}>
      <Animated.View style={[styles.layer, fallbackStyle]}>{fallbackScene}</Animated.View>

      {shouldUseImage && isImageAsset ? (
        <AnimatedImage
          onError={() => {
            setLoadFailed(true);
            imageReveal.value = withTiming(0, { duration: 140 });
          }}
          onLoad={() => {
            imageReveal.value = withTiming(1, {
              duration: reducedMotionEnabled ? 0 : 320,
              easing: Easing.out(Easing.cubic),
            });
          }}
          resizeMode="contain"
          source={imageSource}
          style={[styles.image, imageStyle]}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
});
