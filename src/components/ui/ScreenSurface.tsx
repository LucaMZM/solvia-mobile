import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { withAlpha } from '@/src/theme/colorUtils';
import { appTheme } from '@/src/theme/tokens';

interface ScreenSurfaceProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function ScreenSurface({ children, style }: ScreenSurfaceProps) {
  return (
    <View style={[styles.surface, style]}>
      <LinearGradient
        colors={[
          withAlpha(appTheme.colors.surfaceContainerLow, 0.46),
          withAlpha(appTheme.colors.surfaceContainerLowest, 0.28),
          withAlpha(appTheme.colors.surfaceContainerLow, 0.16),
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.surfaceGlowTop} />
      <View style={styles.surfaceGlowBottom} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderColor: withAlpha(appTheme.colors.outline, 0.16),
    borderRadius: appTheme.radii.xl + 2,
    borderWidth: 1,
    gap: 0,
    overflow: 'hidden',
    paddingBottom: appTheme.spacing.xs,
    paddingTop: 1,
    position: 'relative',
  },
  surfaceGlowTop: {
    backgroundColor: withAlpha(appTheme.colors.secondary, 0.08),
    borderRadius: 140,
    height: 170,
    position: 'absolute',
    right: -70,
    top: -92,
    width: 210,
  },
  surfaceGlowBottom: {
    backgroundColor: withAlpha(appTheme.colors.warning, 0.045),
    borderRadius: 160,
    bottom: -110,
    height: 220,
    left: -96,
    position: 'absolute',
    width: 240,
  },
});
