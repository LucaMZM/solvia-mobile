import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { appTheme } from '@/src/theme/tokens';

interface PremiumSkeletonProps {
  height: number;
  width?: number | `${number}%` | 'auto';
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function PremiumSkeleton({
  height,
  width = '100%',
  borderRadius = appTheme.radii.md,
  style,
}: PremiumSkeletonProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const pulseOpacity = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (reducedMotionEnabled) {
      pulseOpacity.setValue(0.6);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 0.94,
          duration: 820,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.5,
          duration: 820,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulseOpacity, reducedMotionEnabled]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          height,
          width,
          borderRadius,
          backgroundColor: 'rgba(157,198,255,0.17)',
        },
        style,
      ]}>
      <Animated.View
        style={[
          styles.pulseLayer,
          {
            borderRadius,
            opacity: pulseOpacity,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  pulseLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238,244,255,0.34)',
  },
});
