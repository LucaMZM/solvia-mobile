import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInUp, Layout } from 'react-native-reanimated';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface SectionCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function SectionCard({ children, style }: SectionCardProps) {
  const reducedMotionEnabled = useReducedMotionPreference();

  return (
    <Animated.View
      entering={reducedMotionEnabled ? undefined : FadeInUp.duration(360).easing(Easing.out(Easing.cubic))}
      layout={reducedMotionEnabled ? undefined : Layout.springify().damping(20).stiffness(160)}
      style={[styles.card, style]}>
      <View style={styles.inner}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: withAlpha(appTheme.colors.surfaceContainerLowest, 0.14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: withAlpha(appTheme.colors.outline, 0.2),
    borderRadius: 0,
    overflow: 'visible',
  },
  inner: {
    paddingHorizontal: appTheme.spacing.cardPadding - 1,
    paddingVertical: appTheme.spacing.sm + 4,
  },
});
