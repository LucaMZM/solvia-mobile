import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReducedMotionPreference } from '@/src/hooks/useReducedMotionPreference';
import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';
import { TopAppBar } from '@/src/components/ui/TopAppBar';

interface AppScreenProps extends PropsWithChildren {
  withHeader?: boolean;
}

export function AppScreen({ children, withHeader = true }: AppScreenProps) {
  const isFocused = useIsFocused();
  const reducedMotionEnabled = useReducedMotionPreference();
  const focusProgress = useSharedValue(reducedMotionEnabled ? 1 : 0.92);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0.9, {
      duration: reducedMotionEnabled ? 0 : 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [focusProgress, isFocused, reducedMotionEnabled]);

  const contentMotionStyle = useAnimatedStyle(() => ({
    opacity: reducedMotionEnabled ? 1 : focusProgress.value,
    transform: [
      { translateY: reducedMotionEnabled ? 0 : (1 - focusProgress.value) * 10 },
    ],
  }));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <LinearGradient
        colors={[appTheme.colors.background, '#14213a', appTheme.colors.surfaceDim]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />
      {withHeader ? <TopAppBar /> : null}
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <Animated.View style={[styles.inner, contentMotionStyle]}>{children}</Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: appTheme.colors.background,
    flex: 1,
  },
  topGlow: {
    backgroundColor: withAlpha(appTheme.colors.secondary, 0.12),
    borderRadius: 180,
    height: 260,
    position: 'absolute',
    right: -96,
    top: -126,
    width: 300,
  },
  bottomGlow: {
    backgroundColor: withAlpha(appTheme.colors.warning, 0.06),
    borderRadius: 220,
    bottom: -150,
    height: 300,
    left: -120,
    position: 'absolute',
    width: 330,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: appTheme.spacing.bottomInset + 4,
  },
  inner: {
    gap: appTheme.spacing.sm + 2,
    paddingHorizontal: appTheme.spacing.pageHorizontal - 1,
    paddingTop: appTheme.spacing.sm + 2,
  },
});
