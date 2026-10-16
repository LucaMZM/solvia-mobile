import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { triggerLightHaptic, triggerSelectionHaptic } from '@/src/services/feedback/haptics';

type MotionHapticType = 'selection' | 'light' | 'none';

interface MotionPressableProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  contentStyle?: StyleProp<ViewStyle>;
  hapticType?: MotionHapticType;
  pressedScale?: number;
  pressedOpacity?: number;
  reducedMotionPressedOpacity?: number;
}

function resolvePressableStyle(
  style: MotionPressableProps['style'],
  state: PressableStateCallbackType,
): StyleProp<ViewStyle> {
  if (typeof style === 'function') {
    return style(state);
  }

  return style;
}

async function triggerHaptic(hapticType: MotionHapticType) {
  if (hapticType === 'selection') {
    await triggerSelectionHaptic();
    return;
  }
  if (hapticType === 'light') {
    await triggerLightHaptic();
  }
}

export function MotionPressable({
  children,
  contentStyle,
  hapticType = 'none',
  onPressIn,
  onPressOut,
  pressedOpacity = 0.92,
  pressedScale = 0.985,
  reducedMotionPressedOpacity = 0.84,
  style,
  ...props
}: MotionPressableProps) {
  const reducedMotionEnabled = useReducedMotionPreference();
  const pressProgress = useSharedValue(0);

  const animatedFeedbackStyle = useAnimatedStyle(() => {
    if (reducedMotionEnabled) {
      return {
        opacity: interpolate(pressProgress.value, [0, 1], [1, reducedMotionPressedOpacity]),
        transform: [{ scale: 1 }],
      };
    }

    return {
      opacity: interpolate(pressProgress.value, [0, 1], [1, pressedOpacity]),
      transform: [{ scale: interpolate(pressProgress.value, [0, 1], [1, pressedScale]) }],
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    pressProgress.value = withTiming(1, {
      duration: reducedMotionEnabled ? 0 : 110,
      easing: Easing.out(Easing.quad),
    });
    if (hapticType !== 'none') {
      void triggerHaptic(hapticType);
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressProgress.value = withTiming(0, {
      duration: reducedMotionEnabled ? 0 : 160,
      easing: Easing.out(Easing.cubic),
    });
    onPressOut?.(event);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={(state) => resolvePressableStyle(style, state)}
      {...props}>
      <Animated.View style={[styles.inner, contentStyle, animatedFeedbackStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexShrink: 1,
  },
});
